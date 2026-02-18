import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { API_URL } from '../utils/constants';

export function useAideObservation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  const ameliorerObservation = async (
    element: string,
    etat: string,
    observation?: string,
    degradations?: string[]
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/aide/ameliorer-observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
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
