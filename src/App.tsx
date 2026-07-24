// ─────────────────────────────────────────────────────────────
// PLACEHOLDER de UI — Etapa 1.
// Muestra que TODOS los datos funcionan (dolar, brecha, movers,
// ultima actualizacion). El diseño real lo ponemos despues:
// esta vista es fea a proposito para no condicionar tu impronta.
// ─────────────────────────────────────────────────────────────
import { useMarketData } from '@/hooks/useMarketData';
import { formatArs, formatPct, formatNumber, timeAgo } from '@/utils/format';
import type { FxKind, StockRow } from '@/types';

const FX_LABELS: Record<FxKind, string> = {
  oficial: 'Oficial',
  blue: 'Blue',
  mep: 'MEP',
  ccl: 'CCL',
  mayorista: 'Mayorista',
  tarjeta: 'Tarjeta',
  cripto: 'Cripto',
};

const FX_ORDER: FxKind[] = ['oficial', 'blue', 'mep', 'ccl', 'mayorista', 'tarjeta', 'cripto'];

export default function App() {
  const { loading, error, fxByKind, gaps, gainers, losers, lastRun, refresh } = useMarketData();

  return (
    <div className="wrap">
      <header style={{ marginBottom: 16 }}>
        <h1>Market Pulse</h1>
        <p className="muted">
          {lastRun
            ? `Ultima actualizacion: ${timeAgo(lastRun.finished_at ?? lastRun.started_at)} · estado: ${lastRun.status}`
            : 'Sin datos de sincronizacion todavia.'}{' '}
          <button onClick={refresh} style={{ marginLeft: 8 }}>
            Refrescar
          </button>
        </p>
        <p className="muted" style={{ fontSize: '0.75rem' }}>
          App informativa. No constituye recomendacion de compra o venta.
        </p>
      </header>

      {loading && <p>Cargando…</p>}
      {error && <p className="down">Error: {error}</p>}

      {/* DOLAR */}
      <section className="card">
        <h2>Dolar</h2>
        <div className="grid">
          {FX_ORDER.map((k) => {
            const r = fxByKind.get(k);
            if (!r) return null;
            return (
              <div key={k}>
                <div className="muted">{FX_LABELS[k]}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatArs(r.sell)}</div>
                <div className="muted" style={{ fontSize: '0.7rem' }}>
                  {timeAgo(r.quoted_at)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BRECHA */}
      <section className="card">
        <h2>Brecha cambiaria</h2>
        {gaps.length === 0 ? (
          <p className="muted">Sin datos suficientes.</p>
        ) : (
          <div className="grid">
            {gaps.map((g) => (
              <div key={g.kind}>
                <div className="muted">{g.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatPct(g.gapPct)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MOVERS */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <MoversTable title="Mayores subas" rows={gainers} />
        <MoversTable title="Mayores bajas" rows={losers} />
      </div>
    </div>
  );
}

function MoversTable({ title, rows }: { title: string; rows: StockRow[] }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="muted">Sin datos (mercado cerrado o sync pendiente).</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Simbolo</th>
              <th>Precio</th>
              <th>Var %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol}>
                <td title={r.name ?? undefined}>{r.symbol}</td>
                <td>{formatNumber(r.price)}</td>
                <td className={(r.change_pct ?? 0) >= 0 ? 'up' : 'down'}>{formatPct(r.change_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
