import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, FileText, Lightbulb, Check, Edit3 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { Header, Button } from '../components/ui';
import { COLORS } from '../utils/constants';
import { usePdfImport, DonneesExtraites, ExtractedImage } from '../hooks/usePdfImport';
import { useAuthStore } from '../stores/authStore';
import { GET_LOGEMENTS } from '../graphql/queries/logements';
import { CREATE_LOGEMENT } from '../graphql/mutations/logements';
import { useToastStore } from '../stores/toastStore';
import { GetLogementsData, CreateLogementData, LogementNode } from '../types/graphql';
import { findBestMatch } from '../utils/similarity';
import { useImportPreviewEditor } from '../hooks/useImportPreviewEditor';
import {
  ImportPreviewTypeEdl,
  ImportPreviewLogement,
  ImportPreviewLocataire,
  ImportPreviewPieces,
  ImportPreviewCompteurs,
  ImportPreviewCles,
  LogementSelector,
} from '../components/edl';

type Step = 'upload' | 'preview' | 'logement' | 'creating';

export default function ImportScreen() {
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);
  const [extractedData, setExtractedData] = useState<DonneesExtraites | null>(null);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [selectedLogement, setSelectedLogement] = useState<LogementNode | null>(null);
  const [matchedLogement, setMatchedLogement] = useState<{ logement: LogementNode; score: number } | null>(null);
  const [creatingLogement, setCreatingLogement] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  const { isImporting, isCreating, importPdf, createEdlFromData } = usePdfImport();

  const editor = useImportPreviewEditor(extractedData, setExtractedData);

  const { data: logementsData, refetch: refetchLogements } = useQuery<GetLogementsData>(GET_LOGEMENTS);
  const logements = useMemo(() =>
    logementsData?.logements?.edges?.map((e) => e.node) || [],
    [logementsData]
  );

  const [createLogementMutation] = useMutation<CreateLogementData>(CREATE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS }],
  });

  const hasMatchedRef = useRef(false);

  useEffect(() => {
    if (extractedData?.logement && logements.length > 0 && !hasMatchedRef.current) {
      hasMatchedRef.current = true;
      const match = findBestMatch(extractedData.logement, logements);
      setMatchedLogement(match);
      if (match && match.score > 0.7) {
        setSelectedLogement(match.logement);
      }
    }
  }, [extractedData, logements]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled && result.assets[0]) {
        setSelectedFile({ uri: result.assets[0].uri, name: result.assets[0].name });
        setExtractedData(null);
        setExtractedImages([]);
        setMatchedLogement(null);
        setSelectedLogement(null);
        hasMatchedRef.current = false;
        setStep('upload');
      }
    } catch {
      // ignore
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    const result = await importPdf(selectedFile.uri, selectedFile.name);
    if (result?.success && result.donnees_extraites) {
      setExtractedData(result.donnees_extraites);
      setExtractedImages(result.images || []);
      setImportId(result.import_id || null);
      setStep('preview');
    }
  };

  const handleCreateLogementFromPdf = async () => {
    if (!extractedData?.logement) return;
    setCreatingLogement(true);
    try {
      const logementData = extractedData.logement;
      const result = await createLogementMutation({
        variables: {
          input: {
            nom: logementData.adresse || 'Nouveau logement',
            adresse: logementData.adresse || '',
            codePostal: logementData.code_postal || '',
            ville: logementData.ville || '',
            type: logementData.type || null,
            surface: logementData.surface ? parseFloat(String(logementData.surface)) : null,
            nbPieces: 1,
          },
        },
      });
      if (result.data?.createLogement?.logement) {
        setSelectedLogement(result.data.createLogement.logement);
        success('Logement créé automatiquement !');
        await refetchLogements();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du logement';
      showError(msg);
    } finally {
      setCreatingLogement(false);
    }
  };

  const handleCreateEdl = async () => {
    if (!extractedData || !selectedLogement) return;
    setStep('creating');
    const result = await createEdlFromData(extractedData, selectedLogement.id, importId || undefined);
    if (result?.success && result.edl) {
      success(`EDL créé avec ${result.edl.nbPieces} pièces !`);
      router.replace(`/edl/${result.edl.id}/edit`);
    } else {
      setStep('preview');
    }
  };

  const resetImport = () => {
    setStep('upload');
    setExtractedData(null);
    setExtractedImages([]);
    setSelectedLogement(null);
    setMatchedLogement(null);
    hasMatchedRef.current = false;
  };

  // Upload step
  const renderUploadStep = () => (
    <>
      <TouchableOpacity
        onPress={handlePickDocument}
        className="flex-1 max-h-64 border-2 border-dashed border-primary-300 bg-primary-50 rounded-2xl items-center justify-center"
        activeOpacity={0.7}
      >
        <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-4">
          {selectedFile ? (
            <FileText size={32} color={COLORS.primary[600]} />
          ) : (
            <Upload size={32} color={COLORS.primary[600]} />
          )}
        </View>
        {selectedFile ? (
          <>
            <Text className="text-primary-700 font-medium text-center px-4">{selectedFile.name}</Text>
            <Text className="text-primary-500 text-sm mt-2">Appuyez pour changer</Text>
          </>
        ) : (
          <>
            <Text className="text-primary-700 font-medium">Déposez votre PDF ici</Text>
            <Text className="text-primary-500 text-sm mt-1">ou cliquez pour sélectionner</Text>
            <View className="mt-4 px-4 py-2 bg-primary-600 rounded-lg">
              <Text className="text-white font-medium">Choisir un fichier</Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      <View className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <View className="flex-row">
          <Lightbulb size={20} color={COLORS.amber[600]} />
          <View className="flex-1 ml-3">
            <Text className="font-medium text-amber-800">Astuce</Text>
            <Text className="text-amber-700 text-sm mt-1">
              Notre IA analyse automatiquement votre PDF d'état des lieux existant et extrait
              les informations pour créer un nouvel EDL numérique.
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-auto">
        <Button
          label={isImporting ? "Analyse en cours..." : "Importer et analyser"}
          onPress={handleAnalyze}
          loading={isImporting}
          fullWidth
          disabled={!selectedFile || isImporting}
        />
      </View>
    </>
  );

  // Preview step
  const renderPreviewStep = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Success Banner + Edit Toggle */}
      <View className="bg-green-50 border border-green-200 rounded-xl p-4 flex-row items-center mb-4">
        <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
          <Check size={24} color={COLORS.green[600]} />
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-green-800">Analyse terminée !</Text>
          <Text className="text-green-700 text-sm">
            {editor.isEditingPreview ? 'Modifiez les données si nécessaire' : 'Vérifiez et modifiez les données extraites'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => editor.setIsEditingPreview(!editor.isEditingPreview)}
          className={`p-2 rounded-lg ${editor.isEditingPreview ? 'bg-primary-100' : 'bg-green-100'}`}
        >
          <Edit3 size={20} color={editor.isEditingPreview ? COLORS.primary[600] : COLORS.green[700]} />
        </TouchableOpacity>
      </View>

      {extractedData && (
        <>
          <ImportPreviewTypeEdl
            extractedData={extractedData}
            isEditing={editor.isEditingPreview}
            onUpdate={editor.updateExtractedData}
          />
          <ImportPreviewLogement
            extractedData={extractedData}
            isEditing={editor.isEditingPreview}
            onUpdate={editor.updateExtractedData}
            selectedLogement={selectedLogement}
            setSelectedLogement={setSelectedLogement}
            matchedLogement={matchedLogement}
            creatingLogement={creatingLogement}
            onCreateLogementFromPdf={handleCreateLogementFromPdf}
            onGoToLogementStep={() => setStep('logement')}
          />
          <ImportPreviewLocataire
            extractedData={extractedData}
            isEditing={editor.isEditingPreview}
            onUpdate={editor.updateExtractedData}
          />
          <ImportPreviewPieces
            extractedData={extractedData}
            isEditing={editor.isEditingPreview}
            expandedPieces={editor.expandedPreviewPieces}
            togglePiece={editor.togglePreviewPiece}
            updatePiece={editor.updatePiece}
            updateElement={editor.updateElement}
            removePiece={editor.removePiece}
            removeElement={editor.removeElement}
            importId={importId}
            token={token}
          />
          <ImportPreviewCompteurs
            extractedData={extractedData}
            isEditing={editor.isEditingPreview}
            onUpdate={editor.updateExtractedData}
            removeCompteur={editor.removeCompteur}
            importId={importId}
            token={token}
          />
          <ImportPreviewCles
            extractedData={extractedData}
            isEditing={editor.isEditingPreview}
            onUpdate={editor.updateExtractedData}
            removeCle={editor.removeCle}
            importId={importId}
            token={token}
          />
        </>
      )}

      {/* Info photos */}
      {extractedImages.length > 0 && (
        <View className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Text className="text-blue-700 text-sm text-center">
            {extractedImages.length} photo{extractedImages.length > 1 ? 's' : ''} extraite{extractedImages.length > 1 ? 's' : ''} du PDF — elles seront associées aux éléments lors de la création.
          </Text>
        </View>
      )}

      <View className="h-24" />
    </ScrollView>
  );

  // Creating step
  const renderCreatingStep = () => (
    <View className="flex-1 items-center justify-center">
      <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
        <ActivityIndicator size="large" color={COLORS.primary[600]} />
      </View>
      <Text className="text-xl font-semibold text-gray-800">Création en cours...</Text>
      <Text className="text-gray-500 text-center mt-2 px-8">
        L'EDL est en cours de création avec les données extraites du PDF.
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header
        title={
          step === 'upload' ? "Importer un PDF" :
          step === 'preview' ? "Données extraites" :
          step === 'logement' ? "Choisir un logement" :
          "Création EDL"
        }
        showBack
      />

      <View className="flex-1 p-4">
        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'logement' && (
          <LogementSelector
            logements={logements}
            selectedLogement={selectedLogement}
            setSelectedLogement={setSelectedLogement}
            matchedLogement={matchedLogement}
            extractedData={extractedData}
            creatingLogement={creatingLogement}
            onCreateLogementFromPdf={handleCreateLogementFromPdf}
            onNavigateToCreate={() => router.push('/logement/create')}
          />
        )}
        {step === 'creating' && renderCreatingStep()}
      </View>

      {/* Footer for preview step */}
      {step === 'preview' && (
        <View className="p-4 bg-white border-t border-gray-100">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={resetImport}
              className="flex-1 py-3 border border-gray-300 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-medium">Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={selectedLogement ? handleCreateEdl : () => setStep('logement')}
              disabled={isCreating}
              className={`flex-1 py-3 rounded-xl items-center ${
                selectedLogement ? 'bg-green-600' : 'bg-primary-600'
              }`}
            >
              <Text className="text-white font-semibold">
                {isCreating ? "Création..." : selectedLogement ? "Créer l'EDL" : "Continuer"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Footer for logement step */}
      {step === 'logement' && (logements.length > 0 || extractedData?.logement) && (
        <View className="p-4 bg-white border-t border-gray-100">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setStep('preview')}
              className="flex-1 py-3 border border-gray-300 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-medium">Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateEdl}
              disabled={!selectedLogement || isCreating}
              className={`flex-1 py-3 rounded-xl items-center ${
                selectedLogement && !isCreating ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <Text className="text-white font-semibold">
                {isCreating ? "Création..." : "Créer l'EDL"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
