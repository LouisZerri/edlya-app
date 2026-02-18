import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_ETAT_DES_LIEUX, UPDATE_ELEMENT, UPDATE_COMPTEUR, UPDATE_CLE } from '../graphql/mutations/edl';
import { ElementEtat } from '../types';
import { EdlNode, PieceNode, CompteurNode, CleNode, GraphQLEdge, ElementNode } from '../types/graphql';
import { displayDateToApi } from '../utils/format';
import { EdlFormData } from './useEdlInitializer';

export type AutoSaveStatus = 'idle' | 'modified' | 'saving' | 'saved' | 'error';

interface UseEdlAutoSaveParams {
  edlId: string;
  edl: EdlNode | undefined;
  formData: EdlFormData;
  localPieces: PieceNode[];
  localCompteurs: CompteurNode[];
  localCles: CleNode[];
  compteurValues: Record<string, string>;
  cleValues: Record<string, number>;
  elementStates: Record<string, ElementEtat>;
  elementObservations: Record<string, string>;
  elementDegradations: Record<string, string[]>;
}

export function useEdlAutoSave({
  edlId,
  edl,
  formData,
  localPieces,
  localCompteurs,
  localCles,
  compteurValues,
  cleValues,
  elementStates,
  elementObservations,
  elementDegradations,
}: UseEdlAutoSaveParams) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  const [updateEdl] = useMutation(UPDATE_ETAT_DES_LIEUX);
  const [updateElement] = useMutation(UPDATE_ELEMENT);
  const [updateCompteur] = useMutation(UPDATE_COMPTEUR);
  const [updateCle] = useMutation(UPDATE_CLE);

  const performAutoSave = useCallback(async () => {
    if (!edl || !isInitialized.current) return;
    setAutoSaveStatus('saving');
    try {
      await updateEdl({
        variables: {
          input: {
            id: `/api/etat_des_lieuxes/${edlId}`,
            locataireNom: formData.locataireNom,
            locataireEmail: formData.locataireEmail || null,
            locataireTelephone: formData.locataireTelephone || null,
            dateRealisation: displayDateToApi(formData.dateRealisation),
            observationsGenerales: formData.observationsGenerales || null,
          },
        },
      });

      // Update elements that changed
      for (const piece of localPieces) {
        const elements = piece.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
        for (const element of elements) {
          const hasStateChange = elementStates[element.id] !== element.etat;
          const hasObsChange = elementObservations[element.id] !== (element.observations || '');
          const currentDegs = Array.isArray(elementDegradations[element.id]) ? elementDegradations[element.id] : [];
          const originalDegs = Array.isArray(element.degradations) ? element.degradations : [];
          const hasDegChange = JSON.stringify(currentDegs) !== JSON.stringify(originalDegs);

          if (hasStateChange || hasObsChange || hasDegChange) {
            await updateElement({
              variables: {
                input: {
                  id: element.id,
                  etat: elementStates[element.id],
                  observations: elementObservations[element.id] || null,
                  degradations: currentDegs,
                },
              },
            });
          }
        }
      }

      // Update compteurs
      for (const compteur of localCompteurs) {
        if (compteurValues[compteur.id] !== compteur.indexValue) {
          await updateCompteur({
            variables: {
              input: {
                id: compteur.id,
                indexValue: compteurValues[compteur.id],
              },
            },
          });
        }
      }

      // Update cles
      for (const cle of localCles) {
        if (cleValues[cle.id] !== cle.nombre) {
          await updateCle({
            variables: {
              input: {
                id: cle.id,
                nombre: cleValues[cle.id],
              },
            },
          });
        }
      }

      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
    }
  }, [edl, edlId, formData, localPieces, localCompteurs, localCles, compteurValues, cleValues, elementStates, elementObservations, elementDegradations, updateEdl, updateElement, updateCompteur, updateCle]);

  const triggerAutoSave = useCallback(() => {
    if (!isInitialized.current) return;
    setAutoSaveStatus('modified');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      performAutoSave();
    }, 3000);
  }, [performAutoSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  // Mark initialized after first data load
  useEffect(() => {
    if (edl && !isInitialized.current) {
      setTimeout(() => { isInitialized.current = true; }, 500);
    }
  }, [edl]);

  // Watch for changes and trigger auto-save
  useEffect(() => {
    triggerAutoSave();
  }, [formData, compteurValues, cleValues, elementStates, elementObservations, elementDegradations]);

  return { autoSaveStatus };
}
