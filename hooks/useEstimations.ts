import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';

interface DegradationPhoto {
  id: string;
  chemin: string;
  legende?: string;
}

interface DegradationEstimation {
  piece: string;
  piece_id?: string;
  element: string;
  element_id?: string;
  type_element: string;
  degradation: string;
  etat_entree?: string;
  etat_sortie: string;
  montant_brut: number;
  taux_vetuste: number;
  montant_net: number;
  intervention?: string;      // La réparation à faire
  justification?: string;     // Détails/explication du coût
  photos: DegradationPhoto[]; // Photos associées
}

interface CleManquante {
  type: string;
  nombre_entree: number;
  nombre_sortie: number;
  manquantes: number;
  cout_unitaire: number;
  total: number;
}

interface CompteurDiff {
  type: string;
  index_entree?: string;
  index_sortie?: string;
  consommation?: string;
}

export interface EstimationsResult {
  success: boolean;
  edl_id: number;
  type_edl: string;
  duree_location_mois?: number;
  depot_garantie?: number;
  degradations: DegradationEstimation[];
  cles_manquantes: CleManquante[];
  compteurs: CompteurDiff[];
  nettoyage: number;
  total_brut: number;
  total_abattement_vetuste: number;
  total_cles: number;
  total_retenues: number;
  a_restituer: number;
  grille_vetuste: {
    element: string;
    duree_vie: string;
    taux_applique: string;
  }[];
  message?: string;
}

// Transformer les données brutes de l'API vers le format attendu par l'UI
function transformApiResponse(data: any): EstimationsResult {
  // Transformer les dégradations
  const degradations: DegradationEstimation[] = (data.degradations || []).map((d: any) => {
    // Extraire la dégradation depuis observations ou degradations_specifiques
    let degradation = d.observations || '';
    if (d.degradations_specifiques?.liste?.length > 0) {
      degradation = d.degradations_specifiques.liste.join(', ');
    } else if (d.degradations_specifiques?.description) {
      degradation = d.degradations_specifiques.description;
    }

    return {
      piece: d.piece,
      piece_id: d.piece_id,
      element: d.element,
      element_id: d.element_id,
      type_element: d.type,
      degradation: degradation || 'Dégradation constatée',
      etat_entree: d.etat_entree,
      etat_sortie: d.etat_sortie,
      montant_brut: d.cout_brut || 0,
      taux_vetuste: d.taux_vetuste || 100,
      montant_net: d.cout_apres_vetuste || d.cout_brut || 0,
      intervention: d.intervention || d.type_intervention,
      justification: d.justification || d.details,
      photos: (d.photos || []).map((p: any) => ({
        id: p.id,
        chemin: p.chemin,
        legende: p.legende,
      })),
    };
  });

  // Transformer les clés manquantes
  const cles_manquantes: CleManquante[] = (data.cles_manquantes || []).map((c: any) => ({
    type: c.type,
    nombre_entree: c.nombre_entree || 0,
    nombre_sortie: c.nombre_sortie || 0,
    manquantes: c.manquantes || 0,
    cout_unitaire: c.cout_unitaire || 0,
    total: c.cout_total || c.total || 0,
  }));

  // Calculer les totaux
  const total_brut = degradations.reduce((sum, d) => sum + d.montant_brut, 0);
  const total_net = degradations.reduce((sum, d) => sum + d.montant_net, 0);
  const total_abattement_vetuste = total_brut - total_net;
  const total_cles = cles_manquantes.reduce((sum, c) => sum + c.total, 0);

  // Transformer la grille de vétusté
  const grille_vetuste = (data.grille_vetuste || []).map((g: any) => ({
    element: g.annees ? `${g.annees} ans` : g.element || '',
    duree_vie: g.annees || g.duree_vie || '',
    taux_applique: g.taux_locataire ? `${g.taux_locataire}%` : g.taux_applique || '',
  }));

  return {
    success: data.success,
    edl_id: data.edl_id,
    type_edl: data.type_edl || 'sortie',
    duree_location_mois: data.dates?.duree_location_mois || data.duree_location_mois,
    depot_garantie: data.depot_garantie || 0,
    degradations,
    cles_manquantes,
    compteurs: data.compteurs || [],
    nettoyage: data.nettoyage || 0,
    total_brut: data.resume?.cout_degradations || total_brut,
    total_abattement_vetuste,
    total_cles: data.resume?.cout_cles || total_cles,
    total_retenues: data.total_retenues || 0,
    a_restituer: data.a_restituer || 0,
    grille_vetuste,
    message: data.message,
  };
}

interface UseEstimationsReturn {
  isLoading: boolean;
  estimations: EstimationsResult | null;
  generateEstimations: (edlId: string) => Promise<EstimationsResult | null>;
  refreshEstimations: (edlId: string) => Promise<EstimationsResult | null>;
}

export function useEstimations(): UseEstimationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [estimations, setEstimations] = useState<EstimationsResult | null>(null);
  const token = useAuthStore(state => state.token);
  const { error: showError } = useToastStore();

  const generateEstimations = useCallback(async (
    edlId: string
  ): Promise<EstimationsResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsLoading(true);

    try {
      // Extract numeric ID from IRI if needed
      const numericId = edlId.includes('/')
        ? edlId.split('/').pop()
        : edlId;

      const response = await fetch(`${API_URL}/ai/estimations/${numericId}`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Estimations API error:', errorText);
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
        throw new Error(data.message || 'Génération des estimations échouée');
      }

      const transformed = transformApiResponse(data);
      setEstimations(transformed);
      return transformed;
    } catch (err: any) {
      console.error('Estimations error:', err);
      showError(err.message || 'Erreur lors de la génération des estimations');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token, showError]);

  const refreshEstimations = useCallback(async (
    edlId: string
  ): Promise<EstimationsResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsLoading(true);

    try {
      const numericId = edlId.includes('/')
        ? edlId.split('/').pop()
        : edlId;

      const response = await fetch(`${API_URL}/ai/estimations/${numericId}/refresh`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Estimations refresh API error:', errorText);
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
        throw new Error(data.message || 'Rafraîchissement des estimations échoué');
      }

      const transformed = transformApiResponse(data);
      setEstimations(transformed);
      return transformed;
    } catch (err: any) {
      console.error('Estimations refresh error:', err);
      showError(err.message || 'Erreur lors du rafraîchissement');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token, showError]);

  return {
    isLoading,
    estimations,
    generateEstimations,
    refreshEstimations,
  };
}
