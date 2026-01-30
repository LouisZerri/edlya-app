import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, FileText, Lightbulb, Check, Home, User, DoorOpen, Zap, Key, AlertCircle, Plus, ImageIcon, Download, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { Header, Card, Button, Badge } from '../components/ui';
import { COLORS } from '../utils/constants';
import { usePdfImport, DonneesExtraites, ExtractedImage } from '../hooks/usePdfImport';
import { GET_LOGEMENTS } from '../graphql/queries/logements';
import { CREATE_LOGEMENT } from '../graphql/mutations/logements';
import { useToastStore } from '../stores/toastStore';

type Step = 'upload' | 'preview' | 'logement' | 'creating';

// Types GraphQL
interface LogementNode {
  id: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  type?: string;
  surface?: number;
  nbPieces?: number;
  photoPrincipale?: string;
  createdAt: string;
}

interface GetLogementsData {
  logements: {
    edges: Array<{ node: LogementNode }>;
  };
}

interface CreateLogementData {
  createLogement: {
    logement: LogementNode;
  };
}

// Fonction pour calculer la similarité entre deux chaînes
function similarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1;
  if (str1.includes(str2) || str2.includes(str1)) return 0.8;

  // Jaccard similarity sur les mots
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// Trouver le meilleur match de logement
function findBestMatch(extractedLogement: any, logements: any[]): { logement: any; score: number } | null {
  if (!extractedLogement || logements.length === 0) return null;

  let bestMatch: { logement: any; score: number } | null = null;

  for (const logement of logements) {
    let score = 0;
    let factors = 0;

    // Comparer l'adresse
    if (extractedLogement.adresse && logement.adresse) {
      score += similarity(extractedLogement.adresse, logement.adresse) * 3; // Poids x3
      factors += 3;
    }

    // Comparer la ville
    if (extractedLogement.ville && logement.ville) {
      score += similarity(extractedLogement.ville, logement.ville) * 2; // Poids x2
      factors += 2;
    }

    // Comparer le code postal
    if (extractedLogement.code_postal && logement.codePostal) {
      score += (extractedLogement.code_postal === logement.codePostal ? 1 : 0);
      factors += 1;
    }

    if (factors > 0) {
      const normalizedScore = score / factors;
      if (!bestMatch || normalizedScore > bestMatch.score) {
        bestMatch = { logement, score: normalizedScore };
      }
    }
  }

  // Retourner seulement si le score est suffisant (> 0.5)
  return bestMatch && bestMatch.score > 0.5 ? bestMatch : null;
}

