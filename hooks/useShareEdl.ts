import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';

interface ShareResult {
  success: boolean;
  token?: string;
  url?: string;
  message?: string;
}

interface UseShareEdlReturn {
  isSharing: boolean;
  shareByEmail: (edlId: string, email: string, expireDays?: number) => Promise<ShareResult | null>;
  sendSignatureLink: (edlId: string) => Promise<boolean>;
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

      const response = await fetch(`${API_URL}/edl/${numericId}/partages`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
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
        } catch (e) {}
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

  // Envoyer le lien de signature au locataire
  const sendSignatureLink = useCallback(async (edlId: string): Promise<boolean> => {
    if (!token) {
      showError('Non authentifié');
      return false;
    }

    setIsSharing(true);

    try {
      const numericId = edlId.includes('/') ? edlId.split('/').pop() : edlId;

      const response = await fetch(`${API_URL}/edl/${numericId}/signature/envoyer-lien`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      showSuccess('Lien de signature envoyé au locataire');
      return true;
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du lien');
      return false;
    } finally {
      setIsSharing(false);
    }
  }, [token, showError, showSuccess]);

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
    sendSignatureLink,
    promptShareEmail,
  };
}
