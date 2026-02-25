import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';
import { fetchWithAuth } from '../utils/fetchWithAuth';

interface ShareResult {
  success: boolean;
  token?: string;
  url?: string;
  message?: string;
}

interface LigneDevisEmail {
  piece: string;
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
}

interface UseShareEdlReturn {
  isSharing: boolean;
  shareByEmail: (edlId: string, email: string, expireDays?: number) => Promise<ShareResult | null>;
  shareComparatif: (edlId: string, email: string) => Promise<ShareResult | null>;
  shareEstimations: (edlId: string, email: string, lignes: LigneDevisEmail[]) => Promise<ShareResult | null>;
  promptShareEmail: (edlId: string, defaultEmail?: string) => void;
}

export function useShareEdl(): UseShareEdlReturn {
  const [isSharing, setIsSharing] = useState(false);
  const token = useAuthStore(state => state.token);
  const { error: showError, success: showSuccess } = useToastStore();

  // Partager l'EDL par email
  const shareByEmail = useCallback(async (
    edlId: string,
    email: string,
    expireDays: number = 7
  ): Promise<ShareResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsSharing(true);

    try {
      const numericId = edlId.includes('/') ? edlId.split('/').pop() : edlId;

      const response = await fetchWithAuth(`${API_URL}/edl/${numericId}/partages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          email,
          expireDays,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (err) {
          if (__DEV__) console.warn('[UseShareEdl] Failed to parse error response:', err);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      showSuccess(`Email envoyé à ${email}`);
      return data;
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [token, showError, showSuccess]);

  // Envoyer le comparatif par email
  const shareComparatif = useCallback(async (
    edlId: string,
    email: string,
  ): Promise<ShareResult | null> => {
    setIsSharing(true);

    try {
      const numericId = edlId.includes('/') ? edlId.split('/').pop() : edlId;

      const response = await fetchWithAuth(`${API_URL}/edl/${numericId}/email/comparatif`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (err) {
          if (__DEV__) console.warn('[UseShareEdl] Failed to parse error response:', err);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      showSuccess(`Comparatif envoyé à ${email}`);
      return data;
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [showError, showSuccess]);

  // Envoyer le devis estimations par email
  const shareEstimations = useCallback(async (
    edlId: string,
    email: string,
    lignes: LigneDevisEmail[],
  ): Promise<ShareResult | null> => {
    setIsSharing(true);

    try {
      const numericId = edlId.includes('/') ? edlId.split('/').pop() : edlId;

      const response = await fetchWithAuth(`${API_URL}/edl/${numericId}/email/estimations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lignes }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (err) {
          if (__DEV__) console.warn('[UseShareEdl] Failed to parse error response:', err);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      showSuccess(`Devis envoyé à ${email}`);
      return data;
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [showError, showSuccess]);

  // Afficher une boîte de dialogue pour demander l'email
  const promptShareEmail = useCallback((edlId: string, defaultEmail?: string) => {
    Alert.prompt(
      'Envoyer au locataire',
      'Entrez l\'adresse email du locataire',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: (email?: string) => {
            if (email && email.includes('@')) {
              shareByEmail(edlId, email);
            } else {
              showError('Email invalide');
            }
          },
        },
      ],
      'plain-text',
      defaultEmail || ''
    );
  }, [shareByEmail, showError]);

  return {
    isSharing,
    shareByEmail,
    shareComparatif,
    shareEstimations,
    promptShareEmail,
  };
}
