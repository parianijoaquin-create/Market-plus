// Pantalla Inicio ("Mercado hoy"): brecha destacada, grilla de dolar y
// resumen de movers del Merval. Todo con datos reales de Etapa 1.
import type { FxKind, FxRate, StockRow } from '@/types';
import type { Gap } from '@/features/fx/gap';
import { rankMovers } from '@/services/marketData';
import { formatArsShort, formatLongDate } from '@/utils/format';
import { MoverRow } from '@/components/MoverRow';

interface Props {
  fxByKind: Map<FxKind, FxRate>;
  gaps: Gap[];
  stocks: StockRow[];
  isFav: (s: string) => boolean;
  onToggleFav: (s: string) => void;
  onOpen: (row: StockRow) => void;
  onGoMovers: () => void;
}

const FX_ORDER: { kind: FxKind; label: string }[] = [
  { kind: 'oficial', label: 'Oficial' },
  { kind: 'blue', label: 'Blue' },
  { kind: 'mep', label: 'MEP' },
  { kind: 'ccl', label: 'CCL' },
  { kind: 'cripto', label: 'Cripto' },
  { kind: 'tarjeta', label: 'Tarjeta' },
];

export function HomeScreen({ fxByKind, gaps, stocks, isFav, onToggleFav, onOpen, onGoMovers }: Props) {
  const oficial = fxByKind.get('oficial');
  // Brecha destacada: preferimos CCL; si no hay, blue.
  const featured = gaps.find((g) => g.kind === 'ccl') ?? gaps.find((g) => g.kind === 'blue') ?? gaps[0];
  const featuredFx = featured ? fxByKind.get(featured.kind) : undefined;

  const { gainers, losers } = rankMovers(stocks, 3);

  return (
    <>
      <div style={{ margin: '6px 2px 16px' }}>
        <div className="screen-title">Mercado hoy</div>
        <div className="screen-sub">{formatLongDate()}</div>
      </div>

      {/* Brecha destacada */}
      <div className="brecha">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="eyebrow" style={{ color: 'var(--dim)', letterSpacing: '.6px' }}>
            {featured ? featured.label.replace('Brecha ', 'Brecha ') : 'Brecha'}
          </span>
          <span style={{ font: "500 11px var(--f-body)", color: 'var(--dim)' }}>vs. Oficial</span>
        </div>
        <div className="brecha__val">{featured ? `+${featured.gapPct.toFixed(1)}%` : '—'}</div>
        <div className="brecha__bar">
          <div
            className="brecha__fill"
            style={{ width: featured ? `${Math.min(100, (featured.gapPct / 45) * 100).toFixed(0)}%` : '0%' }}
          />
        </div>
        <div style={{ font: "500 12px var(--f-body)", color: 'var(--dim)', marginTop: 9 }}>
          {featured && featuredFx && oficial
            ? `${featured.label.replace('Brecha ', '')} ${formatArsShort(featuredFx.sell)} · Oficial ${formatArsShort(
                oficial.sell,
              )}`
            : 'Sin datos suficientes de cotizaciones.'}
        </div>
      </div>

      {/* Grilla de dolar */}
      <div className="section-h">Dólar</div>
      <div className="fx-grid">
        {FX_ORDER.map(({ kind, label }) => {
          const r = fxByKind.get(kind);
          if (!r) return null;
          const brechaPct =
            kind !== 'oficial' && oficial && oficial.sell ? ((r.sell - oficial.sell) / oficial.sell) * 100 : null;
          return (
            <div className="fx" key={kind}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: "600 12px var(--f-body)", color: 'var(--dim)' }}>{label}</span>
              </div>
              <div className="fx__val">{formatArsShort(r.sell)}</div>
              <div className="mover__n" style={{ marginTop: 3 }}>
                {kind === 'oficial'
                  ? 'Referencia BCRA'
                  : brechaPct != null
                    ? `Brecha +${brechaPct.toFixed(1)}%`
                    : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Movers del home */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2px 2px 10px' }}>
        <span className="section-h" style={{ margin: 0 }}>
          Movers de hoy · Merval
        </span>
        <button
          onClick={onGoMovers}
          style={{ background: 'none', border: 'none', color: 'var(--brand)', font: "600 12px var(--f-body)", cursor: 'pointer', padding: 0 }}
        >
          Ver todos ›
        </button>
      </div>

      {gainers.length === 0 && losers.length === 0 ? (
        <div className="empty">Sin datos de acciones todavía (mercado cerrado o sync pendiente).</div>
      ) : (
        <div className="list-card">
          <div className="eyebrow" style={{ color: 'var(--up)', padding: '9px 13px 5px' }}>
            Suben ▲
          </div>
          {gainers.map((r) => (
            <MoverRow key={r.symbol} row={r} isFav={isFav(r.symbol)} onToggleFav={onToggleFav} onOpen={onOpen} />
          ))}
          <div
            className="eyebrow"
            style={{ color: 'var(--down)', padding: '11px 13px 5px', borderTop: '1px solid var(--bd-soft)' }}
          >
            Bajan ▼
          </div>
          {losers.map((r) => (
            <MoverRow key={r.symbol} row={r} isFav={isFav(r.symbol)} onToggleFav={onToggleFav} onOpen={onOpen} />
          ))}
        </div>
      )}
    </>
  );
}
