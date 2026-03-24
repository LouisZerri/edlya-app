import { getToken } from './storage';
import { refreshAccessToken } from './tokenRefresh';

/**
 * Wrapper fetch qui :
 * 1. Injecte automatiquement le header Authorization: Bearer <token>
 * 2. Sur 401 → tente un refresh token
 * 3. Si refresh réussit → rejoue la requête avec le nouveau token
 * 4. Si refresh échoue → logout + throw erreur
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getToken();

  const headers: Record<string, string> = {
    ...(__DEV__ ? { 'ngrok-skip-browser-warning': 'true' } : {}),
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Tenter un refresh
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Rejouer la requête avec le nouveau token
      const retryHeaders: Record<string, string> = {
        ...(__DEV__ ? { 'ngrok-skip-browser-warning': 'true' } : {}),
        ...(options.headers as Record<string, string> || {}),
        Authorization: `Bearer ${newToken}`,
      };
      return fetch(url, { ...options, headers: retryHeaders });
    }

    // Refresh échoué → logout
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuthStore } = require('../stores/authStore');
    await useAuthStore.getState().logout();
    throw new Error('Session expirée, veuillez vous reconnecter');
  }

  return response;
}
