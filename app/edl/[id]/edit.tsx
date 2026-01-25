import { View, Text, ScrollView, TouchableOpacity, Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, Sparkles, Check, AlertTriangle, Camera, Scan } from 'lucide-react-native';
import { Header, Card, Badge, Button, Input, InputWithVoice, Select } from '../../../components/ui';
import { PhotoGallery } from '../../../components/photo';
import { GET_ETAT_DES_LIEUX } from '../../../graphql/queries/edl';
import {
  UPDATE_ETAT_DES_LIEUX,
  CREATE_PIECE,
  CREATE_ELEMENT,
  UPDATE_ELEMENT,
  DELETE_ELEMENT,
  CREATE_COMPTEUR,
  UPDATE_COMPTEUR,
  CREATE_CLE,
  UPDATE_CLE,
  DELETE_PIECE,
  DELETE_COMPTEUR,
  DELETE_CLE,
} from '../../../graphql/mutations/edl';
import {
  COMPTEUR_CONFIG,
  CLE_LABELS,
  ELEMENT_ETAT_LABELS,
  ELEMENT_TYPE_LABELS,
  CompteurType,
  CleType,
  ElementType,
  ElementEtat,
  LocalPhoto,
} from '../../../types';
import { COLORS, BASE_URL, UPLOADS_URL } from '../../../utils/constants';
import { apiDateToDisplay, displayDateToApi } from '../../../utils/format';
import { useToastStore } from '../../../stores/toastStore';
import { usePhotoUpload } from '../../../hooks/usePhotoUpload';
import { usePhotoAnalysis, AnalyseResult } from '../../../hooks/usePhotoAnalysis';
import { useRoomAnalysis, AutoFillResult } from '../../../hooks/useRoomAnalysis';
import * as ImagePicker from 'expo-image-picker';

interface EdlDetailData {
  etatDesLieux?: any;
}

type TabType = 'infos' | 'compteurs' | 'cles' | 'pieces';

interface FormData {
  locataireNom: string;
  locataireEmail: string;
  locataireTelephone: string;
  dateRealisation: string;
  observationsGenerales: string;
}

