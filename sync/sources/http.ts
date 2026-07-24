// Helper de fetch con timeout y reintentos con backoff.
// Node 18+ trae fetch global, asi que no hace falta ninguna dependencia.

export async function fetchJson<T>(
  url: string,
  opts: { retries?: number; timeoutMs?: number } = {}
): Promise<T> {
  const { retries = 3, timeoutMs = 10_000 } = opts;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: 'application/json', 'user-agent': 'market-pulse/0.1' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, attempt * 800)); // backoff lineal
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
