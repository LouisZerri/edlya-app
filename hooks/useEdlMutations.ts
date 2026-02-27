import { useState, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import {
  UPDATE_ETAT_DES_LIEUX,
  CREATE_PIECE,
  CREATE_ELEMENT,
  UPDATE_ELEMENT,
  CREATE_COMPTEUR,
  UPDATE_COMPTEUR,
  CREATE_CLE,
  UPDATE_CLE,
  DELETE_PIECE,
  DELETE_COMPTEUR,
  DELETE_CLE,
  DELETE_ELEMENT,
} from '../graphql/mutations/edl';
import type {
  ElementType,
  ElementEtat,
  CompteurType,
  CleType,
  LocalPhoto} from '../types';
import {
  COMPTEUR_CONFIG,
  CLE_LABELS
} from '../types';
import type {
  EdlNode,
  PieceNode,
  CompteurNode,
  CleNode,
  CreatePieceData,
  CreateElementData,
  CreateCompteurData,
  CreateCleData,
  GraphQLEdge,
  ElementNode,
} from '../types/graphql';
import { getErrorMessage } from '../utils/error';
import { useToastStore } from '../stores/toastStore';
import { useNetworkStore } from '../stores/networkStore';
import { addToQueue } from '../utils/offlineMutationQueue';
import { buildChangedMutations } from '../utils/buildChangedMutations';
import { usePhotoUpload } from './usePhotoUpload';
import type { EdlFormData } from './useEdlInitializer';

interface UseEdlMutationsParams {
  edlId: string;
  edl: EdlNode | undefined;
  formData: EdlFormData;
  localPieces: PieceNode[];
  setLocalPieces: React.Dispatch<React.SetStateAction<PieceNode[]>>;
  localCompteurs: CompteurNode[];
  setLocalCompteurs: React.Dispatch<React.SetStateAction<CompteurNode[]>>;
  localCles: CleNode[];
  setLocalCles: React.Dispatch<React.SetStateAction<CleNode[]>>;
  compteurValues: Record<string, string>;
  compteurNumeros: Record<string, string>;
  compteurComments: Record<string, string>;
  setCompteurValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  cleValues: Record<string, number>;
  setCleValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  elementStates: Record<string, ElementEtat>;
  setElementStates: React.Dispatch<React.SetStateAction<Record<string, ElementEtat>>>;
  elementObservations: Record<string, string>;
  setElementObservations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  elementDegradations: Record<string, string[]>;
  setElementDegradations: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  elementPhotos: Record<string, LocalPhoto[]>;
  compteurPhotos: Record<string, LocalPhoto[]>;
  setExpandedPieces: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useEdlMutations({
  edlId,
  edl: _edl,
  formData,
  localPieces,
  setLocalPieces,
  localCompteurs,
  setLocalCompteurs,
  localCles,
  setLocalCles,
  compteurValues,
  compteurNumeros,
  compteurComments,
  setCompteurValues,
  cleValues,
  setCleValues,
  elementStates,
  setElementStates,
  elementObservations,
  setElementObservations,
  elementDegradations,
  setElementDegradations,
  elementPhotos,
  compteurPhotos,
  setExpandedPieces,
}: UseEdlMutationsParams) {
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const { uploadPhoto } = usePhotoUpload();

  const [saving, setSaving] = useState(false);
  const [showAddPiece, setShowAddPiece] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');
  const [showAddElement, setShowAddElement] = useState<string | null>(null);
  const [newElementName, setNewElementName] = useState('');
  const [newElementType, setNewElementType] = useState<ElementType>('autre');

  const [updateEdl] = useMutation(UPDATE_ETAT_DES_LIEUX);
  const [updateCompteur] = useMutation(UPDATE_COMPTEUR);
  const [updateCle] = useMutation(UPDATE_CLE);
  const [updateElement] = useMutation(UPDATE_ELEMENT);
  const [createPiece] = useMutation(CREATE_PIECE);
  const [createCompteur] = useMutation(CREATE_COMPTEUR);
  const [createCle] = useMutation(CREATE_CLE);
  const [deletePieceMutation] = useMutation(DELETE_PIECE);
  const [deleteCompteurMutation] = useMutation(DELETE_COMPTEUR);
  const [deleteCleMutation] = useMutation(DELETE_CLE);
  const [createElement] = useMutation(CREATE_ELEMENT);
  const [deleteElementMutation] = useMutation(DELETE_ELEMENT);

  // Ref pour que les callbacks stables accèdent aux valeurs fraîches
  const dataRef = useRef({
    formData, localPieces, localCompteurs, localCles,
    compteurValues, compteurNumeros, compteurComments,
    cleValues, elementStates, elementObservations, elementDegradations,
    elementPhotos, compteurPhotos,
    newPieceName, newElementName, newElementType,
  });
  dataRef.current = {
    formData, localPieces, localCompteurs, localCles,
    compteurValues, compteurNumeros, compteurComments,
    cleValues, elementStates, elementObservations, elementDegradations,
    elementPhotos, compteurPhotos,
    newPieceName, newElementName, newElementType,
  };

  const mutationExecutors = useMemo(() => ({
    UPDATE_ETAT_DES_LIEUX: updateEdl,
    UPDATE_ELEMENT: updateElement,
    UPDATE_COMPTEUR: updateCompteur,
    UPDATE_CLE: updateCle,
  }), [updateEdl, updateElement, updateCompteur, updateCle]);

  const handleSave = useCallback(async () => {
    const d = dataRef.current;
    const mutations = buildChangedMutations({
      edlId,
      formData: d.formData,
      localPieces: d.localPieces,
      localCompteurs: d.localCompteurs,
      localCles: d.localCles,
      compteurValues: d.compteurValues,
      compteurNumeros: d.compteurNumeros,
      compteurComments: d.compteurComments,
      cleValues: d.cleValues,
      elementStates: d.elementStates,
      elementObservations: d.elementObservations,
      elementDegradations: d.elementDegradations,
    });

    if (!useNetworkStore.getState().isConnected) {
      for (const entry of mutations) {
        await addToQueue({ mutationName: entry.mutationName, variables: entry.variables });
      }

      let photoCount = 0;
      for (const piece of d.localPieces) {
        const elements = piece.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
        for (const element of elements) {
          const photos = d.elementPhotos[element.id] || [];
          for (const photo of photos) {
            if (photo.uploadStatus === 'pending' || photo.uploadStatus === 'error') {
              const result = await uploadPhoto(element.id, photo);
              if (result.success) photoCount++;
            }
          }
        }
      }
      for (const compteur of d.localCompteurs) {
        const photos = d.compteurPhotos[compteur.id] || [];
        for (const photo of photos) {
          if (photo.uploadStatus === 'pending' || photo.uploadStatus === 'error') {
            const result = await uploadPhoto(compteur.id, photo, 'compteur');
            if (result.success) photoCount++;
          }
        }
      }

      const msg = photoCount > 0
        ? `Modifications + ${photoCount} photo(s) sauvegardées localement`
        : 'Modifications sauvegardées localement';
      success(msg);
      router.back();
      return;
    }

    setSaving(true);
    try {
      for (const entry of mutations) {
        await mutationExecutors[entry.mutationName]({ variables: entry.variables });
      }

      for (const compteur of d.localCompteurs) {
        const photos = d.compteurPhotos[compteur.id] || [];
        for (const photo of photos) {
          if (photo.uploadStatus === 'pending' || photo.uploadStatus === 'error') {
            await uploadPhoto(compteur.id, photo, 'compteur');
          }
        }
      }

      for (const piece of d.localPieces) {
        const elements = piece.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
        for (const element of elements) {
          const photos = d.elementPhotos[element.id] || [];
          for (const photo of photos) {
            if (photo.uploadStatus === 'pending' || photo.uploadStatus === 'error') {
              await uploadPhoto(element.id, photo);
            }
          }
        }
      }

      success('Modifications enregistrées !');
      router.back();
    } catch (err: unknown) {
      showError(getErrorMessage(err) || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [edlId, mutationExecutors, uploadPhoto, success, showError, router]);

  const handleAddPiece = useCallback(() => {
    setShowAddPiece(true);
    setNewPieceName('');
  }, []);

  const confirmAddPiece = useCallback(async () => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return;
    }
    const { newPieceName: name, localPieces: pieces } = dataRef.current;
    if (!name.trim()) {
      showError('Veuillez entrer un nom');
      return;
    }
    try {
      const result = await createPiece({
        variables: {
          input: {
            etatDesLieux: `/api/etat_des_lieuxes/${edlId}`,
            nom: name.trim(),
            ordre: pieces.length + 1,
          },
        },
      });
      const newPiece = (result.data as CreatePieceData)?.createPiece?.piece;
      if (newPiece) {
        setLocalPieces(prev => [...prev, { ...newPiece, elements: { edges: [] } }]);
        setExpandedPieces(prev => [...prev, newPiece.id]);
      }
      success('Pièce ajoutée !');
      setShowAddPiece(false);
      setNewPieceName('');
    } catch (err: unknown) {
      showError(getErrorMessage(err) || 'Erreur');
    }
  }, [edlId, createPiece, setLocalPieces, setExpandedPieces, success, showError]);

  const handleAddCompteur = useCallback((type: CompteurType) => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return;
    }
    Alert.alert('Ajouter compteur', `Ajouter un compteur ${COMPTEUR_CONFIG[type].label} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Ajouter',
        onPress: async () => {
          try {
            const result = await createCompteur({
              variables: {
                input: { etatDesLieux: `/api/etat_des_lieuxes/${edlId}`, type },
              },
            });
            const newCompteur = (result.data as CreateCompteurData)?.createCompteur?.compteur;
            if (newCompteur) {
              setLocalCompteurs(prev => [...prev, newCompteur]);
              setCompteurValues(prev => ({ ...prev, [newCompteur.id]: '' }));
            }
            success('Compteur ajouté !');
          } catch (err: unknown) {
            showError(getErrorMessage(err) || 'Erreur');
          }
        },
      },
    ]);
  }, [edlId, createCompteur, setLocalCompteurs, setCompteurValues, success, showError]);

  const handleAddCle = useCallback((type: CleType) => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return;
    }
    Alert.alert('Ajouter clé', `Ajouter une clé ${CLE_LABELS[type]} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Ajouter',
        onPress: async () => {
          try {
            const result = await createCle({
              variables: {
                input: { etatDesLieux: `/api/etat_des_lieuxes/${edlId}`, type, nombre: 1 },
              },
            });
            const newCle = (result.data as CreateCleData)?.createCle?.cle;
            if (newCle) {
              setLocalCles(prev => [...prev, newCle]);
              setCleValues(prev => ({ ...prev, [newCle.id]: 1 }));
            }
            success('Clé ajoutée !');
          } catch (err: unknown) {
            showError(getErrorMessage(err) || 'Erreur');
          }
        },
      },
    ]);
  }, [edlId, createCle, setLocalCles, setCleValues, success, showError]);

  const handleDeletePiece = useCallback((pieceId: string, nom: string) => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return;
    }
    Alert.alert('Supprimer', `Supprimer la pièce "${nom}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePieceMutation({ variables: { input: { id: pieceId } } });
            setLocalPieces(prev => prev.filter(p => p.id !== pieceId));
            success('Pièce supprimée !');
          } catch (err: unknown) {
            showError(getErrorMessage(err) || 'Erreur');
          }
        },
      },
    ]);
  }, [deletePieceMutation, setLocalPieces, success, showError]);

  const handleDeleteCompteur = useCallback((compteurId: string, label: string) => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return;
    }
    Alert.alert('Supprimer', `Supprimer le compteur "${label}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCompteurMutation({ variables: { input: { id: compteurId } } });
            setLocalCompteurs(prev => prev.filter(c => c.id !== compteurId));
            success('Compteur supprimé !');
          } catch (err: unknown) {
            showError(getErrorMessage(err) || 'Erreur');
          }
        },
      },
    ]);
  }, [deleteCompteurMutation, setLocalCompteurs, success, showError]);

  const handleDeleteCle = useCallback((cleId: string, label: string) => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return;
    }
    Alert.alert('Supprimer', `Supprimer la clé "${label}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCleMutation({ variables: { input: { id: cleId } } });
            setLocalCles(prev => prev.filter(c => c.id !== cleId));
            success('Clé supprimée !');
          } catch (err: unknown) {
            showError(getErrorMessage(err) || 'Erreur');
          }
        },
      },
    ]);
  }, [deleteCleMutation, setLocalCles, success, showError]);

  const handleDeleteClePhoto = useCallback((cleId: string) => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return;
    }
    Alert.alert('Supprimer', 'Supprimer la photo de cette clé ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateCle({ variables: { input: { id: cleId, photo: null } } });
            setLocalCles(prev =>
              prev.map(c => c.id === cleId ? { ...c, photo: undefined } : c)
            );
            success('Photo supprimée !');
          } catch (err: unknown) {
            showError(getErrorMessage(err) || 'Erreur');
          }
        },
      },
    ]);
  }, [updateCle, setLocalCles, success, showError]);

  const handleAddElement = useCallback(async (pieceId: string) => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return;
    }
    const { newElementName: name, newElementType: type } = dataRef.current;
    if (!name.trim()) {
      showError('Veuillez entrer un nom');
      return;
    }
    const piece = dataRef.current.localPieces.find(p => p.id === pieceId);
    const currentCount = piece?.elements?.edges?.length ?? 0;
    try {
      const result = await createElement({
        variables: {
          input: { piece: pieceId, nom: name.trim(), type, etat: 'bon', ordre: currentCount },
        },
      });
      const newElement = (result.data as CreateElementData)?.createElement?.element;
      if (newElement) {
        setLocalPieces(prev =>
          prev.map(p => {
            if (p.id === pieceId) {
              const currentElements = p.elements?.edges || [];
              return { ...p, elements: { edges: [...currentElements, { node: newElement }] } };
            }
            return p;
          })
        );
        setElementStates(prev => ({ ...prev, [newElement.id]: 'bon' as ElementEtat }));
        setElementObservations(prev => ({ ...prev, [newElement.id]: '' }));
        setElementDegradations(prev => ({ ...prev, [newElement.id]: [] }));
      }
      setShowAddElement(null);
      setNewElementName('');
      setNewElementType('autre');
      success('Élément ajouté !');
    } catch (err: unknown) {
      showError(getErrorMessage(err) || 'Erreur');
    }
  }, [createElement, setLocalPieces, setElementStates, setElementObservations, setElementDegradations, success, showError]);

  const handleDeleteElement = useCallback((elementId: string, elementName: string, pieceId: string) => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return;
    }
    Alert.alert('Supprimer', `Supprimer l'élément "${elementName}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteElementMutation({ variables: { input: { id: elementId } } });
            setLocalPieces(prev =>
              prev.map(p => {
                if (p.id === pieceId) {
                  return {
                    ...p,
                    elements: {
                      edges: (p.elements?.edges || []).filter((e: GraphQLEdge<ElementNode>) => e.node.id !== elementId),
                    },
                  };
                }
                return p;
              })
            );
            success('Élément supprimé !');
          } catch (err: unknown) {
            showError(getErrorMessage(err) || 'Erreur');
          }
        },
      },
    ]);
  }, [deleteElementMutation, setLocalPieces, success, showError]);

  return useMemo(() => ({
    saving,
    showAddPiece, setShowAddPiece,
    newPieceName, setNewPieceName,
    showAddElement, setShowAddElement,
    newElementName, setNewElementName,
    newElementType, setNewElementType,
    handleSave,
    handleAddPiece,
    confirmAddPiece,
    handleAddCompteur,
    handleAddCle,
    handleDeletePiece,
    handleDeleteCompteur,
    handleDeleteCle,
    handleDeleteClePhoto,
    handleAddElement,
    handleDeleteElement,
  }), [
    saving, showAddPiece, newPieceName, showAddElement, newElementName, newElementType,
    handleSave, handleAddPiece, confirmAddPiece, handleAddCompteur, handleAddCle,
    handleDeletePiece, handleDeleteCompteur, handleDeleteCle, handleDeleteClePhoto,
    handleAddElement, handleDeleteElement,
  ]);
}
