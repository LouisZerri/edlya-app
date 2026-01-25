import { useState, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';

type PdfType = 'edl' | 'comparatif' | 'estimations';

interface UsePdfExportReturn {
  isExporting: boolean;
  exportPdf: (edlId: string, type: PdfType) => Promise<void>;
}

export function usePdfExport(): UsePdfExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const token = useAuthStore(state => state.token);
  const { error: showError, success: showSuccess } = useToastStore();

  const exportPdf = useCallback(async (edlId: string, type: PdfType) => {
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
          filename = `estimations_${numericId}.pdf`;
          break;
      }

      // Sur Web, télécharger directement via le navigateur
      if (Platform.OS === 'web') {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
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

      // Sur mobile, utiliser expo-file-system
      const FileSystem = await import('expo-file-system/legacy');

      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      const downloadResult = await FileSystem.downloadAsync(
        url,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status !== 200) {
        throw new Error(`Erreur lors du téléchargement (${downloadResult.status})`);
      }

      // Vérifier si le partage est disponible
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Partager ${filename}`,
          UTI: 'com.adobe.pdf',
        });
        showSuccess('PDF prêt à partager');
      } else {
        Alert.alert(
          'PDF téléchargé',
          `Le fichier a été sauvegardé : ${filename}`,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('PDF export error:', err);
      showError(err.message || 'Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  }, [token, showError, showSuccess]);

  return {
    isExporting,
    exportPdf,
  };
}
