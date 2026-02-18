import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ElementType, ElementEtat, LocalPhoto } from '../types';
import { PieceNode } from '../types/graphql';
import { usePhotoAnalysis, AnalyseResult } from './usePhotoAnalysis';
import { useRoomAnalysis } from './useRoomAnalysis';
import { useToastStore } from '../stores/toastStore';

interface UseEdlAiAnalysisParams {
  edlId: string;
  elementPhotos: Record<string, LocalPhoto[]>;
  setElementStates: React.Dispatch<React.SetStateAction<Record<string, ElementEtat>>>;
  setElementObservations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setElementDegradations: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setLocalPieces: React.Dispatch<React.SetStateAction<PieceNode[]>>;
  expandedPieces: string[];
  setExpandedPieces: React.Dispatch<React.SetStateAction<string[]>>;
}

interface AnalyzableElement {
  id: string;
  nom: string;
  type: ElementType;
}

export function useEdlAiAnalysis({
  edlId,
  elementPhotos,
  setElementStates,
  setElementObservations,
  setElementDegradations,
  setLocalPieces,
  expandedPieces,
  setExpandedPieces,
}: UseEdlAiAnalysisParams) {
  const { success, error: showError } = useToastStore();
  const { isAnalyzing, analyzePhoto } = usePhotoAnalysis();
  const { isAnalyzing: isRoomAnalyzing, autoFillRoom } = useRoomAnalysis();

  const [analysisResult, setAnalysisResult] = useState<AnalyseResult | null>(null);
  const [analysisElementId, setAnalysisElementId] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const handleAnalyzeElement = async (element: AnalyzableElement) => {
    const photos = elementPhotos[element.id] || [];
    if (photos.length === 0) {
      showError('Ajoutez une photo pour analyser');
      return;
    }

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

  const handleScanRoom = async (piece: PieceNode) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'L\'accès à la caméra est nécessaire pour scanner la pièce.',
        [{ text: 'OK' }]
      );
      return;
    }

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

  const processRoomScan = async (piece: PieceNode, photoUri: string) => {
    const result = await autoFillRoom(edlId, piece.id, photoUri);

    if (result && result.elements_crees) {
      setLocalPieces(prev =>
        prev.map(p => {
          if (p.id === piece.id) {
            const existingElements = p.elements?.edges || [];
            const newElementEdges = result.elements_crees.map(el => {
              const elementIri = `/api/elements/${el.id}`;
              return {
                node: {
                  ...el,
                  id: elementIri,
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

      result.elements_crees.forEach(el => {
        const elId = `/api/elements/${el.id}`;
        setElementStates(prev => ({ ...prev, [elId]: el.etat }));
        setElementObservations(prev => ({ ...prev, [elId]: el.observations || '' }));
        setElementDegradations(prev => ({ ...prev, [elId]: [] }));
      });

      if (!expandedPieces.includes(piece.id)) {
        setExpandedPieces(prev => [...prev, piece.id]);
      }
    }
  };

  const applyAnalysisResults = () => {
    if (!analysisResult || !analysisElementId) return;

    setElementStates(prev => ({
      ...prev,
      [analysisElementId]: analysisResult.etat_global,
    }));

    const newDegradations = analysisResult.degradations_detectees.map(d => d.type);
    if (newDegradations.length > 0) {
      setElementDegradations(prev => {
        const current = Array.isArray(prev[analysisElementId]) ? prev[analysisElementId] : [];
        const merged = [...new Set([...current, ...newDegradations])];
        return { ...prev, [analysisElementId]: merged };
      });
    }

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

  return {
    isAnalyzing,
    isRoomAnalyzing,
    analysisResult,
    analysisElementId,
    showAnalysisModal,
    setShowAnalysisModal,
    handleAnalyzeElement,
    handleScanRoom,
    applyAnalysisResults,
  };
}
