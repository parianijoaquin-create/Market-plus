// Cliente de DolarAPI (https://dolarapi.com) con fallback a Bluelytics.
// Gratis, sin API key. Devuelve las cotizaciones normalizadas a nuestro modelo.
import { fetchJson } from './http.js';
import type { FxKind } from '../../src/types/index.js';

interface DolarApiItem {
  moneda: string;
  casa: string; // oficial, blue, bolsa, contadoconliqui, mayorista, cripto, tarjeta
  nombre: string;
  compra: number | null;
  venta: number;
  fechaActualizacion: string; // ISO
}

export interface NormalizedFx {
  kind: FxKind;
  buy: number | null;
  sell: number;
  quoted_at: string;
  source: 'dolarapi' | 'bluelytics';
}

// Mapa casa (DolarAPI) -> nuestro kind.
const CASA_TO_KIND: Record<string, FxKind> = {
  oficial: 'oficial',
  blue: 'blue',
  bolsa: 'mep', // "bolsa" = dolar MEP
  contadoconliqui: 'ccl',
  mayorista: 'mayorista',
  tarjeta: 'tarjeta',
  cripto: 'cripto',
};

export async function fetchDolarApi(): Promise<NormalizedFx[]> {
  const items = await fetchJson<DolarApiItem[]>('https://dolarapi.com/v1/dolares');
  const out: NormalizedFx[] = [];
  for (const it of items) {
    const kind = CASA_TO_KIND[it.casa];
    if (!kind) continue;
    if (typeof it.venta !== 'number') continue;
    out.push({
      kind,
      buy: typeof it.compra === 'number' ? it.compra : null,
      sell: it.venta,
      quoted_at: it.fechaActualizacion ?? new Date().toISOString(),
      source: 'dolarapi',
    });
  }
  return out;
}

// ── Fallback: Bluelytics (solo oficial y blue) ──
interface BluelyticsResp {
  oficial: { value_avg: number; value_sell: number; value_buy: number };
  blue: { value_avg: number; value_sell: number; value_buy: number };
  last_update: string;
}

export async function fetchBluelytics(): Promise<NormalizedFx[]> {
  const r = await fetchJson<BluelyticsResp>('https://api.bluelytics.com.ar/v2/latest');
  const at = r.last_update ?? new Date().toISOString();
  return [
    { kind: 'oficial', buy: r.oficial.value_buy, sell: r.oficial.value_sell, quoted_at: at, source: 'bluelytics' },
    { kind: 'blue', buy: r.blue.value_buy, sell: r.blue.value_sell, quoted_at: at, source: 'bluelytics' },
  ];
}
