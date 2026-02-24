import { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { useLocalSearchParams , useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { useQuery } from '@apollo/client/react';
import { Header, Button } from '../../../components/ui';
import { GET_ETAT_DES_LIEUX } from '../../../graphql/queries/edl';
import type { GetEdlDetailData } from '../../../types/graphql';
import type {
  TabType} from '../../../components/edl';
import {
  EdlProgressBar,
  EdlTabBar,
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
import type { EdlEditContextValue } from '../../../contexts/EdlEditContext';
import { EdlEditProvider } from '../../../contexts/EdlEditContext';

export default function EditEdlScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('infos');
  const [expandedPieces, setExpandedPieces] = useState<string[]>([]);
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set([0]));
  const pagerRef = useRef<PagerView>(null);
  const scrollPosition = useRef(new Animated.Value(0)).current;

  const TAB_ORDER: TabType[] = ['infos', 'compteurs', 'cles', 'pieces'];

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    const index = TAB_ORDER.indexOf(tab);
    setVisitedTabs(prev => { const next = new Set(prev); next.add(index); return next; });
    pagerRef.current?.setPage(index);
  }, []);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    const pos = e.nativeEvent.position;
    setActiveTab(TAB_ORDER[pos]);
    setVisitedTabs(prev => { const next = new Set(prev); next.add(pos); return next; });
  }, []);

  const handlePageScroll = useCallback((e: { nativeEvent: { position: number; offset: number } }) => {
    scrollPosition.setValue(e.nativeEvent.position + e.nativeEvent.offset);
  }, [scrollPosition]);

  const { data, loading } = useQuery<GetEdlDetailData>(GET_ETAT_DES_LIEUX, {
    variables: { id: `/api/etat_des_lieuxes/${id}` },
    fetchPolicy: 'cache-and-network',
  });
  const edl = data?.etatDesLieux;

  const state = useEdlInitializer(edl);

  const { autoSaveStatus, performAutoSave } = useEdlAutoSave({
    edlId: id!,
    edl,
    formData: state.formData,
    localPieces: state.localPieces,
    localCompteurs: state.localCompteurs,
    localCles: state.localCles,
    compteurValues: state.compteurValues,
    compteurNumeros: state.compteurNumeros,
    compteurComments: state.compteurComments,
    cleValues: state.cleValues,
    elementStates: state.elementStates,
    elementObservations: state.elementObservations,
    elementDegradations: state.elementDegradations,
  });

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
    compteurNumeros: state.compteurNumeros,
    compteurComments: state.compteurComments,
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

  const handleBack = useCallback(() => {
    if (autoSaveStatus === 'modified') {
      Alert.alert(
        'Modifications non sauvegardées',
        'Vous avez des modifications en attente de sauvegarde.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Quitter sans sauvegarder',
            style: 'destructive',
            onPress: () => router.back(),
          },
          {
            text: 'Sauvegarder et quitter',
            onPress: async () => {
              await performAutoSave();
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  }, [autoSaveStatus, performAutoSave, router]);

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

  // Context value
  const contextValue: EdlEditContextValue = useMemo(() => ({
    ...state,
    expandedPieces,
    togglePiece,
    toggleDegradation,
    addCustomDegradation,
    ...mutations,
    isAnalyzing: ai.isAnalyzing,
    isRoomAnalyzing: ai.isRoomAnalyzing,
    handleAnalyzeElement: ai.handleAnalyzeElement,
    handleScanRoom: ai.handleScanRoom,
    autoSaveStatus,
  }), [state, expandedPieces, togglePiece, toggleDegradation, addCustomDegradation, mutations, ai.isAnalyzing, ai.isRoomAnalyzing, ai.handleAnalyzeElement, ai.handleScanRoom, autoSaveStatus]);

  if (loading && !edl) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
        <Header title="Modifier EDL" showBack />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 dark:text-gray-400">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <EdlEditProvider value={contextValue}>
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
        <Header title="Modifier EDL" showBack onBack={handleBack} />

        <EdlProgressBar
          formData={state.formData}
          localPieces={state.localPieces}
          localCompteurs={state.localCompteurs}
          localCles={state.localCles}
          compteurValues={state.compteurValues}
          cleValues={state.cleValues}
          elementStates={state.elementStates}
        />
        <EdlTabBar activeTab={activeTab} onTabChange={handleTabChange} scrollPosition={scrollPosition} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            onPageSelected={handlePageSelected}
            onPageScroll={handlePageScroll}
          >
            {TAB_ORDER.map((tab, index) => (
              <ScrollView key={tab} keyboardShouldPersistTaps="handled">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View>
                    {visitedTabs.has(index) && (
                      tab === 'infos' ? <EdlInfosTab /> :
                      tab === 'compteurs' ? <EdlCompteursTab /> :
                      tab === 'cles' ? <EdlClesTab /> :
                      <EdlPiecesTab />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>
            ))}
          </PagerView>
        </KeyboardAvoidingView>

        <View className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
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
    </EdlEditProvider>
  );
}
