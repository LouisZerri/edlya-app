import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';

interface CompteurComparatif {
  type: string;
  index_entree?: string;
  index_sortie?: string;
  consommation?: string;
}

interface CleComparatif {
  type: string;
  nombre_entree: number;
  nombre_sortie: number;
  difference: number;
  ok: boolean;
}

interface ElementComparatif {
  nom: string;
  type: string;
  etat_entree?: string;
  etat_sortie: string;
  degradations: string[];
  has_degradation: boolean;
}

interface PieceComparatif {
  nom: string;
  elements: ElementComparatif[];
  nb_degradations: number;
}

interface DegradationDetail {
  piece: string;
  element: string;
  etat_entree?: string;
  etat_sortie: string;
  degradations: string[];
}

// Types bruts de l'API REST comparatif
interface RawCompteur {
  type: string;
  entree?: { index?: string; numero?: string };
  sortie?: { index?: string; numero?: string };
  indexEntree?: string;
  index_entree?: string;
  indexSortie?: string;
  index_sortie?: string;
  consommation?: string | number;
}

interface RawCle {
  type: string;
  entree?: number;
  sortie?: number;
  nombreEntree?: number;
  nombre_entree?: number;
  nombreSortie?: number;
  nombre_sortie?: number;
  difference?: number;
}

interface RawElement {
  element?: string;
  nom?: string;
  type?: string;
  entree?: { etat?: string; observations?: string };
  sortie?: { etat?: string; observations?: string };
  evolution?: string;
  etatEntree?: string;
  etat_entree?: string;
  etatSortie?: string;
  etat_sortie?: string;
}

interface RawPiece {
  nom?: string;
  name?: string;
  elements?: RawElement[];
}

export interface ComparatifResult {
  logement: {
    id: number;
    nom: string;
    adresse: string;
    ville: string;
  };
  entree?: {
    id: number;
    dateRealisation: string;
    locataireNom: string;
    statut: string;
    type: string;
  };
  sortie: {
    id: number;
    dateRealisation: string;
    locataireNom: string;
    statut: string;
    type: string;
  };
  comparatif: {
    compteurs: CompteurComparatif[];
    cles: CleComparatif[];
    pieces: Record<string, ElementComparatif[]>;
    degradations: DegradationDetail[];
    statistiques: {
      totalElements: number;
      elementsDegrades: number;
      elementsAmeliores: number;
      elementsIdentiques: number;
    };
  };
  // Computed fields for UI
  has_edl_entree: boolean;
  date_entree?: string;
  date_sortie: string;
  duree_location_mois?: number;
  nb_total_degradations: number;
  compteurs_formatted: CompteurComparatif[];
  cles_formatted: CleComparatif[];
  pieces_formatted: PieceComparatif[];
}

interface UseComparatifReturn {
  isLoading: boolean;
  comparatif: ComparatifResult | null;
  loadComparatif: (edlId: string) => Promise<ComparatifResult | null>;
}

