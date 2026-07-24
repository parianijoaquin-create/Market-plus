// Cliente de data912.com (https://data912.com) para acciones argentinas.
// Gratis, sin API key. Rate limit 120 req/min (no lo rozamos).
import { fetchJson } from './http.js';

interface Data912Stock {
  symbol: string;
  q_bid: number;
  px_bid: number;
  px_ask: number;
  q_ask: number;
  v: number; // volumen negociado
  q_op: number;
  c: number; // ultimo / cierre
  pct_change: number; // variacion % diaria
}

export interface NormalizedStock {
  symbol: string;
  price: number;
  change_pct: number | null;
  prev_close: number | null;
  volume: number | null;
  quoted_at: string;
}

export async function fetchArgStocks(): Promise<NormalizedStock[]> {
  const items = await fetchJson<Data912Stock[]>('https://data912.com/live/arg_stocks');
  const now = new Date().toISOString();
  const out: NormalizedStock[] = [];
  for (const it of items) {
    if (typeof it.c !== 'number' || it.c <= 0) continue;
    const pct = typeof it.pct_change === 'number' ? it.pct_change : null;
    // prev_close derivado de precio y variacion, cuando hay dato.
    const prev = pct !== null ? it.c / (1 + pct / 100) : null;
    out.push({
      symbol: it.symbol,
      price: it.c,
      change_pct: pct,
      prev_close: prev !== null ? Number(prev.toFixed(4)) : null,
      volume: typeof it.v === 'number' ? it.v : null,
      quoted_at: now,
    });
  }
  return out;
}
