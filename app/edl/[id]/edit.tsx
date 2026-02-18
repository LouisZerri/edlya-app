import { View, Text, ScrollView, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { useState, useCallback } from 'react';
import { Header, Button } from '../../../components/ui';
import { GET_ETAT_DES_LIEUX } from '../../../graphql/queries/edl';
import { GetEdlDetailData } from '../../../types/graphql';
import {
  EdlTabBar,
  TabType,
  EdlInfosTab,
  EdlCompteursTab,
  EdlClesTab,
  EdlPiecesTab,
  CustomDegradationModal,
  AnalysisResultModal,
  AutoSaveIndicator,
} from '../../../components/edl';
import { useEdlInitializer } from '../../../hooks/useEdlInitializer';
import { useEdlAutoSave } from '../../../hooks/useEdlAutoSave';
import { useEdlMutations } from '../../../hooks/useEdlMutations';
import { useEdlAiAnalysis } from '../../../hooks/useEdlAiAnalysis';

export default function EditEdlScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('infos');
  const [expandedPieces, setExpandedPieces] = useState<string[]>([]);

  const { data, loading } = useQuery<GetEdlDetailData>(GET_ETAT_DES_LIEUX, {
    variables: { id: `/api/etat_des_lieuxes/${id}` },
    fetchPolicy: 'network-only',
  });
  const edl = data?.etatDesLieux;

  // State initialization from GraphQL data
  const state = useEdlInitializer(edl);

  // Auto-save (debounce 3s)
  const { autoSaveStatus } = useEdlAutoSave({
    edlId: id!,
    edl,
    formData: state.formData,
    localPieces: state.localPieces,
    localCompteurs: state.localCompteurs,
    localCles: state.localCles,
    compteurValues: state.compteurValues,
    cleValues: state.cleValues,
    elementStates: state.elementStates,
    elementObservations: state.elementObservations,
    elementDegradations: state.elementDegradations,
  });

  // CRUD mutations
  const mutations = useEdlMutations({
    edlId: id!,
    edl,
    formData: state.formData,
    localPieces: state.localPieces,
    setLocalPieces: state.setLocalPieces,
    localCompteurs: state.localCompteurs,
    setLocalCompteurs: state.setLocalCompteurs,
    localCles: state.localCles,
    setLocalCles: state.setLocalCles,
    compteurValues: state.compteurValues,
    setCompteurValues: state.setCompteurValues,
    cleValues: state.cleValues,
    setCleValues: state.setCleValues,
    elementStates: state.elementStates,
    setElementStates: state.setElementStates,
    elementObservations: state.elementObservations,
    setElementObservations: state.setElementObservations,
    elementDegradations: state.elementDegradations,
    setElementDegradations: state.setElementDegradations,
    elementPhotos: state.elementPhotos,
    compteurPhotos: state.compteurPhotos,
    setExpandedPieces,
  });

  // AI analysis
  const ai = useEdlAiAnalysis({
    edlId: id!,
    elementPhotos: state.elementPhotos,
    setElementStates: state.setElementStates,
    setElementObservations: state.setElementObservations,
    setElementDegradations: state.setElementDegradations,
    setLocalPieces: state.setLocalPieces,
    expandedPieces,
    setExpandedPieces,
  });

  // Degradation toggle + custom degradation
  const [customDegradationElement, setCustomDegradationElement] = useState<string | null>(null);
  const [customDegradationText, setCustomDegradationText] = useState('');

  const toggleDegradation = useCallback((elementId: string, degradation: string) => {
    state.setElementDegradations(prev => {
      const current = Array.isArray(prev[elementId]) ? prev[elementId] : [];
      if (current.includes(degradation)) {
        return { ...prev, [elementId]: current.filter(d => d !== degradation) };
      }
      return { ...prev, [elementId]: [...current, degradation] };
    });
  }, [state.setElementDegradations]);

  const addCustomDegradation = useCallback((elementId: string) => {
    setCustomDegradationElement(elementId);
    setCustomDegradationText('');
  }, []);

  const confirmCustomDegradation = useCallback(() => {
    if (customDegradationElement && customDegradationText.trim()) {
      state.setElementDegradations(prev => {
        const current = Array.isArray(prev[customDegradationElement]) ? prev[customDegradationElement] : [];
        return { ...prev, [customDegradationElement]: [...current, customDegradationText.trim()] };
      });
    }
    setCustomDegradationElement(null);
    setCustomDegradationText('');
  }, [customDegradationElement, customDegradationText, state.setElementDegradations]);

  const togglePiece = useCallback((pieceId: string) => {
    setExpandedPieces(prev =>
      prev.includes(pieceId) ? prev.filter(p => p !== pieceId) : [...prev, pieceId]
    );
  }, []);

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        return <EdlInfosTab formData={state.formData} setFormData={state.setFormData} />;
      case 'compteurs':
        return (
          <EdlCompteursTab
            localCompteurs={state.localCompteurs}
            compteurValues={state.compteurValues}
            setCompteurValues={state.setCompteurValues}
            compteurPhotos={state.compteurPhotos}
            setCompteurPhotos={state.setCompteurPhotos}
            onDeleteCompteur={mutations.handleDeleteCompteur}
            onAddCompteur={mutations.handleAddCompteur}
          />
        );
      case 'cles':
        return (
          <EdlClesTab
            localCles={state.localCles}
            cleValues={state.cleValues}
            setCleValues={state.setCleValues}
            onDeleteCle={mutations.handleDeleteCle}
            onAddCle={mutations.handleAddCle}
          />
        );
      case 'pieces':
        return (
          <EdlPiecesTab
            localPieces={state.localPieces}
            expandedPieces={expandedPieces}
            togglePiece={togglePiece}
            elementStates={state.elementStates}
            setElementStates={state.setElementStates}
            elementObservations={state.elementObservations}
            setElementObservations={state.setElementObservations}
            elementDegradations={state.elementDegradations}
            toggleDegradation={toggleDegradation}
            addCustomDegradation={addCustomDegradation}
            elementPhotos={state.elementPhotos}
            setElementPhotos={state.setElementPhotos}
            isAnalyzing={ai.isAnalyzing}
            isRoomAnalyzing={ai.isRoomAnalyzing}
            onAnalyzeElement={ai.handleAnalyzeElement}
            onScanRoom={ai.handleScanRoom}
            onDeletePiece={mutations.handleDeletePiece}
            onDeleteElement={mutations.handleDeleteElement}
            showAddElement={mutations.showAddElement}
            setShowAddElement={mutations.setShowAddElement}
            newElementName={mutations.newElementName}
            setNewElementName={mutations.setNewElementName}
            newElementType={mutations.newElementType}
            setNewElementType={mutations.setNewElementType}
            onAddElement={mutations.handleAddElement}
            showAddPiece={mutations.showAddPiece}
            setShowAddPiece={mutations.setShowAddPiece}
            newPieceName={mutations.newPieceName}
            setNewPieceName={mutations.setNewPieceName}
            onAddPiece={mutations.handleAddPiece}
            onConfirmAddPiece={mutations.confirmAddPiece}
          />
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

      <EdlTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            {renderTabContent()}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View className="p-4 bg-white border-t border-gray-100">
        <AutoSaveIndicator status={autoSaveStatus} />
        <Button
          label="Enregistrer et quitter"
          onPress={mutations.handleSave}
          loading={mutations.saving}
          fullWidth
        />
      </View>

      <CustomDegradationModal
        visible={customDegradationElement !== null}
        text={customDegradationText}
        onChangeText={setCustomDegradationText}
        onConfirm={confirmCustomDegradation}
        onClose={() => setCustomDegradationElement(null)}
      />

      <AnalysisResultModal
        visible={ai.showAnalysisModal}
        analysisResult={ai.analysisResult}
        onApply={ai.applyAnalysisResults}
        onClose={() => ai.setShowAnalysisModal(false)}
      />
    </SafeAreaView>
  );
}
