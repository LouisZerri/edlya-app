/**
 * Wrapper autour de fetch qui ajoute automatiquement le header ngrok
 * pour bypasser la page d'avertissement en développement
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...(options.headers || {}),
    'ngrok-skip-browser-warning': 'true',
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Wrapper pour les appels JSON
 */
export async function apiJsonFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    'ngrok-skip-browser-warning': 'true',
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
