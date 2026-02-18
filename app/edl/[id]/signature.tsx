import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useQuery } from '@apollo/client/react';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Check, Trash2, User, Users } from 'lucide-react-native';
import { Header, Card, Button } from '../../../components/ui';
import { COLORS, API_URL } from '../../../utils/constants';
import { GET_ETAT_DES_LIEUX } from '../../../graphql/queries/edl';
import { useToastStore } from '../../../stores/toastStore';
import { useAuthStore } from '../../../stores/authStore';

// Types GraphQL
interface EtatDesLieuxData {
  etatDesLieux: {
    id: string;
    type: string;
    statut: string;
    locataireNom: string;
    locataireEmail?: string;
    locataireTelephone?: string;
    signatureBailleur?: string;
    signatureLocataire?: string;
    dateSignatureBailleur?: string;
    dateSignatureLocataire?: string;
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
  const { success, error: showError } = useToastStore();
  const token = useAuthStore(state => state.token);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const isSigningRef = useRef(false);

  const bailleurRef = useRef<SignatureViewRef>(null);

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
        throw new Error(errorData.message || `Erreur ${response.status}`);
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
      showError('La signature locataire doit être faite via le lien envoyé par email');
      setLoading(false);
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendLink = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/edl/${id}/signature/envoyer-lien`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      success('Lien de signature envoyé au locataire !');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
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
    isLocataire = false,
  }: {
    title: string;
    icon: React.ReactNode;
    signatureRef: React.RefObject<SignatureViewRef | null>;
    signature: string | null;
    isSaved: boolean;
    onOK: (sig: string) => void;
    onClear: () => void;
    onSave: () => void;
    isLocataire?: boolean;
  }): React.ReactElement => (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        {icon}
        <Text className="text-base font-semibold text-gray-800 ml-2">{title}</Text>
        {isSaved && (
          <View className="ml-auto bg-green-100 px-2 py-1 rounded-full">
            <Text className="text-green-700 text-xs font-medium">Enregistrée</Text>
          </View>
        )}
      </View>

      <View className="h-48 border border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
        {isSaved && signature ? (
          <View className="flex-1 bg-gray-50 p-2">
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
            className="flex-1 flex-row items-center justify-center py-2.5 border border-gray-300 rounded-lg"
          >
            <Trash2 size={18} color={COLORS.gray[600]} />
            <Text className="text-gray-700 font-medium ml-2">Effacer</Text>
          </TouchableOpacity>
        )}

        {!signature && !isSaved && (
          <TouchableOpacity
            onPress={() => signatureRef.current?.readSignature()}
            className="flex-1 flex-row items-center justify-center py-2.5 bg-gray-100 rounded-lg"
          >
            <Check size={18} color={COLORS.gray[700]} />
            <Text className="text-gray-700 font-medium ml-2">Valider</Text>
          </TouchableOpacity>
        )}

        {signature && !isSaved && !isLocataire && (
          <TouchableOpacity
            onPress={onSave}
            disabled={loading}
            className="flex-1 flex-row items-center justify-center py-2.5 bg-green-600 rounded-lg"
          >
            <Check size={18} color="white" />
            <Text className="text-white font-medium ml-2">Enregistrer</Text>
          </TouchableOpacity>
        )}

        {isSaved && (
          <TouchableOpacity
            onPress={() => {
              signatureRef.current?.clearSignature();
              onClear();
            }}
            className="flex-1 flex-row items-center justify-center py-2.5 border border-gray-300 rounded-lg"
          >
            <Trash2 size={18} color={COLORS.gray[600]} />
            <Text className="text-gray-700 font-medium ml-2">Modifier</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const canSendLink = bailleurSaved && !locataireSaved && edl?.locataireEmail;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header title="Signatures" showBack />

      <ScrollView
        ref={scrollRef}
        className="flex-1 p-4"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Info */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <Text className="text-blue-800 text-sm">
            1. Signez en tant que bailleur{'\n'}
            2. Envoyez le lien au locataire par email{'\n'}
            3. Le locataire signe depuis son appareil
          </Text>
        </View>

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

        {/* Send Link Button */}
        {bailleurSaved && !locataireSaved && (
          <Card className="mb-4">
            <View className="flex-row items-center mb-3">
              <Users size={20} color={COLORS.amber[600]} />
              <Text className="text-base font-semibold text-gray-800 ml-2">
                Signature du locataire
              </Text>
            </View>

            {edl?.locataireEmail ? (
              <>
                <Text className="text-gray-600 text-sm mb-3">
                  Un lien de signature sera envoyé à :{'\n'}
                  <Text className="font-medium">{edl.locataireEmail}</Text>
                </Text>
                <Button
                  label="Envoyer le lien au locataire"
                  onPress={handleSendLink}
                  loading={loading}
                  fullWidth
                  variant="primary"
                />
              </>
            ) : (
              <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <Text className="text-amber-800 text-sm">
                  Ajoutez l'email du locataire dans les informations de l'EDL pour pouvoir lui envoyer le lien de signature.
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Locataire Status */}
        {locataireSaved && (
          <Card className="mb-4">
            <View className="flex-row items-center mb-3">
              <Users size={20} color={COLORS.green[600]} />
              <Text className="text-base font-semibold text-gray-800 ml-2">
                Signature du locataire
              </Text>
              <View className="ml-auto bg-green-100 px-2 py-1 rounded-full">
                <Text className="text-green-700 text-xs font-medium">Enregistrée</Text>
              </View>
            </View>
            {signatureLocataire && (
              <View className="h-32 bg-gray-50 rounded-lg p-2">
                <Image
                  source={{ uri: signatureLocataire }}
                  style={{ flex: 1 }}
                  resizeMode="contain"
                />
              </View>
            )}
          </Card>
        )}

        {/* Recap */}
        <Card>
          <Text className="font-semibold text-gray-800 mb-3">Récapitulatif</Text>
          <View className="space-y-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Bailleur</Text>
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
              <Text className="text-gray-600">Locataire</Text>
              {locataireSaved ? (
                <View className="flex-row items-center">
                  <Check size={16} color={COLORS.green[600]} />
                  <Text className="text-green-600 ml-1 text-sm">Signé</Text>
                </View>
              ) : (
                <Text className="text-gray-400 text-sm">En attente</Text>
              )}
            </View>
          </View>
        </Card>
      </ScrollView>

      {bailleurSaved && locataireSaved && (
        <View className="p-4 bg-white border-t border-gray-100">
          <View className="bg-green-50 border border-green-200 rounded-xl p-4 flex-row items-center">
            <Check size={24} color={COLORS.green[600]} />
            <View className="ml-3">
              <Text className="text-green-800 font-semibold">État des lieux signé</Text>
              <Text className="text-green-600 text-sm">Les deux parties ont signé</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
