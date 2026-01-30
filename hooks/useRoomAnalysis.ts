import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';
import { ElementType, ElementEtat } from '../types';

interface DetectedElement {
  nom: string;
  type: ElementType;
  etat: ElementEtat;
  observations?: string;
  degradations: string[];
}

export interface RoomAnalysisResult {
  piece_detectee: string;
  elements: DetectedElement[];
  observations_generales?: string;
  confiance: number;
}

interface CreatedElement {
  id: number;
  nom: string;
  type: ElementType;
  etat: ElementEtat;
  observations?: string;
}

export interface AutoFillResult {
  success: boolean;
  message: string;
  piece: { id: number; nom: string };
  elements_crees: CreatedElement[];
  analyse_complete: RoomAnalysisResult;
}

interface UseRoomAnalysisReturn {
  isAnalyzing: boolean;
  analyzeRoom: (photoUri: string, nomPiece?: string) => Promise<RoomAnalysisResult | null>;
  autoFillRoom: (edlId: string, pieceId: string, photoUri: string) => Promise<AutoFillResult | null>;
}

export function useRoomAnalysis(): UseRoomAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const token = useAuthStore(state => state.token);
  const { error: showError, success: showSuccess } = useToastStore();

  // Analyse une photo de pièce et retourne les éléments détectés (sans les créer)
  const analyzeRoom = useCallback(async (
    photoUri: string,
    nomPiece?: string
  ): Promise<RoomAnalysisResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();

      // Préparer le fichier photo
      const uriParts = photoUri.split('.');
      const fileType = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
      const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';

      formData.append('photo', {
        uri: photoUri,
        name: `photo_piece.${fileType}`,
        type: mimeType,
      } as any);

      if (nomPiece) {
        formData.append('nom_piece', nomPiece);
      }

      const response = await fetch(`${API_URL}/ai/analyser-piece`, {
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

      return data.analyse as RoomAnalysisResult;
    } catch (err: any) {
      console.error('Room analysis error:', err);
      showError(err.message || 'Erreur lors de l\'analyse de la pièce');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [token, showError]);

  // Analyse une photo ET crée automatiquement les éléments dans l'EDL
  const autoFillRoom = useCallback(async (
    edlId: string,
    pieceId: string,
    photoUri: string
  ): Promise<AutoFillResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsAnalyzing(true);

    try {
      // Extraire les IDs numériques
      const numericEdlId = edlId.includes('/') ? edlId.split('/').pop() : edlId;
      const numericPieceId = pieceId.includes('/') ? pieceId.split('/').pop() : pieceId;

      const formData = new FormData();

      // Préparer le fichier photo
      const uriParts = photoUri.split('.');
      const fileType = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
      const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';

      formData.append('photo', {
        uri: photoUri,
        name: `photo_piece.${fileType}`,
        type: mimeType,
      } as any);

      const response = await fetch(
        `${API_URL}/ai/edl/${numericEdlId}/piece/${numericPieceId}/auto-remplir`,
        {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Auto-remplissage échoué');
      }

      showSuccess(`${data.elements_crees?.length || 0} éléments détectés et ajoutés`);
      return data as AutoFillResult;
    } catch (err: any) {
      console.error('Auto-fill room error:', err);
      showError(err.message || 'Erreur lors de l\'auto-remplissage');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [token, showError, showSuccess]);

  return {
    isAnalyzing,
    analyzeRoom,
    autoFillRoom,
  };
}
