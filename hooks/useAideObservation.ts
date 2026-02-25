import { useState } from 'react';
import { API_URL } from '../utils/constants';
import { fetchWithAuth } from '../utils/fetchWithAuth';

export function useAideObservation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ameliorerObservation = async (
    element: string,
    etat: string,
    observation?: string,
    degradations?: string[]
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`${API_URL}/aide/ameliorer-observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          element,
          etat,
          observation: observation || null,
          degradations: degradations || [],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de l'amélioration");
      }

      return data.observation_amelioree;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { ameliorerObservation, isLoading, error };
}
