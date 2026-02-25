import { getToken } from './storage';

/**
 * Wrapper fetch qui :
 * 1. Injecte automatiquement le header Authorization: Bearer <token>
 * 2. Intercepte les réponses 401 → logout + throw erreur explicite
 *
 * Note : authStore est importé via require() dans le corps de la fonction
 * pour éviter un cycle d'imports (fetchWithAuth ↔ authStore).
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuthStore } = require('../stores/authStore');
    await useAuthStore.getState().logout();
    throw new Error('Session expirée, veuillez vous reconnecter');
  }

  return response;
}