export default function EditEdlScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const { uploadPhoto } = usePhotoUpload();
  const { isAnalyzing, analyzePhoto } = usePhotoAnalysis();
  const { isAnalyzing: isRoomAnalyzing, autoFillRoom } = useRoomAnalysis();
  const [activeTab, setActiveTab] = useState<TabType>('infos');
  const [saving, setSaving] = useState(false);
  const [expandedPieces, setExpandedPieces] = useState<string[]>([]);

  // État pour l'analyse IA
  const [analysisResult, setAnalysisResult] = useState<AnalyseResult | null>(null);
  const [analysisElementId, setAnalysisElementId] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    locataireNom: '',
    locataireEmail: '',
    locataireTelephone: '',
    dateRealisation: '',
    observationsGenerales: '',
  });

  const [compteurValues, setCompteurValues] = useState<Record<string, string>>({});
  const [cleValues, setCleValues] = useState<Record<string, number>>({});
  const [elementStates, setElementStates] = useState<Record<string, ElementEtat>>({});
  const [elementObservations, setElementObservations] = useState<Record<string, string>>({});
  const [elementDegradations, setElementDegradations] = useState<Record<string, string[]>>({});
  const [elementPhotos, setElementPhotos] = useState<Record<string, LocalPhoto[]>>({});
  const [compteurPhotos, setCompteurPhotos] = useState<Record<string, LocalPhoto[]>>({});
  const [localPieces, setLocalPieces] = useState<any[]>([]);
  const [localCompteurs, setLocalCompteurs] = useState<any[]>([]);
  const [localCles, setLocalCles] = useState<any[]>([]);
  const [showAddElement, setShowAddElement] = useState<string | null>(null); // pieceId when adding
  const [newElementName, setNewElementName] = useState('');
  const [newElementType, setNewElementType] = useState<ElementType>('autre');

  const { data, loading } = useQuery<EdlDetailData>(GET_ETAT_DES_LIEUX, {
    variables: { id: `/api/etat_des_lieuxes/${id}` },
    fetchPolicy: 'network-only',
  });

  const edl = data?.etatDesLieux;

  // Mutations
  const [updateEdl] = useMutation(UPDATE_ETAT_DES_LIEUX);
  const [updateCompteur] = useMutation(UPDATE_COMPTEUR);
  const [updateCle] = useMutation(UPDATE_CLE);
  const [updateElement] = useMutation(UPDATE_ELEMENT);
  const [createPiece] = useMutation(CREATE_PIECE);
  const [createCompteur] = useMutation(CREATE_COMPTEUR);
  const [createCle] = useMutation(CREATE_CLE);
  const [deletePiece] = useMutation(DELETE_PIECE);
  const [deleteCompteur] = useMutation(DELETE_COMPTEUR);
  const [deleteCle] = useMutation(DELETE_CLE);
  const [createElement] = useMutation(CREATE_ELEMENT);
  const [deleteElement] = useMutation(DELETE_ELEMENT);

  // Initialize form data when EDL loads
  useEffect(() => {
    if (edl) {
      const pieces = edl?.pieces?.edges?.map((e: any) => e.node) || [];
      const compteurs = edl?.compteurs?.edges?.map((e: any) => e.node) || [];
      const cles = edl?.cles?.edges?.map((e: any) => e.node) || [];

      setLocalPieces(pieces);
      setLocalCompteurs(compteurs);
      setLocalCles(cles);

      setFormData({
        locataireNom: edl.locataireNom || '',
        locataireEmail: edl.locataireEmail || '',
        locataireTelephone: edl.locataireTelephone || '',
        dateRealisation: apiDateToDisplay(edl.dateRealisation),
        observationsGenerales: edl.observationsGenerales || '',
      });

      // Initialize compteur values
      const cValues: Record<string, string> = {};
      compteurs.forEach((c: any) => {
        cValues[c.id] = c.indexValue || '';
      });
      setCompteurValues(cValues);

      // Initialize cle values
      const clValues: Record<string, number> = {};
      cles.forEach((c: any) => {
        clValues[c.id] = c.nombre || 0;
      });
      setCleValues(clValues);

      // Initialize element states, observations, degradations, and photos
      const eStates: Record<string, ElementEtat> = {};
      const eObservations: Record<string, string> = {};
      const eDegradations: Record<string, string[]> = {};
      const ePhotos: Record<string, LocalPhoto[]> = {};
      pieces.forEach((p: any) => {
        const elements = p.elements?.edges?.map((e: any) => e.node) || [];
        elements.forEach((el: any) => {
          eStates[el.id] = el.etat;
          eObservations[el.id] = el.observations || '';
          eDegradations[el.id] = Array.isArray(el.degradations) ? el.degradations : [];

          // Initialize element photos
          const photos = el.photos?.edges?.map((pe: any) => pe.node) || [];
          if (photos.length > 0) {
            ePhotos[el.id] = photos.map((photo: any, index: number) => {
              const chemin = photo.chemin;
              const fullUrl = chemin?.startsWith('http')
                ? chemin
                : chemin?.startsWith('/')
                  ? `${BASE_URL}${chemin}`
                  : `${UPLOADS_URL}/${chemin}`;
              return {
                id: photo.id,
                localUri: fullUrl,
                remoteId: photo.id,
                remoteUrl: chemin,
                legende: photo.legende,
                ordre: index + 1,
                uploadStatus: 'uploaded' as const,
              };
            });
          }
        });
      });
      setElementStates(eStates);
      setElementObservations(eObservations);
      setElementDegradations(eDegradations);
      setElementPhotos(ePhotos);

      // Initialize compteur photos (JSON array format)
      const cPhotos: Record<string, LocalPhoto[]> = {};
      compteurs.forEach((c: any) => {
        const photos = c.photos || [];
        if (photos.length > 0) {
          cPhotos[c.id] = photos.map((photo: any, index: number) => {
            // Handle both string and object formats
            const chemin = typeof photo === 'string' ? photo : photo.chemin;
            const legende = typeof photo === 'object' ? photo.legende : undefined;
            // chemin starts with /uploads/... so use BASE_URL directly
            const fullUrl = chemin?.startsWith('http')
              ? chemin
              : chemin?.startsWith('/')
                ? `${BASE_URL}${chemin}`
                : `${UPLOADS_URL}/${chemin}`;
            return {
              id: `${c.id}_photo_${index}`,
              localUri: fullUrl,
              remoteId: `${c.id}_photo_${index}`,
              remoteUrl: chemin,
              legende,
              ordre: index + 1,
              uploadStatus: 'uploaded' as const,
            };
          });
        }
      });
      setCompteurPhotos(cPhotos);
    }
  }, [edl]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'infos', label: 'Infos' },
    { key: 'compteurs', label: 'Compteurs' },
    { key: 'cles', label: 'Cles' },
    { key: 'pieces', label: 'Pieces' },
  ];

  const togglePiece = (pieceId: string) => {
    setExpandedPieces(prev =>
      prev.includes(pieceId)
        ? prev.filter(id => id !== pieceId)
        : [...prev, pieceId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update EDL info
      await updateEdl({
        variables: {
          input: {
            id: `/api/etat_des_lieuxes/${id}`,
            locataireNom: formData.locataireNom,
            locataireEmail: formData.locataireEmail || null,
            locataireTelephone: formData.locataireTelephone || null,
            dateRealisation: displayDateToApi(formData.dateRealisation),
            observationsGenerales: formData.observationsGenerales || null,
          },
        },
      });

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

        // Upload photos for this compteur
        const photos = compteurPhotos[compteur.id] || [];
        for (const photo of photos) {
          if (photo.uploadStatus === 'pending' || photo.uploadStatus === 'error') {
            await uploadPhoto(compteur.id, photo, 'compteur');
          }
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

      // Update elements
      for (const piece of localPieces) {
        const elements = piece.elements?.edges?.map((e: any) => e.node) || [];
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

          // Upload photos for this element
          const photos = elementPhotos[element.id] || [];
          for (const photo of photos) {
            if (photo.uploadStatus === 'pending' || photo.uploadStatus === 'error') {
              await uploadPhoto(element.id, photo);
            }
          }
        }
      }

      success('Modifications enregistrees !');
      router.back();
    } catch (err: any) {
      console.error('Save error:', err);
      showError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const [showAddPiece, setShowAddPiece] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');

  const handleAddPiece = () => {
    setShowAddPiece(true);
    setNewPieceName('');
  };

  const confirmAddPiece = async () => {
    if (!newPieceName.trim()) {
      showError('Veuillez entrer un nom');
      return;
    }

    try {
      const result = await createPiece({
        variables: {
          input: {
            etatDesLieux: `/api/etat_des_lieuxes/${id}`,
            nom: newPieceName.trim(),
            ordre: localPieces.length + 1,
          },
        },
      });
      const newPiece = (result.data as any)?.createPiece?.piece;
      if (newPiece) {
        setLocalPieces(prev => [...prev, { ...newPiece, elements: { edges: [] } }]);
        // Expand the new piece automatically
        setExpandedPieces(prev => [...prev, newPiece.id]);
      }
      success('Pièce ajoutée !');
      setShowAddPiece(false);
      setNewPieceName('');
    } catch (err: any) {
      showError(err.message || 'Erreur');
    }
  };

  const handleAddCompteur = (type: CompteurType) => {
    Alert.alert('Ajouter compteur', `Ajouter un compteur ${COMPTEUR_CONFIG[type].label} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Ajouter',
        onPress: async () => {
          try {
            const result = await createCompteur({
              variables: {
                input: {
                  etatDesLieux: `/api/etat_des_lieuxes/${id}`,
                  type,
                },
              },
            });
            const newCompteur = (result.data as any)?.createCompteur?.compteur;
            if (newCompteur) {
              setLocalCompteurs(prev => [...prev, newCompteur]);
              setCompteurValues(prev => ({ ...prev, [newCompteur.id]: '' }));
            }
            success('Compteur ajoute !');
          } catch (err: any) {
            showError(err.message || 'Erreur');
          }
        },
      },
    ]);
  };

  const handleAddCle = (type: CleType) => {
    Alert.alert('Ajouter cle', `Ajouter une cle ${CLE_LABELS[type]} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Ajouter',
        onPress: async () => {
          try {
            const result = await createCle({
              variables: {
                input: {
                  etatDesLieux: `/api/etat_des_lieuxes/${id}`,
                  type,
                  nombre: 1,
                },
              },
            });
            const newCle = (result.data as any)?.createCle?.cle;
            if (newCle) {
              setLocalCles(prev => [...prev, newCle]);
              setCleValues(prev => ({ ...prev, [newCle.id]: 1 }));
            }
            success('Cle ajoutee !');
          } catch (err: any) {
            showError(err.message || 'Erreur');
          }
        },
      },
    ]);
  };

  const handleDeletePiece = (pieceId: string, nom: string) => {
    Alert.alert('Supprimer', `Supprimer la piece "${nom}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Deleting piece with id:', pieceId);
            const result = await deletePiece({ variables: { input: { id: pieceId } } });
            console.log('Delete piece result:', result);
            // Mise à jour locale immédiate
            setLocalPieces(prev => prev.filter(p => p.id !== pieceId));
            success('Piece supprimee !');
          } catch (err: any) {
            console.error('Delete piece error:', err);
            showError(err.message || 'Erreur');
          }
        },
      },
    ]);
  };

  const handleDeleteCompteur = (compteurId: string, label: string) => {
    Alert.alert('Supprimer', `Supprimer le compteur "${label}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Deleting compteur with id:', compteurId);
            const result = await deleteCompteur({ variables: { input: { id: compteurId } } });
            console.log('Delete compteur result:', result);
            // Mise à jour locale immédiate
            setLocalCompteurs(prev => prev.filter(c => c.id !== compteurId));
            success('Compteur supprime !');
          } catch (err: any) {
            console.error('Delete compteur error:', err);
            showError(err.message || 'Erreur');
          }
        },
      },
    ]);
  };

  const handleDeleteCle = (cleId: string, label: string) => {
    Alert.alert('Supprimer', `Supprimer la cle "${label}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Deleting cle with id:', cleId);
            const result = await deleteCle({ variables: { input: { id: cleId } } });
            console.log('Delete cle result:', result);
            // Mise à jour locale immédiate
            setLocalCles(prev => prev.filter(c => c.id !== cleId));
            success('Cle supprimee !');
          } catch (err: any) {
            console.error('Delete cle error:', err);
            showError(err.message || 'Erreur');
          }
        },
      },
    ]);
  };

  const etatOptions = Object.entries(ELEMENT_ETAT_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const typeOptions = Object.entries(ELEMENT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  // Liste de dégradations courantes par type d'élément
  const DEGRADATIONS_SUGGESTIONS: Record<string, string[]> = {
    sol: ['Rayures', 'Taches', 'Usure', 'Fissures', 'Décollement', 'Traces de brûlure'],
    mur: ['Trous', 'Fissures', 'Traces', 'Décollement papier', 'Moisissures', 'Éclats de peinture'],
    plafond: ['Fissures', 'Traces d\'humidité', 'Taches', 'Décollement'],
    menuiserie: ['Rayures', 'Éclats', 'Difficulté fermeture', 'Vitre cassée', 'Joint défectueux'],
    electricite: ['Ne fonctionne pas', 'Prise cassée', 'Interrupteur HS'],
    plomberie: ['Fuite', 'Calcaire', 'Robinet grippé', 'Évacuation bouchée'],
    chauffage: ['Ne fonctionne pas', 'Bruit anormal', 'Fuite'],
    equipement: ['Cassé', 'Rayures', 'Manquant', 'Incomplet'],
    mobilier: ['Rayures', 'Taches', 'Cassé', 'Incomplet'],
    electromenager: ['Ne fonctionne pas', 'Bruit anormal', 'Manquant'],
    autre: ['Usure', 'Cassé', 'Manquant', 'Détérioré'],
  };

  const handleAddElement = async (pieceId: string) => {
    if (!newElementName.trim()) {
      showError('Veuillez entrer un nom');
      return;
    }

    try {
      const result = await createElement({
        variables: {
          input: {
            piece: pieceId,
            nom: newElementName.trim(),
            type: newElementType,
            etat: 'bon',
          },
        },
      });

      const newElement = (result.data as any)?.createElement?.element;
      if (newElement) {
        // Update localPieces to include the new element
        setLocalPieces(prev =>
          prev.map(p => {
            if (p.id === pieceId) {
              const currentElements = p.elements?.edges || [];
              return {
                ...p,
                elements: {
                  edges: [...currentElements, { node: newElement }],
                },
              };
            }
            return p;
          })
        );

        // Initialize state for new element
        setElementStates(prev => ({ ...prev, [newElement.id]: 'bon' as ElementEtat }));
        setElementObservations(prev => ({ ...prev, [newElement.id]: '' }));
        setElementDegradations(prev => ({ ...prev, [newElement.id]: [] }));
      }

      setShowAddElement(null);
      setNewElementName('');
      setNewElementType('autre');
      success('Élément ajouté !');
    } catch (err: any) {
      showError(err.message || 'Erreur');
    }
  };

  const handleDeleteElement = (elementId: string, elementName: string, pieceId: string) => {
    Alert.alert('Supprimer', `Supprimer l'élément "${elementName}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteElement({ variables: { input: { id: elementId } } });

            // Update localPieces to remove the element
            setLocalPieces(prev =>
              prev.map(p => {
                if (p.id === pieceId) {
                  return {
                    ...p,
                    elements: {
                      edges: (p.elements?.edges || []).filter((e: any) => e.node.id !== elementId),
                    },
                  };
                }
                return p;
              })
            );

            success('Élément supprimé !');
          } catch (err: any) {
            showError(err.message || 'Erreur');
          }
        },
      },
    ]);
  };

  const toggleDegradation = (elementId: string, degradation: string) => {
    setElementDegradations(prev => {
      const current = Array.isArray(prev[elementId]) ? prev[elementId] : [];
      if (current.includes(degradation)) {
        return { ...prev, [elementId]: current.filter(d => d !== degradation) };
      } else {
        return { ...prev, [elementId]: [...current, degradation] };
      }
    });
  };

  const [customDegradationElement, setCustomDegradationElement] = useState<string | null>(null);
  const [customDegradationText, setCustomDegradationText] = useState('');

  const addCustomDegradation = (elementId: string) => {
    setCustomDegradationElement(elementId);
    setCustomDegradationText('');
  };

  const confirmCustomDegradation = () => {
    if (customDegradationElement && customDegradationText.trim()) {
      setElementDegradations(prev => {
        const current = Array.isArray(prev[customDegradationElement]) ? prev[customDegradationElement] : [];
        return { ...prev, [customDegradationElement]: [...current, customDegradationText.trim()] };
      });
    }
    setCustomDegradationElement(null);
    setCustomDegradationText('');
  };

  // Analyse IA d'une photo
  const handleAnalyzeElement = async (element: any) => {
    const photos = elementPhotos[element.id] || [];
    if (photos.length === 0) {
      showError('Ajoutez une photo pour analyser');
      return;
    }

    // Utiliser la première photo (ou la plus récente)
    const photoToAnalyze = photos[photos.length - 1];
    const result = await analyzePhoto(
      photoToAnalyze.localUri,
      element.type as ElementType,
      element.nom
    );

    if (result) {
      setAnalysisResult(result);
      setAnalysisElementId(element.id);
      setShowAnalysisModal(true);
    }
  };

  // Scanner une pièce avec IA (pré-remplissage automatique)
  const handleScanRoom = async (piece: any) => {
    // Demander la permission caméra si nécessaire
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'L\'accès à la caméra est nécessaire pour scanner la pièce.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Proposer le choix caméra ou galerie
    Alert.alert(
      'Scanner la pièce',
      'Prenez une photo de la pièce entière pour que l\'IA détecte automatiquement les éléments.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Galerie',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await processRoomScan(piece, result.assets[0].uri);
            }
          },
        },
        {
          text: 'Caméra',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await processRoomScan(piece, result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const processRoomScan = async (piece: any, photoUri: string) => {
    const result = await autoFillRoom(id!, piece.id, photoUri);

    if (result && result.elements_crees) {
      // Mettre à jour localPieces avec les nouveaux éléments
      setLocalPieces(prev =>
        prev.map(p => {
          if (p.id === piece.id) {
            const existingElements = p.elements?.edges || [];
            const newElementEdges = result.elements_crees.map(el => {
              // L'API retourne un id numérique, on le convertit en IRI
              const elementIri = `/api/elements/${el.id}`;
              return {
                node: {
                  ...el,
                  id: elementIri, // L'IRI doit venir APRÈS le spread pour ne pas être écrasé
                  photos: { edges: [] },
                },
              };
            });
            return {
              ...p,
              elements: {
                edges: [...existingElements, ...newElementEdges],
              },
            };
          }
          return p;
        })
      );

      // Initialiser les états pour les nouveaux éléments
      result.elements_crees.forEach(el => {
        const elId = `/api/elements/${el.id}`;
        setElementStates(prev => ({ ...prev, [elId]: el.etat }));
        setElementObservations(prev => ({ ...prev, [elId]: el.observations || '' }));
        setElementDegradations(prev => ({ ...prev, [elId]: [] }));
      });

      // Ouvrir la pièce si elle n'est pas déjà ouverte
      if (!expandedPieces.includes(piece.id)) {
        setExpandedPieces(prev => [...prev, piece.id]);
      }
    }
  };

  // Appliquer les résultats de l'analyse IA
  const applyAnalysisResults = () => {
    if (!analysisResult || !analysisElementId) return;

    // Appliquer l'état
    setElementStates(prev => ({
      ...prev,
      [analysisElementId]: analysisResult.etat_global,
    }));

    // Appliquer les dégradations
    const newDegradations = analysisResult.degradations_detectees.map(d => d.type);
    if (newDegradations.length > 0) {
      setElementDegradations(prev => {
        const current = Array.isArray(prev[analysisElementId]) ? prev[analysisElementId] : [];
        const merged = [...new Set([...current, ...newDegradations])];
        return { ...prev, [analysisElementId]: merged };
      });
    }

    // Appliquer les observations
    if (analysisResult.observations) {
      setElementObservations(prev => ({
        ...prev,
        [analysisElementId]: analysisResult.observations || '',
      }));
    }

    success('Analyse appliquée !');
    setShowAnalysisModal(false);
    setAnalysisResult(null);
    setAnalysisElementId(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        return (
          <View className="p-4">
            <Input
              label="Nom du locataire *"
              value={formData.locataireNom}
              onChangeText={(text) => setFormData(prev => ({ ...prev, locataireNom: text }))}
            />
            <Input
              label="Email"
              value={formData.locataireEmail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, locataireEmail: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Telephone"
              value={formData.locataireTelephone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, locataireTelephone: text }))}
              keyboardType="phone-pad"
            />
            <Input
              label="Date de realisation"
              value={formData.dateRealisation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, dateRealisation: text }))}
            />
            <InputWithVoice
              label="Observations generales"
              value={formData.observationsGenerales}
              onChangeText={(text) => setFormData(prev => ({ ...prev, observationsGenerales: text }))}
              placeholder="Dictez ou saisissez vos observations..."
              numberOfLines={4}
            />
          </View>
        );

      case 'compteurs':
        return (
          <View className="p-4">
            <View className="flex-row flex-wrap gap-3">
              {localCompteurs.map((compteur: any) => {
                const config = COMPTEUR_CONFIG[compteur.type as keyof typeof COMPTEUR_CONFIG];
                return (
                  <View key={compteur.id} className="w-[48%]">
                    <Card>
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <Text className="text-xl">{config?.icon || '📊'}</Text>
                          <Text className="text-sm font-medium text-gray-700 ml-2">
                            {config?.label || compteur.type}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteCompteur(compteur.id, config?.label || compteur.type)}
                          className="p-1"
                        >
                          <Trash2 size={16} color={COLORS.red[500]} />
                        </TouchableOpacity>
                      </View>
                      <Input
                        label="Index"
                        value={compteurValues[compteur.id] || ''}
                        onChangeText={(text) =>
                          setCompteurValues(prev => ({ ...prev, [compteur.id]: text }))
                        }
                        keyboardType="numeric"
                      />
                      <View className="mt-2">
                        <PhotoGallery
                          photos={compteurPhotos[compteur.id] || []}
                          onPhotosChange={(photos) =>
                            setCompteurPhotos(prev => ({ ...prev, [compteur.id]: photos }))
                          }
                          elementId={compteur.id}
                          maxPhotos={2}
                          thumbnailSize="small"
                          uploadType="compteur"
                        />
                      </View>
                    </Card>
                  </View>
                );
              })}
            </View>

            {localCompteurs.length === 0 && (
              <Card className="mb-4">
                <Text className="text-gray-500 text-center py-4">
                  Aucun compteur configure
                </Text>
              </Card>
            )}

            <Text className="text-sm font-medium text-gray-700 mb-2 mt-4">Ajouter un compteur</Text>
            <View className="flex-row flex-wrap gap-2">
              {(Object.keys(COMPTEUR_CONFIG) as CompteurType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleAddCompteur(type)}
                  className="bg-gray-100 rounded-lg px-3 py-2 flex-row items-center"
                >
                  <Text className="mr-1">{COMPTEUR_CONFIG[type].icon}</Text>
                  <Text className="text-gray-700 text-sm">{COMPTEUR_CONFIG[type].label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'cles':
        return (
          <View className="p-4">
            {localCles.map((cle: any) => {
              const cleLabel = CLE_LABELS[cle.type as keyof typeof CLE_LABELS] || cle.type;
              return (
                <Card key={cle.id} className="mb-3">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">🔑</Text>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{cleLabel}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() =>
                          setCleValues(prev => ({
                            ...prev,
                            [cle.id]: Math.max(0, (prev[cle.id] || 0) - 1),
                          }))
                        }
                        className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center"
                      >
                        <Text className="text-lg font-bold text-gray-600">-</Text>
                      </TouchableOpacity>
                      <Text className="mx-4 text-lg font-bold text-gray-900">
                        {cleValues[cle.id] || 0}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setCleValues(prev => ({
                            ...prev,
                            [cle.id]: (prev[cle.id] || 0) + 1,
                          }))
                        }
                        className="w-10 h-10 bg-primary-100 rounded-lg items-center justify-center"
                      >
                        <Text className="text-lg font-bold text-primary-600">+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteCle(cle.id, cleLabel)}
                        className="ml-3 p-2"
                      >
                        <Trash2 size={18} color={COLORS.red[500]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })}

            {localCles.length === 0 && (
              <Card className="mb-4">
                <Text className="text-gray-500 text-center py-4">
                  Aucune cle configuree
                </Text>
              </Card>
            )}

            <Text className="text-sm font-medium text-gray-700 mb-2 mt-4">Ajouter une cle</Text>
            <View className="flex-row flex-wrap gap-2">
              {(Object.keys(CLE_LABELS) as CleType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleAddCle(type)}
                  className="bg-gray-100 rounded-lg px-3 py-2 flex-row items-center"
                >
                  <Text className="mr-1">🔑</Text>
                  <Text className="text-gray-700 text-sm">{CLE_LABELS[type]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'pieces':
        return (
          <View className="p-4">
            {/* Indicateur scan en cours */}
            {isRoomAnalyzing && (
              <View className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex-row items-center">
                <ActivityIndicator size="small" color="#9333EA" />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-purple-800">Analyse IA en cours...</Text>
                  <Text className="text-purple-600 text-sm">Détection des éléments de la pièce</Text>
                </View>
              </View>
            )}

            {localPieces.map((piece: any) => {
              const elements = piece.elements?.edges?.map((e: any) => e.node) || [];
              const isExpanded = expandedPieces.includes(piece.id);

              return (
                <Card key={piece.id} className="mb-3">
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                      onPress={() => togglePiece(piece.id)}
                      className="flex-row items-center flex-1"
                    >
                      <Text className="font-semibold text-gray-900 mr-2">{piece.nom}</Text>
                      <Badge label={`${elements.length}`} variant="gray" />
                    </TouchableOpacity>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => handleScanRoom(piece)}
                        disabled={isRoomAnalyzing}
                        className={`p-2 mr-1 rounded-lg ${isRoomAnalyzing ? 'bg-gray-100' : 'bg-purple-50'}`}
                      >
                        <Scan size={18} color={isRoomAnalyzing ? COLORS.gray[400] : '#9333EA'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeletePiece(piece.id, piece.nom)}
                        className="p-2 mr-1"
                      >
                        <Trash2 size={18} color={COLORS.red[500]} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => togglePiece(piece.id)} className="p-2">
                        {isExpanded ? (
                          <ChevronUp size={20} color={COLORS.gray[400]} />
                        ) : (
                          <ChevronDown size={20} color={COLORS.gray[400]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isExpanded && (
                    <View className="mt-3">
                      {elements.map((element: any) => {
                        const suggestions = DEGRADATIONS_SUGGESTIONS[element.type] || DEGRADATIONS_SUGGESTIONS.autre;
                        const currentDegradations = Array.isArray(elementDegradations[element.id])
                          ? elementDegradations[element.id]
                          : [];

                        return (
                          <View key={element.id} className="py-3 border-t border-gray-100">
                            <View className="flex-row items-center justify-between mb-2">
                              <View className="flex-1">
                                <Text className="font-medium text-gray-900">{element.nom}</Text>
                                <Text className="text-xs text-gray-400">
                                  {ELEMENT_TYPE_LABELS[element.type as ElementType] || element.type}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => handleDeleteElement(element.id, element.nom, piece.id)}
                                className="p-2"
                              >
                                <Trash2 size={16} color={COLORS.red[500]} />
                              </TouchableOpacity>
                            </View>

                            <Select
                              label="État"
                              value={elementStates[element.id] || element.etat}
                              options={etatOptions}
                              onChange={(value) =>
                                setElementStates(prev => ({
                                  ...prev,
                                  [element.id]: value as ElementEtat,
                                }))
                              }
                            />

                            {/* Dégradations */}
                            <View className="mt-3">
                              <Text className="text-sm font-medium text-gray-700 mb-2">Dégradations</Text>
                              <View className="flex-row flex-wrap gap-2">
                                {suggestions.map((deg) => (
                                  <TouchableOpacity
                                    key={deg}
                                    onPress={() => toggleDegradation(element.id, deg)}
                                    className={`px-3 py-1.5 rounded-full border ${
                                      currentDegradations.includes(deg)
                                        ? 'bg-red-100 border-red-300'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <Text
                                      className={`text-xs ${
                                        currentDegradations.includes(deg)
                                          ? 'text-red-700 font-medium'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      {deg}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                  onPress={() => addCustomDegradation(element.id)}
                                  className="px-3 py-1.5 rounded-full border border-dashed border-gray-300 bg-white"
                                >
                                  <Text className="text-xs text-gray-500">+ Autre</Text>
                                </TouchableOpacity>
                              </View>
                              {/* Custom degradations not in suggestions */}
                              {currentDegradations.filter(d => !suggestions.includes(d)).length > 0 && (
                                <View className="flex-row flex-wrap gap-2 mt-2">
                                  {currentDegradations
                                    .filter(d => !suggestions.includes(d))
                                    .map((deg) => (
                                      <TouchableOpacity
                                        key={deg}
                                        onPress={() => toggleDegradation(element.id, deg)}
                                        className="px-3 py-1.5 rounded-full bg-red-100 border border-red-300"
                                      >
                                        <Text className="text-xs text-red-700 font-medium">{deg}</Text>
                                      </TouchableOpacity>
                                    ))}
                                </View>
                              )}
                            </View>

                            {/* Observations */}
                            <View className="mt-3">
                              <InputWithVoice
                                label="Observations"
                                value={elementObservations[element.id] || ''}
                                onChangeText={(text) =>
                                  setElementObservations(prev => ({ ...prev, [element.id]: text }))
                                }
                                placeholder="Dictez ou saisissez..."
                                numberOfLines={2}
                              />
                            </View>

                            {/* Photos */}
                            <View className="mt-2">
                              <PhotoGallery
                                photos={elementPhotos[element.id] || []}
                                onPhotosChange={(photos) =>
                                  setElementPhotos(prev => ({ ...prev, [element.id]: photos }))
                                }
                                elementId={element.id}
                                maxPhotos={5}
                                thumbnailSize="medium"
                              />
                            </View>

                            {/* Bouton Analyse IA */}
                            {(elementPhotos[element.id]?.length || 0) > 0 && (
                              <TouchableOpacity
                                onPress={() => handleAnalyzeElement(element)}
                                disabled={isAnalyzing}
                                className={`mt-3 flex-row items-center justify-center py-2.5 rounded-lg ${
                                  isAnalyzing ? 'bg-gray-100' : 'bg-purple-50 border border-purple-200'
                                }`}
                              >
                                <Sparkles size={16} color={isAnalyzing ? COLORS.gray[400] : '#9333EA'} />
                                <Text className={`ml-2 font-medium ${
                                  isAnalyzing ? 'text-gray-400' : 'text-purple-700'
                                }`}>
                                  {isAnalyzing ? 'Analyse en cours...' : 'Analyser avec IA'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}

                      {/* Formulaire ajout élément */}
                      {showAddElement === piece.id ? (
                        <View className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <Text className="font-medium text-gray-900 mb-3">Nouvel élément</Text>
                          <Input
                            label="Nom *"
                            value={newElementName}
                            onChangeText={setNewElementName}
                            placeholder="Ex: Parquet, Fenêtre..."
                          />
                          <Select
                            label="Type"
                            value={newElementType}
                            options={typeOptions}
                            onChange={(value) => setNewElementType(value as ElementType)}
                          />
                          <View className="flex-row gap-2 mt-3">
                            <TouchableOpacity
                              onPress={() => {
                                setShowAddElement(null);
                                setNewElementName('');
                                setNewElementType('autre');
                              }}
                              className="flex-1 py-2.5 rounded-lg border border-gray-300 items-center"
                            >
                              <Text className="text-gray-600 font-medium">Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleAddElement(piece.id)}
                              className="flex-1 py-2.5 rounded-lg bg-primary-600 items-center"
                            >
                              <Text className="text-white font-medium">Ajouter</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => setShowAddElement(piece.id)}
                          className="border border-dashed border-gray-300 rounded-lg p-3 items-center mt-3 flex-row justify-center"
                        >
                          <Plus size={16} color={COLORS.gray[400]} />
                          <Text className="text-gray-500 text-sm ml-1">Ajouter un élément</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </Card>
              );
            })}

            {/* Formulaire ajout pièce */}
            {showAddPiece ? (
              <View className="p-4 bg-white rounded-xl border border-gray-200">
                <Text className="font-medium text-gray-900 mb-3">Nouvelle pièce</Text>
                <Input
                  label="Nom de la pièce *"
                  value={newPieceName}
                  onChangeText={setNewPieceName}
                  placeholder="Ex: Salon, Chambre 1..."
                />
                <View className="flex-row gap-2 mt-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddPiece(false);
                      setNewPieceName('');
                    }}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 items-center"
                  >
                    <Text className="text-gray-600 font-medium">Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmAddPiece}
                    className="flex-1 py-2.5 rounded-lg bg-primary-600 items-center"
                  >
                    <Text className="text-white font-medium">Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleAddPiece}
                className="border border-dashed border-gray-300 rounded-xl p-4 items-center flex-row justify-center"
              >
                <Plus size={20} color={COLORS.gray[400]} />
                <Text className="text-gray-500 ml-2">Ajouter une pièce</Text>
              </TouchableOpacity>
            )}
          </View>
        );
    }
  };

  if (loading && !edl) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <Header title="Modifier EDL" showBack />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header title="Modifier EDL" showBack />

      {/* Tabs */}
      <View className="bg-white flex-row border-b border-gray-100">
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === tab.key ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-base ${
                activeTab === tab.key ? 'text-primary-600 font-semibold' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
          >
            {renderTabContent()}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View className="p-4 bg-white border-t border-gray-100">
        <Button
          label="Enregistrer les modifications"
          onPress={handleSave}
          loading={saving}
          fullWidth
        />
      </View>

      {/* Modal pour dégradation personnalisée */}
      <Modal
        visible={customDegradationElement !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomDegradationElement(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCustomDegradationElement(null)}
          className="flex-1 bg-black/50 justify-center items-center p-4"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-white rounded-xl p-4 w-full max-w-sm"
          >
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Nouvelle dégradation
            </Text>
            <TextInput
              value={customDegradationText}
              onChangeText={setCustomDegradationText}
              placeholder="Décrivez la dégradation..."
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-base mb-4"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setCustomDegradationElement(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 items-center"
              >
                <Text className="text-gray-600 font-medium">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmCustomDegradation}
                className="flex-1 py-2.5 rounded-lg bg-primary-600 items-center"
              >
                <Text className="text-white font-medium">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal résultats analyse IA */}
      <Modal
        visible={showAnalysisModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-4 max-h-[80%]">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Sparkles size={24} color="#9333EA" />
                <Text className="text-lg font-bold text-gray-900 ml-2">
                  Analyse IA
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAnalysisModal(false)}
                className="p-2"
              >
                <Text className="text-gray-500">Fermer</Text>
              </TouchableOpacity>
            </View>

            {analysisResult && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Confiance */}
                <View className="flex-row items-center mb-4">
                  <Text className="text-gray-500 text-sm">Confiance :</Text>
                  <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2">
                    <View
                      className="h-2 bg-purple-500 rounded-full"
                      style={{ width: `${(analysisResult.confiance || 0) * 100}%` }}
                    />
                  </View>
                  <Text className="text-gray-700 text-sm ml-2">
                    {Math.round((analysisResult.confiance || 0) * 100)}%
                  </Text>
                </View>

                {/* État détecté */}
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <Text className="text-sm text-gray-500 mb-1">État détecté</Text>
                  <View className="flex-row items-center">
                    <Badge
                      label={ELEMENT_ETAT_LABELS[analysisResult.etat_global] || analysisResult.etat_global}
                      variant={
                        analysisResult.etat_global === 'bon' || analysisResult.etat_global === 'neuf' || analysisResult.etat_global === 'tres_bon'
                          ? 'green'
                          : analysisResult.etat_global === 'mauvais' || analysisResult.etat_global === 'hors_service'
                            ? 'red'
                            : 'amber'
                      }
                    />
                  </View>
                </View>

                {/* Dégradations détectées */}
                {analysisResult.degradations_detectees?.length > 0 && (
                  <View className="bg-red-50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-2">
                      <AlertTriangle size={16} color={COLORS.red[600]} />
                      <Text className="text-sm font-medium text-red-800 ml-1">
                        Dégradations détectées ({analysisResult.degradations_detectees.length})
                      </Text>
                    </View>
                    {analysisResult.degradations_detectees.map((deg, index) => (
                      <View key={index} className="bg-white rounded-lg p-3 mb-2">
                        <Text className="font-medium text-gray-900">{deg.type}</Text>
                        {deg.localisation && (
                          <Text className="text-sm text-gray-500 mt-0.5">
                            📍 {deg.localisation}
                          </Text>
                        )}
                        {deg.description && (
                          <Text className="text-sm text-gray-600 mt-1">
                            {deg.description}
                          </Text>
                        )}
                        <Badge
                          label={deg.severite}
                          variant={deg.severite === 'legere' ? 'amber' : deg.severite === 'moyenne' ? 'orange' : 'red'}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {/* Estimation réparation */}
                {analysisResult.estimation_reparation?.necessaire && (
                  <View className="bg-amber-50 rounded-xl p-4 mb-4">
                    <Text className="text-sm font-medium text-amber-800 mb-2">
                      💰 Estimation réparation
                    </Text>
                    <Text className="text-2xl font-bold text-amber-900">
                      {analysisResult.estimation_reparation.cout_estime_min}€ - {analysisResult.estimation_reparation.cout_estime_max}€
                    </Text>
                    {analysisResult.estimation_reparation.type_intervention && (
                      <Text className="text-sm text-amber-700 mt-1">
                        Type : {analysisResult.estimation_reparation.type_intervention}
                      </Text>
                    )}
                  </View>
                )}

                {/* Observations */}
                {analysisResult.observations && (
                  <View className="bg-blue-50 rounded-xl p-4 mb-4">
                    <Text className="text-sm font-medium text-blue-800 mb-1">
                      📝 Observations IA
                    </Text>
                    <Text className="text-gray-700">
                      {analysisResult.observations}
                    </Text>
                  </View>
                )}

                {/* Boutons */}
                <View className="flex-row gap-3 mt-2 mb-4">
                  <TouchableOpacity
                    onPress={() => setShowAnalysisModal(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-300 items-center"
                  >
                    <Text className="text-gray-600 font-medium">Ignorer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={applyAnalysisResults}
                    className="flex-1 py-3 rounded-xl bg-purple-600 items-center flex-row justify-center"
                  >
                    <Check size={18} color="white" />
                    <Text className="text-white font-medium ml-2">Appliquer</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
