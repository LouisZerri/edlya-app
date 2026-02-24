import { ElementEtat } from '../types';
import { PieceNode, CompteurNode, CleNode, GraphQLEdge, ElementNode } from '../types/graphql';
import { displayDateToApi } from './format';

export interface EdlSyncFormData {
  locataireNom: string;
  locataireEmail: string;
  locataireTelephone: string;
  autresLocataires: string[];
  dateRealisation: string;
  observationsGenerales: string;
}

export interface MutationEntry {
  mutationName: 'UPDATE_ETAT_DES_LIEUX' | 'UPDATE_ELEMENT' | 'UPDATE_COMPTEUR' | 'UPDATE_CLE';
  variables: { input: Record<string, unknown> };
}

interface BuildChangedMutationsParams {
  edlId: string;
  formData: EdlSyncFormData;
  localPieces: PieceNode[];
  localCompteurs: CompteurNode[];
  localCles: CleNode[];
  compteurValues: Record<string, string>;
  compteurNumeros: Record<string, string>;
  compteurComments: Record<string, string>;
  cleValues: Record<string, number>;
  elementStates: Record<string, ElementEtat>;
  elementObservations: Record<string, string>;
  elementDegradations: Record<string, string[]>;
}

export function buildChangedMutations(params: BuildChangedMutationsParams): MutationEntry[] {
  const mutations: MutationEntry[] = [];

  // EDL update (always included)
  mutations.push({
    mutationName: 'UPDATE_ETAT_DES_LIEUX',
    variables: {
      input: {
        id: `/api/etat_des_lieuxes/${params.edlId}`,
        locataireNom: params.formData.locataireNom,
        locataireEmail: params.formData.locataireEmail || null,
        locataireTelephone: params.formData.locataireTelephone || null,
        autresLocataires: params.formData.autresLocataires.length > 0 ? params.formData.autresLocataires : null,
        dateRealisation: displayDateToApi(params.formData.dateRealisation),
        observationsGenerales: params.formData.observationsGenerales || null,
      },
    },
  });

  // Elements
  for (const piece of params.localPieces) {
    const elements = piece.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
    for (const element of elements) {
      const hasStateChange = params.elementStates[element.id] !== element.etat;
      const hasObsChange = params.elementObservations[element.id] !== (element.observations || '');
      const currentDegs = Array.isArray(params.elementDegradations[element.id]) ? params.elementDegradations[element.id] : [];
      const originalDegs = Array.isArray(element.degradations) ? element.degradations : [];
      const hasDegChange = JSON.stringify(currentDegs) !== JSON.stringify(originalDegs);

      if (hasStateChange || hasObsChange || hasDegChange) {
        mutations.push({
          mutationName: 'UPDATE_ELEMENT',
          variables: {
            input: {
              id: element.id,
              etat: params.elementStates[element.id],
              observations: params.elementObservations[element.id] || null,
              degradations: currentDegs,
            },
          },
        });
      }
    }
  }

  // Compteurs
  for (const compteur of params.localCompteurs) {
    const hasIndexChange = params.compteurValues[compteur.id] !== compteur.indexValue;
    const hasNumeroChange = params.compteurNumeros[compteur.id] !== (compteur.numero || '');
    const hasCommentChange = params.compteurComments[compteur.id] !== (compteur.commentaire || '');

    if (hasIndexChange || hasNumeroChange || hasCommentChange) {
      mutations.push({
        mutationName: 'UPDATE_COMPTEUR',
        variables: {
          input: {
            id: compteur.id,
            indexValue: params.compteurValues[compteur.id],
            numero: params.compteurNumeros[compteur.id] || null,
            commentaire: params.compteurComments[compteur.id] || null,
          },
        },
      });
    }
  }

  // Clés
  for (const cle of params.localCles) {
    if (params.cleValues[cle.id] !== cle.nombre) {
      mutations.push({
        mutationName: 'UPDATE_CLE',
        variables: {
          input: {
            id: cle.id,
            nombre: params.cleValues[cle.id],
          },
        },
      });
    }
  }

  return mutations;
}
