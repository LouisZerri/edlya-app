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

interface ElementExtrait {
  nom: string;
  type: string;
  etat: string;
  observations?: string;
  degradations?: string[];
}

interface PieceExtraite {
  nom: string;
  elements: ElementExtrait[];
}

interface CompteurExtrait {
  type: string;
  numero?: string;
  index?: string;
}

interface CleExtraite {
  type: string;
  nombre: number;
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

interface ImportResult {
  success: boolean;
  donnees_extraites?: DonneesExtraites;
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
  message?: string;
}

interface UsePdfImportReturn {
  isImporting: boolean;
  isCreating: boolean;
  importPdf: (fileUri: string, fileName: string) => Promise<ImportResult | null>;
  createEdlFromPdf: (fileUri: string, fileName: string, logementId: string) => Promise<CreateEdlResult | null>;
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
    } catch (err: any) {
      console.error('PDF import error:', err);
      showError(err.message || 'Erreur lors de l\'import');
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [token, showError]);

  const createEdlFromPdf = useCallback(async (
    fileUri: string,
    fileName: string,
    logementId: string
  ): Promise<CreateEdlResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.append('pdf', {
        uri: fileUri,
        name: fileName,
        type: 'application/pdf',
      } as any);

      // Extract numeric ID from IRI if needed
      const numericId = logementId.includes('/')
        ? logementId.split('/').pop()
        : logementId;

      formData.append('logement_id', numericId || logementId);

      const response = await fetch(`${API_URL}/ai/import-pdf/creer-edl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF create EDL API error:', errorText);
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
        } catch (e) {
          // Response wasn't JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Création échouée');
      }

      return data as CreateEdlResult;
    } catch (err: any) {
      console.error('PDF create EDL error:', err);
      showError(err.message || 'Erreur lors de la création');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [token, showError]);

  return {
    isImporting,
    isCreating,
    importPdf,
    createEdlFromPdf,
  };
}
