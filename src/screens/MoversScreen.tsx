// Pantalla Movers: favoritos, tabs de mercado y rankings de subas/bajas.
// Etapa 1 solo tiene datos de Merval; Cripto y Acciones US quedan "proximamente".
import { useState } from 'react';
import type { StockRow } from '@/types';
import { rankMovers } from '@/services/marketData';
import { MoverRow } from '@/components/MoverRow';

type Market = 'merval' | 'cripto' | 'us';

interface Props {
  stocks: StockRow[];
  isFav: (s: string) => boolean;
  onToggleFav: (s: string) => void;
  onOpen: (row: StockRow) => void;
}

const TABS: { id: Market; label: string }[] = [
  { id: 'merval', label: 'Merval' },
  { id: 'cripto', label: 'Cripto' },
  { id: 'us', label: 'Acciones US' },
];

export function MoversScreen({ stocks, isFav, onToggleFav, onOpen }: Props) {
  const [market, setMarket] = useState<Market>('merval');

  const favList = stocks
    .filter((r) => isFav(r.symbol))
    .sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0));
  const { gainers, losers } = rankMovers(stocks);

  return (
    <>
      <div style={{ margin: '6px 2px 14px' }}>
        <div className="screen-title">Movers</div>
        <div className="screen-sub">Los que más se mueven hoy</div>
      </div>

      {/* Favoritos */}
      <div className="eyebrow" style={{ color: 'var(--gold)', margin: '2px 2px 8px' }}>
        ★ Favoritos
      </div>
      {favList.length > 0 ? (
        <div className="list-card" style={{ marginBottom: 18 }}>
          {favList.map((r) => (
            <MoverRow key={r.symbol} row={r} isFav onToggleFav={onToggleFav} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="empty" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>☆</div>
          Tocá la estrella en cualquier activo para seguirlo desde acá.
        </div>
      )}

      {/* Tabs de mercado */}
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'tab' + (market === t.id ? ' tab--active' : '')}
            onClick={() => setMarket(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {market !== 'merval' ? (
        <div className="empty" style={{ padding: '28px 16px' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>◷</div>
          {market === 'cripto'
            ? 'Cripto llega en la Etapa 2.'
            : 'Acciones de EE. UU. llegan en la Etapa 2.'}
          <br />
          Por ahora, Market Pulse sigue el Merval.
        </div>
      ) : gainers.length === 0 && losers.length === 0 ? (
        <div className="empty">Sin datos de acciones todavía (mercado cerrado o sync pendiente).</div>
      ) : (
        <>
          <div className="counters">
            <div className="counter counter--up">
              <div className="counter__n" style={{ color: 'var(--up)' }}>
                {gainers.length}
              </div>
              <div className="counter__l">suben</div>
            </div>
            <div className="counter counter--down">
              <div className="counter__n" style={{ color: 'var(--down)' }}>
                {losers.length}
              </div>
              <div className="counter__l">bajan</div>
            </div>
          </div>

          <div className="eyebrow" style={{ color: 'var(--up)', margin: '4px 2px 6px' }}>
            ▲ Mayores subas
          </div>
          <div className="list-card" style={{ marginBottom: 16 }}>
            {gainers.map((r, i) => (
              <MoverRow
                key={r.symbol}
                row={r}
                rank={i + 1}
                isFav={isFav(r.symbol)}
                onToggleFav={onToggleFav}
                onOpen={onOpen}
              />
            ))}
          </div>

          <div className="eyebrow" style={{ color: 'var(--down)', margin: '4px 2px 6px' }}>
            ▼ Mayores bajas
          </div>
          <div className="list-card">
            {losers.map((r, i) => (
              <MoverRow
                key={r.symbol}
                row={r}
                rank={i + 1}
                isFav={isFav(r.symbol)}
                onToggleFav={onToggleFav}
                onOpen={onOpen}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
