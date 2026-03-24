import { getRefreshToken, setToken, setRefreshToken } from './storage';
import { API_URL } from './constants';

let refreshPromise: Promise<string | null> | null = null;

/**
 * Tente de rafraîchir le JWT avec le refresh token.
 * Gère la déduplication : si plusieurs requêtes 401 arrivent en même temps,
 * une seule tentative de refresh est faite.
 * Retourne le nouveau token ou null si le refresh a échoué.
 */
export async function refreshAccessToken(): Promise<string | null> {
  // Déduplication : si un refresh est déjà en cours, attendre son résultat
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;

      const response = await fetch(`${API_URL}/token/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(__DEV__ ? { 'ngrok-skip-browser-warning': 'true' } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (data.token && data.refresh_token) {
        await setToken(data.token);
        await setRefreshToken(data.refresh_token);
        return data.token as string;
      }

      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
