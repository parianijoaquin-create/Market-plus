// Favoritos del usuario, guardados solo en el cliente (localStorage).
// No usan backend: son gratis y viven en el dispositivo. Clave: "MKT-SYMBOL".
import { useCallback, useEffect, useState } from 'react';

const KEY = 'mp-favs';

function read(): Record<string, 1> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function useFavorites(market = 'merval') {
  const [favs, setFavs] = useState<Record<string, 1>>(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(favs));
    } catch {
      /* ignore */
    }
  }, [favs]);

  const keyOf = useCallback((symbol: string) => `${market}-${symbol}`, [market]);

  const isFav = useCallback((symbol: string) => !!favs[keyOf(symbol)], [favs, keyOf]);

  const toggle = useCallback(
    (symbol: string) =>
      setFavs((prev) => {
        const next = { ...prev };
        const k = keyOf(symbol);
        if (next[k]) delete next[k];
        else next[k] = 1;
        return next;
      }),
    [keyOf],
  );

  return { favs, isFav, toggle };
}
