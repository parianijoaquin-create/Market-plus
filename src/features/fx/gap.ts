// Calculo de brecha cambiaria: cuanto mas caro esta un dolar financiero/blue
// respecto del oficial, en porcentaje.
import type { FxKind, FxRate } from '@/types';

export interface Gap {
  kind: FxKind;
  label: string;
  gapPct: number; // (sell_alt - sell_oficial) / sell_oficial * 100
}

const LABELS: Partial<Record<FxKind, string>> = {
  blue: 'Brecha Blue',
  mep: 'Brecha MEP',
  ccl: 'Brecha CCL',
};

/**
 * Recibe el ultimo valor de cada tipo de dolar y calcula la brecha
 * de blue/mep/ccl contra el oficial.
 */
export function computeGaps(latestByKind: Map<FxKind, FxRate>): Gap[] {
  const oficial = latestByKind.get('oficial');
  if (!oficial || !oficial.sell) return [];
  const gaps: Gap[] = [];
  for (const kind of ['blue', 'mep', 'ccl'] as FxKind[]) {
    const alt = latestByKind.get(kind);
    if (!alt || !alt.sell) continue;
    gaps.push({
      kind,
      label: LABELS[kind] ?? kind,
      gapPct: ((alt.sell - oficial.sell) / oficial.sell) * 100,
    });
  }
  return gaps;
}
