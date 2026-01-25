import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import SignatureScreen from 'react-native-signature-canvas';
import { Check, Trash2 } from 'lucide-react-native';
import { Header, Card, Button } from '../../../components/ui';
import { COLORS } from '../../../utils/constants';

export default function SignatureEdlScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const bailleurRef = useRef<any>(null);
  const locataireRef = useRef<any>(null);

  const [signatureBailleur, setSignatureBailleur] = useState<string | null>(null);
  const [signatureLocataire, setSignatureLocataire] = useState<string | null>(null);

  const handleBailleurOK = (signature: string) => {
    setSignatureBailleur(signature);
  };

  const handleLocataireOK = (signature: string) => {
    setSignatureLocataire(signature);
  };

  const handleFinalize = async () => {
    if (!signatureBailleur || !signatureLocataire) {
      return;
    }

    setLoading(true);
    try {
      // API call to save signatures
      router.back();
    } catch (error) {
      console.error('Error saving signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const SignatureBox = ({
    title,
    signatureRef,
    signature,
    onOK,
    onClear,
  }: {
    title: string;
    signatureRef: any;
    signature: string | null;
    onOK: (sig: string) => void;
    onClear: () => void;
  }) => (
    <Card className="mb-4">
      <Text className="text-base font-semibold text-gray-800 mb-3">{title}</Text>

      <View className="h-40 border border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
        {signature ? (
          <View className="flex-1 items-center justify-center bg-green-50">
            <Check size={32} color={COLORS.green[600]} />
            <Text className="text-green-600 font-medium mt-2">Signature enregistree</Text>
          </View>
        ) : (
          <SignatureScreen
            ref={signatureRef}
            onOK={onOK}
            descriptionText=""
            clearText="Effacer"
            confirmText="Valider"
            webStyle={`
              .m-signature-pad { box-shadow: none; border: none; }
              .m-signature-pad--body { border: none; }
              .m-signature-pad--footer { display: none; }
            `}
          />
        )}
      </View>

      <View className="flex-row gap-3 mt-3">
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

        {!signature && (
          <TouchableOpacity
            onPress={() => signatureRef.current?.readSignature()}
            className="flex-1 flex-row items-center justify-center py-2.5 bg-primary-600 rounded-lg"
          >
            <Check size={18} color="white" />
            <Text className="text-white font-medium ml-2">Valider</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header title="Signatures" showBack />

      <ScrollView className="flex-1 p-4">
        <SignatureBox
          title="Signature du bailleur"
          signatureRef={bailleurRef}
          signature={signatureBailleur}
          onOK={handleBailleurOK}
          onClear={() => setSignatureBailleur(null)}
        />

        <SignatureBox
          title="Signature du locataire"
          signatureRef={locataireRef}
          signature={signatureLocataire}
          onOK={handleLocataireOK}
          onClear={() => setSignatureLocataire(null)}
        />
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100">
        <Button
          label="Finaliser et signer"
          onPress={handleFinalize}
          loading={loading}
          fullWidth
          variant="success"
          disabled={!signatureBailleur || !signatureLocataire}
          icon={<Check size={20} color="white" />}
        />
      </View>
    </SafeAreaView>
  );
}
