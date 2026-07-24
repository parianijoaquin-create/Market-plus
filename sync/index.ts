// ═══════════════════════════════════════════════════════════════════
// Market Pulse — orquestador de sincronizacion.
// Corre en GitHub Actions (o local con `npm run sync`).
//
// Flujo:
//   1. abre un sync_run
//   2. dolar (DolarAPI, fallback Bluelytics) -> siempre
//   3. acciones argentinas (data912) -> solo si el mercado esta abierto
//   4. registra errores por fuente sin frenar las demas
//   5. cierra el run con ok | partial | failed
//   6. purga datos viejos una vez por dia
// ═══════════════════════════════════════════════════════════════════
import { db, SOURCE } from './db.js';
import { fetchDolarApi, fetchBluelytics } from './sources/dolarapi.js';
import { fetchArgStocks } from './sources/data912.js';
import { isStockMarketOpen, tradeDateArt } from './market-hours.js';

interface SourceResult {
  source: string;
  ok: boolean;
  rows: number;
  error?: string;
}

async function main() {
  const startedAt = new Date().toISOString();
  const results: SourceResult[] = [];
  const errors: { source_id: number; message: string }[] = [];
  let rowsWritten = 0;

  // 1) abrir sync_run
  const { data: run, error: runErr } = await db
    .from('sync_runs')
    .insert({ started_at: startedAt, status: 'ok' })
    .select('id')
    .single();
  if (runErr || !run) {
    console.error('No se pudo crear sync_run:', runErr?.message);
    process.exit(1);
  }
  const runId = run.id as number;

  // 2) DOLAR (siempre)
  try {
    let rates = await tryDolar();
    const rows = rates.map((r) => ({
      kind: r.kind,
      buy: r.buy,
      sell: r.sell,
      source_id: r.source === 'dolarapi' ? SOURCE.dolarapi : SOURCE.bluelytics,
      quoted_at: r.quoted_at,
    }));
    if (rows.length) {
      const { error } = await db
        .from('fx_rates')
        .upsert(rows, { onConflict: 'kind,quoted_at', ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
    rowsWritten += rows.length;
    results.push({ source: 'dolar', ok: true, rows: rows.length });
    await touchSource(SOURCE.dolarapi);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ source: 'dolar', ok: false, rows: 0, error: message });
    errors.push({ source_id: SOURCE.dolarapi, message });
    console.error('[dolar] fallo:', message);
  }

  // 3) ACCIONES ARGENTINAS (solo con mercado abierto)
  if (isStockMarketOpen()) {
    try {
      const written = await syncStocks();
      rowsWritten += written;
      results.push({ source: 'data912', ok: true, rows: written });
      await touchSource(SOURCE.data912);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ source: 'data912', ok: false, rows: 0, error: message });
      errors.push({ source_id: SOURCE.data912, message });
      console.error('[data912] fallo:', message);
    }
  } else {
    results.push({ source: 'data912', ok: true, rows: 0, error: 'mercado cerrado (skip)' });
  }

  // 4) registrar errores
  if (errors.length) {
    await db.from('sync_errors').insert(errors.map((e) => ({ ...e, run_id: runId })));
  }

  // 5) cerrar run
  const anyFail = results.some((r) => !r.ok);
  const anyOk = results.some((r) => r.ok && r.rows >= 0);
  const status = anyFail ? (anyOk ? 'partial' : 'failed') : 'ok';
  await db
    .from('sync_runs')
    .update({
      finished_at: new Date().toISOString(),
      status,
      sources: results,
      rows_written: rowsWritten,
    })
    .eq('id', runId);

  // 6) purga diaria (barata; una vez por dia alcanza)
  await maybePurge();

  console.log(`sync ${status} — filas: ${rowsWritten}`, JSON.stringify(results));
  if (status === 'failed') process.exit(1);
}

// ── dolar con fallback ──
async function tryDolar() {
  try {
    const r = await fetchDolarApi();
    if (r.length) return r;
    throw new Error('DolarAPI devolvio vacio');
  } catch (primaryErr) {
    console.warn('[dolar] DolarAPI fallo, uso Bluelytics:', primaryErr);
    return fetchBluelytics();
  }
}

// ── acciones: solo simbolos de la lista curada (assets) ──
async function syncStocks(): Promise<number> {
  const { data: assets, error: aErr } = await db
    .from('assets')
    .select('id, symbol')
    .eq('market_id', 1)
    .eq('is_active', true);
  if (aErr) throw new Error(aErr.message);
  const bySymbol = new Map<string, number>();
  for (const a of assets ?? []) bySymbol.set(a.symbol as string, a.id as number);

  const stocks = await fetchArgStocks();
  const snapshots = [];
  const dailies = [];
  const today = tradeDateArt();

  for (const s of stocks) {
    const assetId = bySymbol.get(s.symbol);
    if (!assetId) continue; // ignorar simbolos fuera de la lista curada
    snapshots.push({
      asset_id: assetId,
      price: s.price,
      prev_close: s.prev_close,
      change_pct: s.change_pct,
      volume: s.volume,
      source_id: SOURCE.data912,
      quoted_at: s.quoted_at,
    });
    dailies.push({
      asset_id: assetId,
      trade_date: today,
      close: s.price,
      change_pct: s.change_pct,
      volume: s.volume,
    });
  }

  if (snapshots.length) {
    const { error } = await db
      .from('price_snapshots')
      .upsert(snapshots, { onConflict: 'asset_id,quoted_at', ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
  if (dailies.length) {
    // upsert del cierre del dia: la ultima corrida del dia deja el cierre final.
    const { error } = await db
      .from('daily_prices')
      .upsert(dailies, { onConflict: 'asset_id,trade_date' });
    if (error) throw new Error(error.message);
  }
  return snapshots.length;
}

async function touchSource(sourceId: number) {
  await db.from('data_sources').update({ last_ok_at: new Date().toISOString() }).eq('id', sourceId);
}

// Purga una vez por dia: si no hubo corrida "de purga" hoy.
async function maybePurge() {
  const today = tradeDateArt();
  const { data } = await db
    .from('sync_runs')
    .select('id, sources')
    .gte('started_at', `${today}T00:00:00Z`)
    .limit(200);
  const alreadyPurged = (data ?? []).some(
    (r) => Array.isArray(r.sources) && (r.sources as SourceResult[]).some((s) => s.source === 'purge')
  );
  if (alreadyPurged) return;
  const { error } = await db.rpc('purge_old_data');
  if (error) {
    console.warn('[purge] no se pudo purgar:', error.message);
    return;
  }
  await db.from('sync_runs').insert({
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    status: 'ok',
    sources: [{ source: 'purge', ok: true, rows: 0 }],
    rows_written: 0,
  });
  console.log('[purge] datos viejos eliminados');
}

main().catch((err) => {
  console.error('sync crash:', err);
  process.exit(1);
});
