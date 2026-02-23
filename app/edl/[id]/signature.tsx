import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useQuery } from '@apollo/client/react';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Check, Trash2, User, Users, Download, ChevronDown } from 'lucide-react-native';
import { Header, Card, Badge } from '../../../components/ui';
import { COLORS, API_URL } from '../../../utils/constants';
import { ELEMENT_ETAT_LABELS, ElementEtat, TYPE_CONFIG } from '../../../types';
import { formatDate } from '../../../utils/format';
import { GET_ETAT_DES_LIEUX } from '../../../graphql/queries/edl';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';
import { usePdfExport } from '../../../hooks/usePdfExport';

// Types GraphQL
interface EtatDesLieuxData {
  etatDesLieux: {
    id: string;
    type: string;
    statut: string;
    dateRealisation: string;
    locataireNom: string;
    locataireEmail?: string;
    locataireTelephone?: string;
    autresLocataires?: string[];
    signatureBailleur?: string;
    signatureLocataire?: string;
    dateSignatureBailleur?: string;
    dateSignatureLocataire?: string;
    logement: {
      nom: string;
      adresse: string;
      ville: string;
    };
    pieces: {
      edges: {
        node: {
          id: string;
          nom: string;
          elements: {
            edges: {
              node: {
                id: string;
                nom: string;
                etat: string;
                degradations?: string[];
              };
            }[];
          };
        };
      }[];
    };
    compteurs: { edges: { node: { id: string } }[] };
    cles: { edges: { node: { id: string } }[] };
  };
}

// Composant signature mémorisé pour éviter les re-renders
const SignatureCanvas = memo(({
  signatureRef,
  onOK,
  onBegin,
  onEnd,
}: {
  signatureRef: React.RefObject<SignatureViewRef | null>;
  onOK: (sig: string) => void;
  onBegin: () => void;
  onEnd: () => void;
}) => (
  <SignatureScreen
    ref={signatureRef}
    onOK={onOK}
    onBegin={onBegin}
    onEnd={onEnd}
    descriptionText=""
    clearText="Effacer"
    confirmText="Valider"
    autoClear={false}
    webStyle={`
      .m-signature-pad { box-shadow: none; border: none; height: 100%; }
      .m-signature-pad--body { border: none; height: 100%; }
      .m-signature-pad--footer { display: none; }
      body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
      canvas { width: 100% !important; height: 100% !important; }
    `}
    backgroundColor="white"
    penColor="black"
  />
));

