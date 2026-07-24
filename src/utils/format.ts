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
