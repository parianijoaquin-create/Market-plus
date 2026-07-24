// Fila de una accion en las listas de movers (home y pantalla Movers).
import type { StockRow } from '@/types';
import { formatMoney, formatPct } from '@/utils/format';

interface Props {
  row: StockRow;
  rank?: number;
  isFav: boolean;
  onToggleFav: (symbol: string) => void;
  onOpen: (row: StockRow) => void;
}

export function MoverRow({ row, rank, isFav, onToggleFav, onOpen }: Props) {
  const up = (row.change_pct ?? 0) >= 0;
  return (
    <button className="mover" onClick={() => onOpen(row)}>
      <span
        className="mover__star"
        style={{ color: isFav ? 'var(--gold)' : 'var(--dim)' }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav(row.symbol);
        }}
      >
        {isFav ? '★' : '☆'}
      </span>
      {rank != null && <span className="mover__rank">{rank}</span>}
      <span className="mover__main">
        <span className="mover__t" style={{ display: 'block' }}>
          {row.symbol}
        </span>
        <span className="mover__n" style={{ display: 'block' }}>
          {row.name ?? row.symbol}
        </span>
      </span>
      <span className="mover__right">
        <span className="mover__price" style={{ display: 'block' }}>
          {formatMoney(row.price)}
        </span>
        <span className={'pill ' + (up ? 'pill--up' : 'pill--down')}>{formatPct(row.change_pct)}</span>
      </span>
    </button>
  );
}