export default function ImportScreen() {
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);
  const [extractedData, setExtractedData] = useState<DonneesExtraites | null>(null);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [selectedLogement, setSelectedLogement] = useState<any>(null);
  const [matchedLogement, setMatchedLogement] = useState<{ logement: any; score: number } | null>(null);
  const [creatingLogement, setCreatingLogement] = useState(false);
  const [savingImages, setSavingImages] = useState(false);
  const [savedImagesCount, setSavedImagesCount] = useState(0);
  const isSavingRef = useRef(false); // Pour bloquer immédiatement les doubles appels

  const { isImporting, isCreating, importPdf, createEdlFromPdf } = usePdfImport();

  const { data: logementsData, refetch: refetchLogements } = useQuery<GetLogementsData>(GET_LOGEMENTS);
  const logements = useMemo(() =>
    logementsData?.logements?.edges?.map((e) => e.node) || [],
    [logementsData]
  );

  const [createLogementMutation] = useMutation<CreateLogementData>(CREATE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS }],
  });

  // Ref pour éviter de re-matcher après le premier match
  const hasMatchedRef = useRef(false);

  // Quand les données sont extraites, chercher un match (une seule fois)
  useEffect(() => {
    if (extractedData?.logement && logements.length > 0 && !hasMatchedRef.current) {
      hasMatchedRef.current = true;
      const match = findBestMatch(extractedData.logement, logements);
      setMatchedLogement(match);
      if (match && match.score > 0.7) {
        // Auto-sélectionner si le match est très bon
        setSelectedLogement(match.logement);
      }
    }
  }, [extractedData, logements]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
        });
        setExtractedData(null);
        setExtractedImages([]);
        setSavedImagesCount(0);
        setMatchedLogement(null);
        setSelectedLogement(null);
        hasMatchedRef.current = false;
        setStep('upload');
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    const result = await importPdf(selectedFile.uri, selectedFile.name);
    if (result?.success && result.donnees_extraites) {
      setExtractedData(result.donnees_extraites);
      setExtractedImages(result.images || []);
      setSavedImagesCount(0);
      setStep('preview');
    }
  };

  const saveImagesToGallery = async () => {
    // Éviter les doubles appels avec ref synchrone + vérifier si déjà sauvé
    if (extractedImages.length === 0 || isSavingRef.current || savedImagesCount > 0) return;
    isSavingRef.current = true;
    setSavingImages(true);

    try {
      // Demander la permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission refusée pour accéder à la galerie');
        return;
      }

      // Utiliser documentDirectory qui est plus fiable sur iOS
      const docDir = FileSystemLegacy.documentDirectory;
      if (!docDir) {
        showError('Impossible d\'accéder au stockage');
        return;
      }

      // Dédupliquer les images par contenu (les 100 premiers caractères du base64)
      const seenHashes = new Set<string>();
      const uniqueImages = extractedImages.filter((img) => {
        // Créer un "hash" simple basé sur les premiers caractères du base64
        const hash = img.data.substring(0, 100);
        if (seenHashes.has(hash)) {
          return false;
        }
        seenHashes.add(hash);
        return true;
      });

      let saved = 0;
      const timestamp = Date.now();

      for (let i = 0; i < uniqueImages.length; i++) {
        const image = uniqueImages[i];
        try {
          // Nom de fichier unique avec timestamp + index de boucle
          const extension = image.mimeType.includes('png') ? 'png' : 'jpg';
          const fileName = `edl_${timestamp}_${i}.${extension}`;
          const fileUri = docDir + fileName;

          // Nettoyer les données base64
          let base64Data = image.data;
          if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
          }

          // Écrire le fichier
          await FileSystemLegacy.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystemLegacy.EncodingType.Base64,
          });

          // Vérifier que le fichier existe
          const fileInfo = await FileSystemLegacy.getInfoAsync(fileUri);
          if (!fileInfo.exists) {
            console.warn('File not created:', fileName);
            continue;
          }

          // Sauvegarder dans la galerie
          try {
            const asset = await MediaLibrary.createAssetAsync(fileUri);
            if (asset) {
              saved++;
            }
          } catch (saveErr) {
            console.warn('Could not save to gallery:', saveErr);
          }

          // Nettoyer le fichier temporaire
          try {
            await FileSystemLegacy.deleteAsync(fileUri, { idempotent: true });
          } catch {
            // Ignorer les erreurs de suppression
          }
        } catch (err) {
          console.warn('Error processing image:', image.index, err);
        }
      }

      setSavedImagesCount(saved);
      if (saved > 0) {
        success(`${saved} photo${saved > 1 ? 's' : ''} enregistrée${saved > 1 ? 's' : ''}`);
      } else {
        showError('Aucune photo n\'a pu être sauvegardée');
      }
    } catch (err: any) {
      console.error('Error saving images:', err);
      showError('Erreur lors de la sauvegarde');
    } finally {
      setSavingImages(false);
      isSavingRef.current = false;
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
        const newLogement = result.data.createLogement.logement;
        setSelectedLogement(newLogement);
        success('Logement créé automatiquement !');
        await refetchLogements();
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la création du logement');
    } finally {
      setCreatingLogement(false);
    }
  };

  const handleSelectLogement = () => {
    setStep('logement');
  };

  const handleCreateEdl = async () => {
    if (!selectedFile || !selectedLogement) return;

    setStep('creating');
    const result = await createEdlFromPdf(
      selectedFile.uri,
      selectedFile.name,
      selectedLogement.id
    );

    if (result?.success && result.edl) {
      success(`EDL créé avec ${result.edl.nbPieces} pièces !`);
      router.replace(`/edl/${result.edl.id}/edit`);
    } else {
      setStep('preview');
    }
  };

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
            <Text className="text-primary-700 font-medium text-center px-4">
              {selectedFile.name}
            </Text>
            <Text className="text-primary-500 text-sm mt-2">
              Appuyez pour changer
            </Text>
          </>
        ) : (
          <>
            <Text className="text-primary-700 font-medium">
              Deposez votre PDF ici
            </Text>
            <Text className="text-primary-500 text-sm mt-1">
              ou cliquez pour selectionner
            </Text>
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
              Notre IA analyse automatiquement votre PDF d'etat des lieux existant et extrait
              les informations pour creer un nouvel EDL numerique.
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

  const renderPreviewStep = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Success Banner */}
      <View className="bg-green-50 border border-green-200 rounded-xl p-4 flex-row items-center mb-4">
        <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
          <Check size={24} color={COLORS.green[600]} />
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-green-800">Analyse terminée !</Text>
          <Text className="text-green-700 text-sm">
            Les données ont été extraites avec succès
          </Text>
        </View>
      </View>

      {/* Type EDL */}
      {extractedData?.type_edl && (
        <Card className="mb-4">
          <Text className="font-semibold text-gray-800 mb-2">Type d'état des lieux</Text>
          <Badge
            label={extractedData.type_edl === 'entree' ? 'Entrée' : 'Sortie'}
            variant={extractedData.type_edl === 'entree' ? 'blue' : 'orange'}
          />
        </Card>
      )}

      {/* Logement - avec matching automatique */}
      <Card className="mb-4">
        <View className="flex-row items-center mb-3">
          <Home size={20} color={COLORS.primary[600]} />
          <Text className="font-semibold text-gray-800 ml-2">Logement</Text>
        </View>

        {/* Données extraites du PDF */}
        {extractedData?.logement && (
          <View className="bg-gray-50 rounded-lg p-3 mb-3">
            <Text className="text-xs text-gray-500 mb-1">Extrait du PDF :</Text>
            {extractedData.logement.adresse && (
              <Text className="text-gray-700">{extractedData.logement.adresse}</Text>
            )}
            {(extractedData.logement.code_postal || extractedData.logement.ville) && (
              <Text className="text-gray-500 text-sm">
                {extractedData.logement.code_postal} {extractedData.logement.ville}
              </Text>
            )}
            {extractedData.logement.surface && (
              <Text className="text-gray-500 text-sm">{extractedData.logement.surface} m²</Text>
            )}
          </View>
        )}

        {/* Logement sélectionné ou matché */}
        {selectedLogement ? (
          <View className="bg-green-50 border border-green-200 rounded-lg p-3">
            <View className="flex-row items-center">
              <Check size={16} color={COLORS.green[600]} />
              <Text className="text-green-800 font-medium ml-2">Logement associé</Text>
            </View>
            <Text className="text-green-700 mt-1">{selectedLogement.nom}</Text>
            <Text className="text-green-600 text-sm">{selectedLogement.adresse}, {selectedLogement.ville}</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedLogement(null);
                setStep('logement');
              }}
              className="mt-2"
            >
              <Text className="text-primary-600 text-sm font-medium">Changer de logement</Text>
            </TouchableOpacity>
          </View>
        ) : matchedLogement ? (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <AlertCircle size={16} color={COLORS.blue[600]} />
                <Text className="text-blue-800 font-medium ml-2">Logement similaire trouvé</Text>
              </View>
              <Badge
                label={`${Math.round(matchedLogement.score * 100)}% match`}
                variant="blue"
              />
            </View>
            <Text className="text-blue-700 mt-1">{matchedLogement.logement.nom}</Text>
            <Text className="text-blue-600 text-sm">
              {matchedLogement.logement.adresse}, {matchedLogement.logement.ville}
            </Text>
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                onPress={() => setSelectedLogement(matchedLogement.logement)}
                className="flex-1 h-9 bg-blue-600 rounded-lg items-center justify-center"
              >
                <Text className="text-white font-medium text-sm">Utiliser ce logement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateLogementFromPdf}
                disabled={creatingLogement}
                className="flex-1 h-9 border border-blue-300 rounded-lg items-center justify-center"
              >
                {creatingLogement ? (
                  <ActivityIndicator size="small" color={COLORS.blue[600]} />
                ) : (
                  <Text className="text-blue-700 font-medium text-sm">Créer nouveau</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : extractedData?.logement ? (
          <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <View className="flex-row items-center">
              <Plus size={16} color={COLORS.amber[600]} />
              <Text className="text-amber-800 font-medium ml-2">Aucun logement correspondant</Text>
            </View>
            <Text className="text-amber-700 text-sm mt-1">
              Ce logement n'existe pas encore dans votre liste.
            </Text>
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                onPress={handleCreateLogementFromPdf}
                disabled={creatingLogement}
                className="flex-1 h-9 bg-amber-600 rounded-lg flex-row items-center justify-center"
              >
                {creatingLogement ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Plus size={16} color="white" />
                    <Text className="text-white font-medium text-sm ml-1">Créer automatiquement</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStep('logement')}
                className="flex-1 h-9 border border-amber-300 rounded-lg items-center justify-center"
              >
                <Text className="text-amber-700 font-medium text-sm">Choisir existant</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setStep('logement')}
            className="py-3 border border-dashed border-gray-300 rounded-lg items-center"
          >
            <Text className="text-gray-600">Sélectionner un logement</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Locataire */}
      {extractedData?.locataire && (
        <Card className="mb-4">
          <View className="flex-row items-center mb-3">
            <User size={20} color={COLORS.amber[600]} />
            <Text className="font-semibold text-gray-800 ml-2">Locataire</Text>
          </View>
          {extractedData.locataire.nom && (
            <Text className="text-gray-700 font-medium">{extractedData.locataire.nom}</Text>
          )}
          {extractedData.locataire.email && (
            <Text className="text-gray-500 text-sm">{extractedData.locataire.email}</Text>
          )}
          {extractedData.locataire.telephone && (
            <Text className="text-gray-500 text-sm">{extractedData.locataire.telephone}</Text>
          )}
        </Card>
      )}

      {/* Pièces */}
      {extractedData?.pieces && extractedData.pieces.length > 0 && (
        <Card className="mb-4">
          <View className="flex-row items-center mb-3">
            <DoorOpen size={20} color={COLORS.green[600]} />
            <Text className="font-semibold text-gray-800 ml-2">
              Pièces ({extractedData.pieces.length})
            </Text>
          </View>
          {extractedData.pieces.map((piece, idx) => (
            <View key={idx} className="py-2 border-b border-gray-100 last:border-0">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700 font-medium">{piece.nom}</Text>
                <Badge label={`${piece.elements.length} éléments`} variant="gray" />
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Compteurs */}
      {extractedData?.compteurs && extractedData.compteurs.length > 0 && (
        <Card className="mb-4">
          <View className="flex-row items-center mb-3">
            <Zap size={20} color={COLORS.amber[500]} />
            <Text className="font-semibold text-gray-800 ml-2">
              Compteurs ({extractedData.compteurs.length})
            </Text>
          </View>
          {extractedData.compteurs.map((compteur, idx) => (
            <View key={idx} className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <Text className="text-gray-700">{compteur.type}</Text>
              {compteur.index && (
                <Text className="text-gray-500 text-sm">{compteur.index}</Text>
              )}
            </View>
          ))}
        </Card>
      )}

      {/* Clés */}
      {extractedData?.cles && extractedData.cles.length > 0 && (
        <Card className="mb-4">
          <View className="flex-row items-center mb-3">
            <Key size={20} color={COLORS.gray[600]} />
            <Text className="font-semibold text-gray-800 ml-2">
              Clés ({extractedData.cles.length})
            </Text>
          </View>
          {extractedData.cles.map((cle, idx) => (
            <View key={idx} className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <Text className="text-gray-700">{cle.type}</Text>
              <Badge label={`x${cle.nombre}`} variant="gray" />
            </View>
          ))}
        </Card>
      )}

      {/* Photos extraites */}
      {extractedImages.length > 0 && (
        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <ImageIcon size={20} color={COLORS.primary[600]} />
              <Text className="font-semibold text-gray-800 ml-2">
                Photos extraites ({extractedImages.length})
              </Text>
            </View>
            {savedImagesCount > 0 && (
              <Badge label={`${savedImagesCount} sauvées`} variant="green" />
            )}
          </View>

          {/* Grille de miniatures */}
          <View className="flex-row flex-wrap -mx-1 mb-3">
            {extractedImages.slice(0, 6).map((image, idx) => (
              <View key={idx} className="w-1/3 p-1">
                <View className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    source={{ uri: `data:${image.mimeType};base64,${image.data}` }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              </View>
            ))}
          </View>

          {extractedImages.length > 6 && (
            <Text className="text-gray-500 text-sm text-center mb-3">
              + {extractedImages.length - 6} autres photos
            </Text>
          )}

          {/* Bouton sauvegarder */}
          {savedImagesCount === 0 ? (
            <TouchableOpacity
              onPress={saveImagesToGallery}
              disabled={savingImages}
              className={`flex-row items-center justify-center py-3 rounded-xl ${
                savingImages
                  ? 'bg-gray-100 border border-gray-200'
                  : 'bg-primary-50 border border-primary-200'
              }`}
              activeOpacity={savingImages ? 1 : 0.7}
            >
              {savingImages ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.gray[400]} />
                  <Text className="text-gray-500 font-medium ml-2">
                    Sauvegarde en cours...
                  </Text>
                </>
              ) : (
                <>
                  <Download size={18} color={COLORS.primary[600]} />
                  <Text className="text-primary-700 font-medium ml-2">
                    Enregistrer dans la galerie
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center justify-center py-3 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle size={18} color={COLORS.green[600]} />
              <Text className="text-green-700 font-medium ml-2">
                Photos enregistrées dans votre galerie
              </Text>
            </View>
          )}

          {/* Message d'avertissement */}
          <View className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Text className="text-amber-700 text-xs text-center">
              ⚠️ L'IA peut faire des erreurs et ne pas récupérer toutes les images du PDF. Vérifiez que toutes vos photos sont bien présentes.
            </Text>
          </View>

          <Text className="text-gray-400 text-xs text-center mt-2">
            Les photos seront disponibles dans votre galerie pour les ajouter lors de l'édition.
          </Text>
        </Card>
      )}

      <View className="h-24" />
    </ScrollView>
  );

  const renderLogementStep = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <Text className="text-blue-800 font-medium">Sélectionnez le logement</Text>
        <Text className="text-blue-700 text-sm mt-1">
          L'EDL sera créé pour ce logement avec les données extraites du PDF.
        </Text>
      </View>

      {/* Option créer nouveau si données disponibles */}
      {extractedData?.logement && (
        <TouchableOpacity
          onPress={handleCreateLogementFromPdf}
          disabled={creatingLogement}
          className="mb-4 p-4 bg-primary-50 border-2 border-dashed border-primary-300 rounded-xl"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-primary-100 rounded-xl items-center justify-center">
              {creatingLogement ? (
                <ActivityIndicator size="small" color={COLORS.primary[600]} />
              ) : (
                <Plus size={24} color={COLORS.primary[600]} />
              )}
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-primary-700">Créer un nouveau logement</Text>
              <Text className="text-primary-600 text-sm">
                À partir des données du PDF
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {logements.length === 0 && !extractedData?.logement ? (
        <Card className="mb-4">
          <View className="flex-row items-center">
            <AlertCircle size={20} color={COLORS.amber[600]} />
            <Text className="text-amber-800 ml-2">Aucun logement disponible</Text>
          </View>
          <Text className="text-gray-600 text-sm mt-2">
            Créez d'abord un logement avant de pouvoir importer un EDL.
          </Text>
          <View className="mt-3">
            <Button
              label="Créer un logement"
              onPress={() => router.push('/logement/create')}
              variant="secondary"
              fullWidth
            />
          </View>
        </Card>
      ) : (
        <>
          {logements.length > 0 && (
            <Text className="text-gray-500 text-sm mb-3">Ou sélectionnez un logement existant :</Text>
          )}
          {logements.map((logement: any) => {
            const isMatched = matchedLogement?.logement.id === logement.id;
            return (
              <TouchableOpacity
                key={logement.id}
                onPress={() => setSelectedLogement(logement)}
                className={`mb-3 p-4 bg-white rounded-xl border-2 ${
                  selectedLogement?.id === logement.id
                    ? 'border-primary-500 bg-primary-50'
                    : isMatched
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-100'
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                    selectedLogement?.id === logement.id ? 'bg-primary-100' :
                    isMatched ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Home size={24} color={
                      selectedLogement?.id === logement.id ? COLORS.primary[600] :
                      isMatched ? COLORS.blue[600] : COLORS.gray[500]
                    } />
                  </View>
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className={`font-semibold ${
                        selectedLogement?.id === logement.id ? 'text-primary-700' :
                        isMatched ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {logement.nom}
                      </Text>
                      {isMatched && (
                        <View className="ml-2">
                          <Badge label="Suggéré" variant="blue" />
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-500 text-sm">{logement.adresse}</Text>
                    <Text className="text-gray-400 text-xs">{logement.ville}</Text>
                  </View>
                  {selectedLogement?.id === logement.id && (
                    <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                      <Check size={16} color="white" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      <View className="h-24" />
    </ScrollView>
  );

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
        {step === 'logement' && renderLogementStep()}
        {step === 'creating' && renderCreatingStep()}
      </View>

      {/* Footer for preview step */}
      {step === 'preview' && (
        <View className="p-4 bg-white border-t border-gray-100">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => {
                setStep('upload');
                setExtractedData(null);
                setExtractedImages([]);
                setSavedImagesCount(0);
                setSelectedLogement(null);
                setMatchedLogement(null);
                hasMatchedRef.current = false;
              }}
              className="flex-1 py-3 border border-gray-300 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-medium">Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={selectedLogement ? handleCreateEdl : handleSelectLogement}
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
