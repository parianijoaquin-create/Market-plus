// Tipos compartidos entre el frontend y el script de sync.

export type FxKind =
  | 'oficial'
  | 'blue'
  | 'mep'
  | 'ccl'
  | 'mayorista'
  | 'tarjeta'
  | 'cripto';

export interface FxRate {
  id: number;
  kind: FxKind;
  buy: number | null;
  sell: number;
  source_id: number | null;
  quoted_at: string; // ISO
  fetched_at: string; // ISO
}

export interface Asset {
  id: number;
  market_id: number;
  symbol: string;
  name: string | null;
  kind: string;
  is_active: boolean;
}

export interface PriceSnapshot {
  id: number;
  asset_id: number;
  price: number;
  prev_close: number | null;
  change_pct: number | null;
  volume: number | null;
  source_id: number | null;
  quoted_at: string;
  fetched_at: string;
}

export interface SyncRun {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: 'ok' | 'partial' | 'failed';
  sources: unknown;
  rows_written: number | null;
}

// Fila de acciones que consume el frontend (join asset + ultimo snapshot).
export interface StockRow {
  symbol: string;
  name: string | null;
  price: number;
  change_pct: number | null;
  volume: number | null;
  quoted_at: string;
}
