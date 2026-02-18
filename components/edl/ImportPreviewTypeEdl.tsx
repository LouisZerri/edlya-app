import { View, Text, TouchableOpacity } from 'react-native';
import { Card, Badge } from '../ui';
import { DonneesExtraites } from '../../hooks/usePdfImport';

interface ImportPreviewTypeEdlProps {
  extractedData: DonneesExtraites;
  isEditing: boolean;
  onUpdate: (updater: (data: DonneesExtraites) => DonneesExtraites) => void;
}

export function ImportPreviewTypeEdl({ extractedData, isEditing, onUpdate }: ImportPreviewTypeEdlProps) {
  return (
    <Card className="mb-4">
      <Text className="font-semibold text-gray-800 mb-2">Type d'état des lieux</Text>
      {isEditing ? (
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => onUpdate(d => ({ ...d, type_edl: 'entree' }))}
            className={`flex-1 py-2.5 rounded-lg border items-center ${
              extractedData.type_edl === 'entree' ? 'bg-blue-50 border-blue-400' : 'border-gray-200'
            }`}
          >
            <Text className={extractedData.type_edl === 'entree' ? 'text-blue-700 font-medium' : 'text-gray-600'}>
              Entrée
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onUpdate(d => ({ ...d, type_edl: 'sortie' }))}
            className={`flex-1 py-2.5 rounded-lg border items-center ${
              extractedData.type_edl === 'sortie' ? 'bg-orange-50 border-orange-400' : 'border-gray-200'
            }`}
          >
            <Text className={extractedData.type_edl === 'sortie' ? 'text-orange-700 font-medium' : 'text-gray-600'}>
              Sortie
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Badge
          label={extractedData.type_edl === 'entree' ? 'Entrée' : 'Sortie'}
          variant={extractedData.type_edl === 'entree' ? 'blue' : 'orange'}
        />
      )}
    </Card>
  );
}
