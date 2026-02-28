/**
 * Transforme une erreur technique en message utilisateur lisible.
 * @param err   L'erreur capturée
 * @param fallback  Message par défaut si l'erreur n'est pas identifiée
 */
export function getReadableError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;

  const msg = err.message.toLowerCase();

  // AbortController timeout (fetchWithTimeout)
  if (err.name === 'AbortError' || msg.includes('aborted')) {
    return 'La requête a pris trop de temps. Veuillez réessayer.';
  }

  // Erreur réseau (pas de connexion, DNS, etc.)
  if (msg.includes('network request failed') || msg.includes('network error') || msg.includes('failed to fetch')) {
    return 'Problème de connexion réseau. Vérifiez votre connexion internet.';
  }

  // Session expirée (depuis fetchWithAuth)
  if (msg.includes('session expirée') || msg.includes('reconnecter')) {
    return err.message;
  }

  // Erreur serveur HTTP
  if (/^erreur\s+5\d{2}$/.test(msg)) {
    return 'Le serveur a rencontré un problème. Veuillez réessayer.';
  }

  return fallback;
}
