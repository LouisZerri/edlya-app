import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';
import { ElementType, ElementEtat } from '../types';

interface DegradationDetectee {
  type: string;
  severite: 'legere' | 'moyenne' | 'importante';
  localisation?: string;
  description?: string;
}

interface EstimationReparation {
  necessaire: boolean;
  type_intervention?: string;
  cout_estime_min?: number;
  cout_estime_max?: number;
}

export interface AnalyseResult {
  etat_global: ElementEtat;
  degradations_detectees: DegradationDetectee[];
  estimation_reparation?: EstimationReparation;
  observations?: string;
  confiance: number;
}

interface UsePhotoAnalysisReturn {
  isAnalyzing: boolean;
  analyzePhoto: (
    photoUri: string,
    typeElement: ElementType,
    nomElement?: string
  ) => Promise<AnalyseResult | null>;
}

export function usePhotoAnalysis(): UsePhotoAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const token = useAuthStore(state => state.token);
  const { error: showError } = useToastStore();

  const analyzePhoto = useCallback(async (
    photoUri: string,
    typeElement: ElementType,
    nomElement?: string
  ): Promise<AnalyseResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsAnalyzing(true);

    try {
      const isRemoteUrl = photoUri.startsWith('http://') || photoUri.startsWith('https://');
      const compressedUri = photoUri;

      const formData = new FormData();

      // Get file extension and mime type
      const uriParts = compressedUri.split('.');
      const fileType = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
      const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `photo_analyse_${Date.now()}.${fileType}`;

      if (Platform.OS === 'web') {
        const imageResponse = await fetch(compressedUri);
        const blob = await imageResponse.blob();
        formData.append('photo', blob, fileName);
      } else if (isRemoteUrl) {
        // Remote URL: fetch and convert to base64
        const imageResponse = await fetch(compressedUri);
        const blob = await imageResponse.blob();
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const base64Data = await base64Promise;

        formData.append('photo', {
          uri: base64Data,
          name: fileName,
          type: mimeType,
        } as any);
      } else {
        // Local file: pass compressed URI directly
        formData.append('photo', {
          uri: compressedUri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      formData.append('type_element', typeElement);

      if (nomElement) {
        formData.append('nom_element', nomElement);
      }

      const response = await fetch(`${API_URL}/ai/analyser-degradation`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Analyse échouée');
      }

      return data.analyse as AnalyseResult;
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [token, showError]);

  return {
    isAnalyzing,
    analyzePhoto,
  };
}
