import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, FileText, Lightbulb } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Header, Card, Button } from '../components/ui';
import { COLORS } from '../utils/constants';

export default function ImportScreen() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0].name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // API call to upload and process PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error importing PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header title="Importer un PDF" showBack />

      <View className="flex-1 p-4">
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
                {selectedFile}
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

        <Card className="mt-6 bg-amber-50 border-amber-200">
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
        </Card>

        <View className="mt-auto">
          <Button
            label="Importer et analyser"
            onPress={handleImport}
            loading={loading}
            fullWidth
            disabled={!selectedFile}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
