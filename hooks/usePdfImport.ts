import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';

interface LogementExtrait {
  adresse?: string;
  code_postal?: string;
  ville?: string;
  type?: string;
  surface?: number;
}

interface LocataireExtrait {
  nom?: string;
  email?: string;
  telephone?: string;
}

export interface ElementExtrait {
  nom: string;
  type: string;
  etat: string;
  observations?: string;
  degradations?: string[];
  photo_indices?: number[];
}

export interface PieceExtraite {
  nom: string;
  elements: ElementExtrait[];
  photo_indices?: number[];
}

interface CompteurExtrait {
  type: string;
  numero?: string;
  index?: string;
  photo_indices?: number[];
}

interface CleExtraite {
  type: string;
  nombre: number;
  photo_indices?: number[];
}

export interface DonneesExtraites {
  type_edl?: 'entree' | 'sortie';
  date_realisation?: string;
  logement?: LogementExtrait;
  locataire?: LocataireExtrait;
  pieces?: PieceExtraite[];
  compteurs?: CompteurExtrait[];
  cles?: CleExtraite[];
}

export interface ExtractedImage {
  index: number;
  width: number | null;
  height: number | null;
  size: number;      // bytes
}

interface ImportResult {
  success: boolean;
  donnees_extraites?: DonneesExtraites;
  images?: ExtractedImage[];
  import_id?: string;
  message?: string;
}

interface CreateEdlResult {
  success: boolean;
  edl?: {
    id: number;
    type: string;
    statut: string;
    locataireNom: string;
    nbPieces: number;
  };
  donnees_extraites?: DonneesExtraites;
  images?: ExtractedImage[];
  message?: string;
}

export function getImportPhotoUrl(importId: string, index: number, thumb?: boolean): string {
  const base = `${API_URL}/ai/import-photo/${importId}/${index}`;
  return thumb ? `${base}?thumb=1` : base;
}

interface UsePdfImportReturn {
  isImporting: boolean;
  isCreating: boolean;
  importPdf: (fileUri: string, fileName: string) => Promise<ImportResult | null>;
  createEdlFromData: (data: DonneesExtraites, logementId: string, importId?: string) => Promise<CreateEdlResult | null>;
}

export function usePdfImport(): UsePdfImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const token = useAuthStore(state => state.token);
  const { error: showError } = useToastStore();

  const importPdf = useCallback(async (
    fileUri: string,
    fileName: string
  ): Promise<ImportResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('pdf', {
        uri: fileUri,
        name: fileName,
        type: 'application/pdf',
      } as any);

      const response = await fetch(`${API_URL}/ai/import-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Import échoué');
      }

      return data as ImportResult;
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [token, showError]);

  const createEdlFromData = useCallback(async (
    data: DonneesExtraites,
    logementId: string,
    importId?: string
  ): Promise<CreateEdlResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsCreating(true);

    try {
      const numericId = logementId.includes('/')
        ? logementId.split('/').pop()
        : logementId;

      const body: Record<string, unknown> = {
        data,
        logement_id: numericId,
      };

      if (importId) {
        body.import_id = importId;
      }

      const response = await fetch(`${API_URL}/ai/import-pdf/creer-edl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 410) {
          throw new Error('Les photos importées ont expiré. Veuillez ré-importer le PDF.');
        }
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
        } catch {
          // Response wasn't JSON
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Création échouée');
      }

      return result as CreateEdlResult;
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la création');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [token, showError]);

  return {
    isImporting,
    isCreating,
    importPdf,
    createEdlFromData,
  };
}