export function useComparatif(): UseComparatifReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [comparatif, setComparatif] = useState<ComparatifResult | null>(null);
  const token = useAuthStore(state => state.token);
  const { error: showError } = useToastStore();

  const loadComparatif = useCallback(async (
    edlId: string
  ): Promise<ComparatifResult | null> => {
    if (!token) {
      showError('Non authentifié');
      return null;
    }

    setIsLoading(true);

    try {
      const numericId = edlId.includes('/')
        ? edlId.split('/').pop()
        : edlId;

      const response = await fetch(`${API_URL}/edl/${numericId}/comparatif`, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Comparatif API error:', errorText);
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Transform API response to UI format
      const hasEntree = !!data.entree;

      // L'API peut retourner les données soit sous data.comparatif soit directement sous data
      const comparatifData = data.comparatif || data;

      // Format compteurs - structure API: { entree: { index, numero }, sortie: { index, numero }, consommation }
      const rawCompteurs = comparatifData?.compteurs || data.compteurs || [];

      const compteurs_formatted: CompteurComparatif[] = rawCompteurs.map((c: RawCompteur) => ({
        type: c.type,
        index_entree: c.entree?.index || c.indexEntree || c.index_entree,
        index_sortie: c.sortie?.index || c.indexSortie || c.index_sortie,
        consommation: c.consommation ? String(c.consommation) : undefined,
      }));

      // Format clés - structure API: { type, entree: number, sortie: number, difference: number }
      const rawCles = comparatifData?.cles || data.cles || [];

      const cles_formatted: CleComparatif[] = rawCles.map((c: RawCle) => {
        // L'API retourne directement entree/sortie comme nombres
        const nombreEntree = c.entree ?? c.nombreEntree ?? c.nombre_entree ?? 0;
        const nombreSortie = c.sortie ?? c.nombreSortie ?? c.nombre_sortie ?? 0;
        const diff = c.difference ?? (nombreEntree - nombreSortie);
        return {
          type: c.type,
          nombre_entree: nombreEntree,
          nombre_sortie: nombreSortie,
          difference: diff,
          ok: diff >= 0, // OK si pas de manquantes (difference >= 0)
        };
      });

      // Format pièces - structure API: { "NomPiece": [elements] }
      const rawPieces = comparatifData?.pieces || data.pieces || {};

      let pieces_formatted: PieceComparatif[] = [];

      // Si c'est un objet avec les noms des pièces comme clés
      // Structure API: { "Salon": [{ element, type, entree: { etat, observations }, sortie: { etat, observations }, evolution }] }
      if (rawPieces && typeof rawPieces === 'object' && !Array.isArray(rawPieces)) {
        pieces_formatted = Object.entries(rawPieces).map(([nom, elements]) => {
          const typedElements = elements as RawElement[];
          const elementsArray = Array.isArray(typedElements) ? typedElements : [];
          const formattedElements: ElementComparatif[] = elementsArray.map((el: RawElement) => {
            // Extraire les observations comme dégradations si présentes
            const degradationsList: string[] = [];
            if (el.sortie?.observations) {
              degradationsList.push(el.sortie.observations);
            }

            const isDegraded = el.evolution === 'degrade';

            return {
              nom: el.element || el.nom || 'Élément',
              type: el.type || 'autre',
              etat_entree: el.entree?.etat || el.etatEntree || el.etat_entree,
              etat_sortie: el.sortie?.etat || el.etatSortie || el.etat_sortie || 'non_renseigne',
              degradations: degradationsList,
              has_degradation: isDegraded,
            };
          });

          const nbDegradations = formattedElements.filter(el => el.has_degradation).length;

          return {
            nom,
            elements: formattedElements,
            nb_degradations: nbDegradations,
          };
        });
      }
      // Si c'est un tableau de pièces
      else if (Array.isArray(rawPieces)) {
        pieces_formatted = rawPieces.map((piece: RawPiece) => {
          const elementsArray = Array.isArray(piece.elements) ? piece.elements : [];
          const formattedElements: ElementComparatif[] = elementsArray.map((el: RawElement) => {
            const degradationsList: string[] = [];
            if (el.sortie?.observations) {
              degradationsList.push(el.sortie.observations);
            }

            const isDegraded = el.evolution === 'degrade';

            return {
              nom: el.element || el.nom || 'Élément',
              type: el.type || 'autre',
              etat_entree: el.entree?.etat || el.etatEntree || el.etat_entree,
              etat_sortie: el.sortie?.etat || el.etatSortie || el.etat_sortie || 'non_renseigne',
              degradations: degradationsList,
              has_degradation: isDegraded,
            };
          });

          const nbDegradations = formattedElements.filter(el => el.has_degradation).length;

          return {
            nom: piece.nom || piece.name || 'Pièce',
            elements: formattedElements,
            nb_degradations: nbDegradations,
          };
        });
      }

      // Calculate duration
      let duree_location_mois: number | undefined;
      if (data.entree?.dateRealisation && data.sortie?.dateRealisation) {
        const dateEntree = new Date(data.entree.dateRealisation);
        const dateSortie = new Date(data.sortie.dateRealisation);
        const diffTime = Math.abs(dateSortie.getTime() - dateEntree.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        duree_location_mois = Math.round(diffDays / 30);
      }

      const result: ComparatifResult = {
        logement: data.logement,
        entree: data.entree,
        sortie: data.sortie,
        comparatif: comparatifData,
        has_edl_entree: hasEntree,
        date_entree: data.entree?.dateRealisation,
        date_sortie: data.sortie?.dateRealisation,
        duree_location_mois,
        nb_total_degradations: comparatifData?.statistiques?.elementsDegrades || comparatifData?.degradations?.length || data.statistiques?.elementsDegrades || 0,
        compteurs_formatted,
        cles_formatted,
        pieces_formatted,
      };

      setComparatif(result);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement du comparatif';
      showError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token, showError]);

  return {
    isLoading,
    comparatif,
    loadComparatif,
  };
}
