/**
 * Wrapper fetch avec AbortController et timeout.
 * Timeout par défaut : 60 secondes.
 * @param fetchFn — fonction fetch à utiliser (par défaut : fetch global)
 */
export function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60_000,
  fetchFn: (url: string, options: RequestInit) => Promise<Response> = fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetchFn(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}