export default function SignatureEdlScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const token = useAuthStore(state => state.token);
  const { isExporting, exportPdf } = usePdfExport();
  const numericId = id?.includes('/') ? id.split('/').pop()! : id;
  const [loading, setLoading] = useState(false);
  const [recapOpen, setRecapOpen] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const isSigningRef = useRef(false);

  const bailleurRef = useRef<SignatureViewRef>(null);
  const locataireRef = useRef<SignatureViewRef>(null);

  // Contrôle du scroll via ref (pas de re-render)
  const disableScroll = useCallback(() => {
    isSigningRef.current = true;
    scrollRef.current?.setNativeProps?.({ scrollEnabled: false });
  }, []);

  const enableScroll = useCallback(() => {
    isSigningRef.current = false;
    scrollRef.current?.setNativeProps?.({ scrollEnabled: true });
  }, []);

  const [signatureBailleur, setSignatureBailleur] = useState<string | null>(null);
  const [signatureLocataire, setSignatureLocataire] = useState<string | null>(null);
  const [bailleurSaved, setBailleurSaved] = useState(false);
  const [locataireSaved, setLocataireSaved] = useState(false);

  // Fetch existing EDL data
  const { data, refetch } = useQuery<EtatDesLieuxData>(GET_ETAT_DES_LIEUX, {
    variables: { id: `/api/etat_des_lieuxes/${id}` },
  });

  const edl = data?.etatDesLieux;

  // Load existing signatures
  useEffect(() => {
    if (edl) {
      if (edl.signatureBailleur) {
        setSignatureBailleur(edl.signatureBailleur);
        setBailleurSaved(true);
      }
      if (edl.signatureLocataire) {
        setSignatureLocataire(edl.signatureLocataire);
        setLocataireSaved(true);
      }
    }
  }, [edl]);

  const handleBailleurOK = useCallback((signature: string) => {
    setSignatureBailleur(signature);
  }, []);

  const handleLocataireOK = useCallback((signature: string) => {
    setSignatureLocataire(signature);
  }, []);

  const handleSaveBailleur = async () => {
    if (!signatureBailleur || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/edl/${id}/signature/bailleur`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature: signatureBailleur }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      setBailleurSaved(true);
      await refetch();
      success('Signature bailleur enregistrée');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocataire = async () => {
    if (!signatureLocataire || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/edl/${id}/signature/locataire`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature: signatureLocataire }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      setLocataireSaved(true);
      await refetch();
      success('Signature locataire enregistrée — État des lieux signé !');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const SignatureBox = ({
    title,
    icon,
    signatureRef,
    signature,
    isSaved,
    onOK,
    onClear,
    onSave,
  }: {
    title: string;
    icon: React.ReactNode;
    signatureRef: React.RefObject<SignatureViewRef | null>;
    signature: string | null;
    isSaved: boolean;
    onOK: (sig: string) => void;
    onClear: () => void;
    onSave: () => void;
  }): React.ReactElement => (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        {icon}
        <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 ml-2">{title}</Text>
        {isSaved && (
          <View className="ml-auto bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
            <Text className="text-green-700 dark:text-green-300 text-xs font-medium">Enregistrée</Text>
          </View>
        )}
      </View>

      <View className="h-48 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
        {isSaved && signature ? (
          <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-2">
            <Image
              source={{ uri: signature }}
              style={{ flex: 1 }}
              resizeMode="contain"
            />
          </View>
        ) : signature ? (
          <View className="flex-1 items-center justify-center bg-primary-50">
            <Check size={32} color={COLORS.primary[600]} />
            <Text className="text-primary-600 font-medium mt-2">Signature prête</Text>
            <Text className="text-primary-400 text-xs mt-1">Cliquez sur Enregistrer</Text>
          </View>
        ) : (
          <SignatureCanvas
            signatureRef={signatureRef}
            onOK={onOK}
            onBegin={disableScroll}
            onEnd={enableScroll}
          />
        )}
      </View>

      <View className="flex-row gap-3 mt-3">
        {!isSaved && (
          <TouchableOpacity
            onPress={() => {
              signatureRef.current?.clearSignature();
              onClear();
            }}
            className="flex-1 flex-row items-center justify-center py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            <Trash2 size={18} color={COLORS.gray[600]} />
            <Text className="text-gray-700 dark:text-gray-300 font-medium ml-2">Effacer</Text>
          </TouchableOpacity>
        )}

        {!signature && !isSaved && (
          <TouchableOpacity
            onPress={() => signatureRef.current?.readSignature()}
            className="flex-1 flex-row items-center justify-center py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <Check size={18} color={COLORS.gray[700]} />
            <Text className="text-gray-700 dark:text-gray-300 font-medium ml-2">Valider</Text>
          </TouchableOpacity>
        )}

        {signature && !isSaved && (
          <TouchableOpacity
            onPress={onSave}
            disabled={loading}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${loading ? 'bg-green-400' : 'bg-green-600'}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Check size={18} color="white" />
            )}
            <Text className="text-white font-medium ml-2">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        )}

        {isSaved && (
          <TouchableOpacity
            onPress={() => {
              signatureRef.current?.clearSignature();
              onClear();
            }}
            className="flex-1 flex-row items-center justify-center py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            <Trash2 size={18} color={COLORS.gray[600]} />
            <Text className="text-gray-700 dark:text-gray-300 font-medium ml-2">Modifier</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  if (bailleurSaved && locataireSaved) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
        <Header title="Signatures" showBack />

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-6">
            <Check size={40} color={COLORS.green[600]} />
          </View>

          <Text className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            État des lieux signé
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Les deux parties ont signé l'état des lieux
          </Text>

          <TouchableOpacity
            onPress={() => exportPdf(numericId, 'edl')}
            disabled={isExporting}
            className="w-full flex-row items-center justify-center py-3.5 bg-primary-600 rounded-xl mb-3"
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Download size={20} color="white" />
            )}
            <Text className="text-white font-semibold ml-2">
              {isExporting ? 'Téléchargement...' : 'Télécharger le PDF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace(`/edl/${id}`)}
            className="w-full flex-row items-center justify-center py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl"
          >
            <Text className="text-gray-700 dark:text-gray-300 font-semibold">
              Retour à l'état des lieux
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <Header title="Signatures" showBack />

      <ScrollView
        ref={scrollRef}
        className="flex-1 p-4"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Info */}
        <View className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
          <Text className="text-blue-800 dark:text-blue-300 text-sm">
            1. Signez en tant que bailleur{'\n'}
            2. Passez le téléphone au locataire pour qu'il signe
          </Text>
        </View>

        {/* Récapitulatif EDL */}
        {edl && (
          <Card className="mb-4">
            <TouchableOpacity
              onPress={() => setRecapOpen(!recapOpen)}
              className="flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Récapitulatif de l'EDL
              </Text>
              <View style={{ transform: [{ rotate: recapOpen ? '180deg' : '0deg' }] }}>
                <ChevronDown size={20} color={COLORS.gray[500]} />
              </View>
            </TouchableOpacity>

            {recapOpen && (
              <View className="mt-3">
                <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {edl.logement.nom}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {edl.logement.adresse}, {edl.logement.ville}
                </Text>

                <View className="flex-row items-center mt-2 gap-1">
                  <Badge
                    label={TYPE_CONFIG[edl.type as keyof typeof TYPE_CONFIG]?.label || edl.type}
                    variant={edl.type === 'entree' ? 'blue' : 'orange'}
                  />
                  <Text className="text-xs text-gray-400">•</Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-300">
                    {formatDate(edl.dateRealisation)}
                  </Text>
                  <Text className="text-xs text-gray-400">•</Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-300">
                    {edl.locataireNom}
                  </Text>
                  {edl.autresLocataires && edl.autresLocataires.length > 0 && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      et {edl.autresLocataires.length} autre{edl.autresLocataires.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>

                {edl.autresLocataires && edl.autresLocataires.length > 0 && (
                  <View className="bg-primary-50 dark:bg-primary-900/20 rounded-xl px-4 py-3 mt-3">
                    <Text className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Locataires :
                    </Text>
                    <Text className="text-sm text-primary-600 dark:text-primary-400">
                      {edl.locataireNom}, {edl.autresLocataires.join(', ')}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 italic">
                      Représenté(s) par {edl.locataireNom} (signataire)
                    </Text>
                  </View>
                )}

                <View className="flex-row mt-3 gap-3">
                  <View className="flex-row items-center">
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      🚪 {edl.pieces.edges.length} pièce{edl.pieces.edges.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      ⚡ {edl.compteurs.edges.length} compteur{edl.compteurs.edges.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      🔑 {edl.cles.edges.length} clé{edl.cles.edges.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                {(() => {
                  const piecesAvecDeg = edl.pieces.edges
                    .map(({ node: piece }) => ({
                      nom: piece.nom,
                      elements: piece.elements.edges
                        .filter(({ node: el }) => el.degradations && el.degradations.length > 0)
                        .map(({ node: el }) => el),
                    }))
                    .filter(p => p.elements.length > 0);

                  const totalDeg = piecesAvecDeg.reduce((sum, p) =>
                    sum + p.elements.reduce((s, el) => s + (el.degradations?.length ?? 0), 0), 0);

                  if (totalDeg === 0) return null;
                  return (
                    <View className="mt-3">
                      <View className="bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-2">
                        <Text className="text-xs text-red-600 dark:text-red-400 font-medium">
                          ⚠️ {totalDeg} dégradation{totalDeg > 1 ? 's' : ''} constatée{totalDeg > 1 ? 's' : ''}
                        </Text>
                      </View>

                      {piecesAvecDeg.map(piece => (
                        <View key={piece.nom} className="mt-2">
                          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {piece.nom}
                          </Text>
                          {piece.elements.map(el => (
                            <View key={el.id} className="flex-row items-start ml-2 mb-1">
                              <Text className="text-xs text-gray-400 mr-1">•</Text>
                              <View className="flex-1">
                                <View className="flex-row items-center gap-2 flex-wrap">
                                  <Text className="text-sm text-gray-600 dark:text-gray-300">{el.nom}</Text>
                                  <Badge
                                    label={ELEMENT_ETAT_LABELS[el.etat as ElementEtat] || el.etat}
                                    variant={el.etat === 'hors_service' ? 'red' : el.etat === 'mauvais' ? 'red' : 'amber'}
                                  />
                                </View>
                                <Text className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                                  {el.degradations!.join(', ')}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </View>
            )}
          </Card>
        )}

        {/* Bailleur Signature */}
        <SignatureBox
          title="Signature du bailleur"
          icon={<User size={20} color={COLORS.primary[600]} />}
          signatureRef={bailleurRef}
          signature={signatureBailleur}
          isSaved={bailleurSaved}
          onOK={handleBailleurOK}
          onClear={() => {
            setSignatureBailleur(null);
            setBailleurSaved(false);
          }}
          onSave={handleSaveBailleur}
        />

        {/* Signature locataire en face à face */}
        {bailleurSaved && (
          <SignatureBox
            title="Signature du locataire"
            icon={<Users size={20} color={COLORS.amber[600]} />}
            signatureRef={locataireRef}
            signature={signatureLocataire}
            isSaved={locataireSaved}
            onOK={handleLocataireOK}
            onClear={() => {
              setSignatureLocataire(null);
              setLocataireSaved(false);
            }}
            onSave={handleSaveLocataire}
          />
        )}

        {/* Recap */}
        <Card>
          <Text className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Récapitulatif</Text>
          <View className="space-y-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600 dark:text-gray-300">Bailleur</Text>
              {bailleurSaved ? (
                <View className="flex-row items-center">
                  <Check size={16} color={COLORS.green[600]} />
                  <Text className="text-green-600 ml-1 text-sm">Signé</Text>
                </View>
              ) : (
                <Text className="text-gray-400 text-sm">En attente</Text>
              )}
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-gray-600 dark:text-gray-300">Locataire</Text>
              <Text className="text-gray-400 text-sm">En attente</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
