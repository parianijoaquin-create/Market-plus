// Helpers de formato puros (testeables). Locale es-AR.

const arsFmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatArs(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return arsFmt.format(value);
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** Decimales segun magnitud (precios chicos = mas decimales). */
function smartDecimals(n: number): number {
  const abs = Math.abs(n);
  if (abs < 1) return 4;
  if (abs < 100) return 2;
  return 0;
}

/** Numero con decimales adaptativos y locale es-AR (sin simbolo). */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const d = smartDecimals(value);
  return value.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Precio con prefijo de moneda (default AR$). */
export function formatMoney(value: number | null | undefined, prefix = 'AR$ '): string {
  if (value == null || Number.isNaN(value)) return '—';
  return prefix + formatPrice(value);
}

/** Dolar: "$1.478" con decimales adaptativos. */
export function formatArsShort(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return '$' + formatPrice(value);
}

/** Volumen compacto: 1.2M, 340K. */
export function formatVolume(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (value / 1_000).toFixed(1) + 'K';
  return value.toLocaleString('es-AR');
}

/** Fecha larga es-AR: "miercoles 23 jul". */
export function formatLongDate(now = new Date()): string {
  const s = now.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1).replace('.', '');
}

/** "hace 3 min", "hace 1 h", etc. */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const diffMs = now - new Date(iso).getTime();
  if (diffMs < 0) return 'recien';
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'recien';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
