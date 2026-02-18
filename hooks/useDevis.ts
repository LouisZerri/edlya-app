import { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';

export interface LigneDevis {
  id: string;
  piece: string;
  element?: string;
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  total: number;
}

export interface CoutSuggestion {
  id: number;
  nom: string;
  description?: string;
  unite: string;
  prix_unitaire: number;
  type_element: string;
}

export interface DegradationInitiale {
  piece: string;
  element: string;
  type: string;
  intervention: string;
  cout_brut: number;
  observations?: string;
}

let nextId = 1;
function generateId(): string {
  return `devis_${Date.now()}_${nextId++}`;
}

export interface UseDevisReturn {
  lignes: LigneDevis[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  addLigne: (ligne?: Partial<LigneDevis>) => void;
  updateLigne: (id: string, updates: Partial<LigneDevis>) => void;
  removeLigne: (id: string) => void;
  setLignesFromDegradations: (degradations: DegradationInitiale[]) => void;
  setLignesFromIA: (lignes: LigneDevis[]) => void;
  isAnalyzing: boolean;
  analyserAvecIA: (edlId: string) => Promise<boolean>;
  suggestions: Record<string, CoutSuggestion[]>;
  loadSuggestions: () => Promise<void>;
  isSuggestionsLoaded: boolean;
}

export function useDevis(): UseDevisReturn {
  const [lignes, setLignes] = useState<LigneDevis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, CoutSuggestion[]>>({});
  const [isSuggestionsLoaded, setIsSuggestionsLoaded] = useState(false);
  const token = useAuthStore(state => state.token);
  const { success: showSuccess, error: showError } = useToastStore();

  const totalHT = useMemo(() => {
    return lignes.reduce((sum, l) => sum + l.total, 0);
  }, [lignes]);

  const tva = useMemo(() => Math.round(totalHT * 0.2 * 100) / 100, [totalHT]);
  const totalTTC = useMemo(() => Math.round((totalHT + tva) * 100) / 100, [totalHT, tva]);

  const addLigne = useCallback((partialLigne?: Partial<LigneDevis>) => {
    const newLigne: LigneDevis = {
      id: generateId(),
      piece: partialLigne?.piece || '',
      element: partialLigne?.element || '',
      description: partialLigne?.description || '',
      quantite: partialLigne?.quantite || 1,
      unite: partialLigne?.unite || 'forfait',
      prix_unitaire: partialLigne?.prix_unitaire || 0,
      total: (partialLigne?.quantite || 1) * (partialLigne?.prix_unitaire || 0),
    };
    setLignes(prev => [...prev, newLigne]);
  }, []);

  const updateLigne = useCallback((id: string, updates: Partial<LigneDevis>) => {
    setLignes(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, ...updates };
      updated.total = Math.round(updated.quantite * updated.prix_unitaire * 100) / 100;
      return updated;
    }));
  }, []);

  const removeLigne = useCallback((id: string) => {
    setLignes(prev => prev.filter(l => l.id !== id));
  }, []);

  const setLignesFromDegradations = useCallback((degradations: DegradationInitiale[]) => {
    const newLignes: LigneDevis[] = degradations.map(d => ({
      id: generateId(),
      piece: d.piece,
      element: d.element,
      description: d.intervention
        ? `${d.intervention} - ${d.observations || 'Dégradation constatée'}`
        : d.observations || 'Dégradation constatée',
      quantite: 1,
      unite: 'forfait',
      prix_unitaire: d.cout_brut || 0,
      total: d.cout_brut || 0,
    }));
    setLignes(newLignes);
  }, []);

  const setLignesFromIA = useCallback((iaLignes: LigneDevis[]) => {
    setLignes(iaLignes.map(l => ({
      ...l,
      id: l.id || generateId(),
    })));
  }, []);

  const analyserAvecIA = useCallback(async (edlId: string): Promise<boolean> => {
    if (!token) {
      showError('Non authentifié');
      return false;
    }

    setIsAnalyzing(true);

    try {
      const numericId = edlId.includes('/') ? edlId.split('/').pop() : edlId;

      const response = await fetch(`${API_URL}/ai/analyser-degradations/${numericId}`, {
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
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Analyse échouée');
      }

      if (data.lignes && data.lignes.length > 0) {
        const iaLignes: LigneDevis[] = data.lignes.map((l: { piece?: string; element?: string; description?: string; quantite?: number; unite?: string; prix_unitaire?: number; total?: number }) => ({
          id: generateId(),
          piece: l.piece || '',
          element: l.element || '',
          description: l.description || '',
          quantite: l.quantite || 1,
          unite: l.unite || 'forfait',
          prix_unitaire: l.prix_unitaire || 0,
          total: l.total || 0,
        }));
        setLignes(iaLignes);
        showSuccess('Devis affiné par IA !');
      } else {
        showSuccess('Aucune dégradation détectée');
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'analyse IA';
      showError(msg);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  }, [token, showSuccess, showError]);

  const loadSuggestions = useCallback(async () => {
    if (!token || isSuggestionsLoaded) return;

    try {
      const response = await fetch(`${API_URL}/couts-reparation`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur chargement suggestions');

      const data = await response.json();

      // Transformer en CoutSuggestion[]
      const result: Record<string, CoutSuggestion[]> = {};
      for (const [type, items] of Object.entries(data)) {
        result[type] = (items as Array<{ id: number; nom: string; description?: string; unite: string; prix_unitaire: number }>).map(item => ({
          id: item.id,
          nom: item.nom,
          description: item.description,
          unite: item.unite,
          prix_unitaire: item.prix_unitaire,
          type_element: type,
        }));
      }

      setSuggestions(result);
      setIsSuggestionsLoaded(true);
    } catch {
      // Silently fail for suggestions loading
    }
  }, [token, isSuggestionsLoaded]);

  return {
    lignes,
    totalHT,
    tva,
    totalTTC,
    addLigne,
    updateLigne,
    removeLigne,
    setLignesFromDegradations,
    setLignesFromIA,
    isAnalyzing,
    analyserAvecIA,
    suggestions,
    loadSuggestions,
    isSuggestionsLoaded,
  };
}
