import { useState } from 'react';
import { Alert } from 'react-native';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'expo-router';
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
import {
  COMPTEUR_CONFIG,
  CLE_LABELS,
  ElementType,
  ElementEtat,
  CompteurType,
  CleType,
  LocalPhoto,
} from '../types';
import {
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
import { displayDateToApi } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import { useToastStore } from '../stores/toastStore';
import { useNetworkStore } from '../stores/networkStore';
import { addToQueue } from '../utils/offlineMutationQueue';
import { usePhotoUpload } from './usePhotoUpload';
import { EdlFormData } from './useEdlInitializer';

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
  edl,
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

  const requireOnline = (): boolean => {
    if (!useNetworkStore.getState().isConnected) {
      showError('Connexion requise pour ajouter/supprimer');
      return false;
    }
    return true;
  };

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

  const queueAllMutations = async () => {
    await addToQueue({
      mutationName: 'UPDATE_ETAT_DES_LIEUX',
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

    for (const piece of localPieces) {
      const elements = piece.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
      for (const element of elements) {
        const hasStateChange = elementStates[element.id] !== element.etat;
        const hasObsChange = elementObservations[element.id] !== (element.observations || '');
        const currentDegs = Array.isArray(elementDegradations[element.id]) ? elementDegradations[element.id] : [];
        const originalDegs = Array.isArray(element.degradations) ? element.degradations : [];
        const hasDegChange = JSON.stringify(currentDegs) !== JSON.stringify(originalDegs);

        if (hasStateChange || hasObsChange || hasDegChange) {
          await addToQueue({
            mutationName: 'UPDATE_ELEMENT',
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

    for (const compteur of localCompteurs) {
      const hasIndexChange = compteurValues[compteur.id] !== compteur.indexValue;
      const hasNumeroChange = compteurNumeros[compteur.id] !== (compteur.numero || '');
      const hasCommentChange = compteurComments[compteur.id] !== (compteur.commentaire || '');

      if (hasIndexChange || hasNumeroChange || hasCommentChange) {
        await addToQueue({
          mutationName: 'UPDATE_COMPTEUR',
          variables: {
            input: {
              id: compteur.id,
              indexValue: compteurValues[compteur.id],
              numero: compteurNumeros[compteur.id] || null,
              commentaire: compteurComments[compteur.id] || null,
            },
          },
        });
      }
    }

    for (const cle of localCles) {
      if (cleValues[cle.id] !== cle.nombre) {
        await addToQueue({
          mutationName: 'UPDATE_CLE',
          variables: {
            input: {
              id: cle.id,
              nombre: cleValues[cle.id],
            },
          },
        });
      }
    }
  };

  const handleSave = async () => {
    if (!useNetworkStore.getState().isConnected) {
      await queueAllMutations();

      // Persist and queue pending photos
      let photoCount = 0;
      for (const piece of localPieces) {
        const elements = piece.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
        for (const element of elements) {
          const photos = elementPhotos[element.id] || [];
          for (const photo of photos) {
            if (photo.uploadStatus === 'pending' || photo.uploadStatus === 'error') {
              const result = await uploadPhoto(element.id, photo);
              if (result.success) photoCount++;
            }
          }
        }
      }
      for (const compteur of localCompteurs) {
        const photos = compteurPhotos[compteur.id] || [];
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

      for (const compteur of localCompteurs) {
        if (compteurValues[compteur.id] !== compteur.indexValue) {
          await updateCompteur({
            variables: { input: { id: compteur.id, indexValue: compteurValues[compteur.id] } },
          });
        }
        const photos = compteurPhotos[compteur.id] || [];
        for (const photo of photos) {
          if (photo.uploadStatus === 'pending' || photo.uploadStatus === 'error') {
            await uploadPhoto(compteur.id, photo, 'compteur');
          }
        }
      }

      for (const cle of localCles) {
        if (cleValues[cle.id] !== cle.nombre) {
          await updateCle({
            variables: { input: { id: cle.id, nombre: cleValues[cle.id] } },
          });
        }
      }

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

          const photos = elementPhotos[element.id] || [];
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
  };

  const handleAddPiece = () => {
    setShowAddPiece(true);
    setNewPieceName('');
  };

  const confirmAddPiece = async () => {
    if (!requireOnline()) return;
    if (!newPieceName.trim()) {
      showError('Veuillez entrer un nom');
      return;
    }
    try {
      const result = await createPiece({
        variables: {
          input: {
            etatDesLieux: `/api/etat_des_lieuxes/${edlId}`,
            nom: newPieceName.trim(),
            ordre: localPieces.length + 1,
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
  };

  const handleAddCompteur = (type: CompteurType) => {
    if (!requireOnline()) return;
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
  };

  const handleAddCle = (type: CleType) => {
    if (!requireOnline()) return;
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
  };

  const handleDeletePiece = (pieceId: string, nom: string) => {
    if (!requireOnline()) return;
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
  };

  const handleDeleteCompteur = (compteurId: string, label: string) => {
    if (!requireOnline()) return;
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
  };

  const handleDeleteCle = (cleId: string, label: string) => {
    if (!requireOnline()) return;
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
  };

  const handleAddElement = async (pieceId: string) => {
    if (!requireOnline()) return;
    if (!newElementName.trim()) {
      showError('Veuillez entrer un nom');
      return;
    }
    try {
      const result = await createElement({
        variables: {
          input: { piece: pieceId, nom: newElementName.trim(), type: newElementType, etat: 'bon' },
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
  };

  const handleDeleteElement = (elementId: string, elementName: string, pieceId: string) => {
    if (!requireOnline()) return;
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
  };

  return {
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
    handleAddElement,
    handleDeleteElement,
  };
}
