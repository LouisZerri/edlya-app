import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_ETAT_DES_LIEUX, UPDATE_ELEMENT, UPDATE_COMPTEUR, UPDATE_CLE } from '../graphql/mutations/edl';
import { ElementEtat } from '../types';
import { EdlNode, PieceNode, CompteurNode, CleNode } from '../types/graphql';
import { EdlFormData } from './useEdlInitializer';
import { useNetworkStore } from '../stores/networkStore';
import { addToQueue } from '../utils/offlineMutationQueue';
import { buildChangedMutations } from '../utils/buildChangedMutations';

export type AutoSaveStatus = 'idle' | 'modified' | 'saving' | 'saved' | 'queued' | 'syncing' | 'error';

interface UseEdlAutoSaveParams {
  edlId: string;
  edl: EdlNode | undefined;
  formData: EdlFormData;
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

export function useEdlAutoSave({
  edlId,
  edl,
  formData,
  localPieces,
  localCompteurs,
  localCles,
  compteurValues,
  compteurNumeros,
  compteurComments,
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

  const mutationExecutors = {
    UPDATE_ETAT_DES_LIEUX: updateEdl,
    UPDATE_ELEMENT: updateElement,
    UPDATE_COMPTEUR: updateCompteur,
    UPDATE_CLE: updateCle,
  };

  const performAutoSave = useCallback(async () => {
    if (!edl || !isInitialized.current) return;

    const mutations = buildChangedMutations({
      edlId,
      formData,
      localPieces,
      localCompteurs,
      localCles,
      compteurValues,
      compteurNumeros,
      compteurComments,
      cleValues,
      elementStates,
      elementObservations,
      elementDegradations,
    });

    const { isConnected } = useNetworkStore.getState();

    if (isConnected) {
      setAutoSaveStatus('saving');
      try {
        for (const entry of mutations) {
          await mutationExecutors[entry.mutationName]({ variables: entry.variables });
        }
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
        return;
      } catch {
        // Network failed — fall through to offline queue
      }
    }

    // Offline or network error fallback: queue mutations
    try {
      for (const entry of mutations) {
        await addToQueue({ mutationName: entry.mutationName, variables: entry.variables });
      }
      setAutoSaveStatus('queued');
    } catch {
      setAutoSaveStatus('error');
    }
  }, [edl, edlId, formData, localPieces, localCompteurs, localCles, compteurValues, compteurNumeros, compteurComments, cleValues, elementStates, elementObservations, elementDegradations, updateEdl, updateElement, updateCompteur, updateCle]);

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
  }, [formData, compteurValues, compteurNumeros, compteurComments, cleValues, elementStates, elementObservations, elementDegradations]);

  return { autoSaveStatus, setAutoSaveStatus, performAutoSave };
}
