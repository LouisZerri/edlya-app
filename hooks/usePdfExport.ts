import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';

type PdfType = 'edl' | 'comparatif' | 'estimations';

export interface LigneDevisPdf {
  piece: string;
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
}

interface UsePdfExportReturn {
  isExporting: boolean;
  exportPdf: (edlId: string, type: PdfType, options?: { lignes?: LigneDevisPdf[] }) => Promise<void>;
}

export function usePdfExport(): UsePdfExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const token = useAuthStore(state => state.token);
  const { error: showError, success: showSuccess } = useToastStore();

  const exportPdf = useCallback(async (edlId: string, type: PdfType, options?: { lignes?: LigneDevisPdf[] }) => {
    if (!token) {
      showError('Non authentifié');
      return;
    }

    setIsExporting(true);

    try {
      // Extraire l'ID numérique si nécessaire
      const numericId = edlId.includes('/') ? edlId.split('/').pop() : edlId;

      // Construire l'URL selon le type
      let url: string;
      let filename: string;
      let method = 'GET';
      let body: string | undefined;

      switch (type) {
        case 'edl':
          url = `${API_URL}/edl/${numericId}/pdf`;
          filename = `etat_des_lieux_${numericId}.pdf`;
          break;
        case 'comparatif':
          url = `${API_URL}/edl/${numericId}/comparatif/pdf`;
          filename = `comparatif_${numericId}.pdf`;
          break;
        case 'estimations':
          url = `${API_URL}/edl/${numericId}/estimations/pdf`;
          filename = `devis_reparations_${numericId}.pdf`;
          method = 'POST';
          body = JSON.stringify({ lignes: options?.lignes ?? [] });
          break;
      }

      // Sur Web, télécharger directement via le navigateur
      if (Platform.OS === 'web') {
        const response = await fetch(url, {
          method,
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': `Bearer ${token}`,
            ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(body ? { body } : {}),
        });

        if (!response.ok) {
          throw new Error(`Erreur lors du téléchargement (${response.status})`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Créer un lien temporaire pour télécharger
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        showSuccess('PDF téléchargé');
        return;
      }

      // Sur mobile natif
      if (method === 'POST') {
        // expo-file-system downloadAsync ne supporte pas POST, on utilise fetch + write
        const FileSystem = await import('expo-file-system/legacy');
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body,
        });

        if (!response.ok) {
          throw new Error(`Erreur lors du téléchargement (${response.status})`);
        }

        const blob = await response.blob();
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Partager ${filename}`,
            UTI: 'com.adobe.pdf',
          });
          showSuccess('PDF prêt à partager');
        } else {
          Alert.alert('PDF téléchargé', `Le fichier a été sauvegardé : ${filename}`, [{ text: 'OK' }]);
        }
      } else {
        // GET requests: use downloadAsync
        const FileSystem = await import('expo-file-system/legacy');
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (downloadResult.status !== 200) {
          throw new Error(`Erreur lors du téléchargement (${downloadResult.status})`);
        }

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Partager ${filename}`,
            UTI: 'com.adobe.pdf',
          });
          showSuccess('PDF prêt à partager');
        } else {
          Alert.alert('PDF téléchargé', `Le fichier a été sauvegardé : ${filename}`, [{ text: 'OK' }]);
        }
      }
    } catch (err: unknown) {
      console.error('PDF export error:', err);
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  }, [token, showError, showSuccess]);

  return {
    isExporting,
    exportPdf,
  };
}
