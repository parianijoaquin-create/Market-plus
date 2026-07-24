// Capa de acceso a datos: todas las lecturas a Supabase viven aca.
// El resto de la app usa estas funciones, no consulta la DB directamente.
import { supabase } from '@/lib/supabase';
import type { FxKind, FxRate, StockRow, SyncRun } from '@/types';

/** Ultimo valor de cada tipo de dolar. */
export async function getLatestFxRates(): Promise<Map<FxKind, FxRate>> {
  // Traemos las ultimas filas y nos quedamos con la mas reciente por kind.
  const { data, error } = await supabase
    .from('fx_rates')
    .select('*')
    .order('quoted_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  const byKind = new Map<FxKind, FxRate>();
  for (const row of (data ?? []) as FxRate[]) {
    if (!byKind.has(row.kind)) byKind.set(row.kind, row);
  }
  return byKind;
}

/**
 * Ultimo snapshot de cada accion de la lista curada, listo para ranking.
 * Usa la vista/consulta: por cada asset, el price_snapshot mas reciente.
 */
export async function getLatestStocks(): Promise<StockRow[]> {
  // Traemos snapshots recientes con su asset y deduplicamos por asset en el cliente.
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('price, change_pct, volume, quoted_at, assets!inner(symbol, name, market_id)')
    .order('quoted_at', { ascending: false })
    .limit(1000);
  if (error) throw error;

  const seen = new Set<string>();
  const rows: StockRow[] = [];
  for (const r of (data ?? []) as unknown as Array<{
    price: number;
    change_pct: number | null;
    volume: number | null;
    quoted_at: string;
    assets: { symbol: string; name: string | null; market_id: number };
  }>) {
    const sym = r.assets?.symbol;
    if (!sym || seen.has(sym)) continue;
    seen.add(sym);
    rows.push({
      symbol: sym,
      name: r.assets?.name ?? null,
      price: r.price,
      change_pct: r.change_pct,
      volume: r.volume,
      quoted_at: r.quoted_at,
    });
  }
  return rows;
}

/** Ultima corrida del sync, para mostrar "ultima actualizacion" y estado. */
export async function getLastSyncRun(): Promise<SyncRun | null> {
  const { data, error } = await supabase
    .from('sync_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as SyncRun) ?? null;
}

/** Top subas y bajas a partir de las acciones. */
export function splitMovers(rows: StockRow[], count = 8) {
  const withPct = rows.filter((r) => r.change_pct != null);
  const sorted = [...withPct].sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0));
  return {
    gainers: sorted.slice(0, count),
    losers: sorted.slice(-count).reverse(),
  };
}
