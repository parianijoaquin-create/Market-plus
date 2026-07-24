// Hook central de datos de la Etapa 1: dolar, brecha, acciones y estado del sync.
// Auto-refresca cada 60s (los datos ya vienen cacheados en Supabase).
import { useCallback, useEffect, useState } from 'react';
import {
  getLatestFxRates,
  getLatestStocks,
  getLastSyncRun,
  splitMovers,
} from '@/services/marketData';
import { computeGaps, type Gap } from '@/features/fx/gap';
import type { FxKind, FxRate, StockRow, SyncRun } from '@/types';

interface MarketData {
  loading: boolean;
  error: string | null;
  fxByKind: Map<FxKind, FxRate>;
  gaps: Gap[];
  stocks: StockRow[];
  gainers: StockRow[];
  losers: StockRow[];
  lastRun: SyncRun | null;
  refresh: () => void;
}

const REFRESH_MS = 60_000;

export function useMarketData(): MarketData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fxByKind, setFxByKind] = useState<Map<FxKind, FxRate>>(new Map());
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [gainers, setGainers] = useState<StockRow[]>([]);
  const [losers, setLosers] = useState<StockRow[]>([]);
  const [lastRun, setLastRun] = useState<SyncRun | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [fx, stk, run] = await Promise.all([
        getLatestFxRates(),
        getLatestStocks(),
        getLastSyncRun(),
      ]);
      setFxByKind(fx);
      setGaps(computeGaps(fx));
      setStocks(stk);
      const { gainers: g, losers: l } = splitMovers(stk);
      setGainers(g);
      setLosers(l);
      setLastRun(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { loading, error, fxByKind, gaps, stocks, gainers, losers, lastRun, refresh: load };
}
