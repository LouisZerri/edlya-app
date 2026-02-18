import { View, Text, TextInput } from 'react-native';
import { User } from 'lucide-react-native';
import { Card } from '../ui';
import { DonneesExtraites } from '../../hooks/usePdfImport';
import { COLORS } from '../../utils/constants';

interface ImportPreviewLocataireProps {
  extractedData: DonneesExtraites;
  isEditing: boolean;
  onUpdate: (updater: (data: DonneesExtraites) => DonneesExtraites) => void;
}

export function ImportPreviewLocataire({ extractedData, isEditing, onUpdate }: ImportPreviewLocataireProps) {
  if (!extractedData.locataire) return null;

  return (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        <User size={20} color={COLORS.amber[600]} />
        <Text className="font-semibold text-gray-800 ml-2">Locataire</Text>
      </View>
      {isEditing ? (
        <View>
          <TextInput
            value={extractedData.locataire.nom || ''}
            onChangeText={(t) => onUpdate(d => ({
              ...d, locataire: { ...d.locataire!, nom: t }
            }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white mb-2"
            placeholder="Nom du locataire"
          />
          <TextInput
            value={extractedData.locataire.email || ''}
            onChangeText={(t) => onUpdate(d => ({
              ...d, locataire: { ...d.locataire!, email: t }
            }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white mb-2"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            value={extractedData.locataire.telephone || ''}
            onChangeText={(t) => onUpdate(d => ({
              ...d, locataire: { ...d.locataire!, telephone: t }
            }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white"
            placeholder="Téléphone"
            keyboardType="phone-pad"
          />
        </View>
      ) : (
        <>
          {extractedData.locataire.nom && (
            <Text className="text-gray-700 font-medium">{extractedData.locataire.nom}</Text>
          )}
          {extractedData.locataire.email && (
            <Text className="text-gray-500 text-sm">{extractedData.locataire.email}</Text>
          )}
          {extractedData.locataire.telephone && (
            <Text className="text-gray-500 text-sm">{extractedData.locataire.telephone}</Text>
          )}
        </>
      )}
    </Card>
  );
}
