import { View, Text, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Card, RemoteThumbnail } from '../ui';
import { CLE_LABELS, CleType } from '../../types';
import { CleNode } from '../../types/graphql';
import { COLORS, BASE_URL, UPLOADS_URL } from '../../utils/constants';

interface EdlClesTabProps {
  localCles: CleNode[];
  cleValues: Record<string, number>;
  setCleValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onDeleteCle: (cleId: string, label: string) => void;
  onAddCle: (type: CleType) => void;
}

export function EdlClesTab({
  localCles,
  cleValues,
  setCleValues,
  onDeleteCle,
  onAddCle,
}: EdlClesTabProps) {
  return (
    <View className="p-4">
      {localCles.map((cle) => {
        const cleLabel = CLE_LABELS[cle.type as keyof typeof CLE_LABELS] || cle.type;
        return (
          <Card key={cle.id} className="mb-3">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🔑</Text>
              <View className="flex-1">
                <Text className="font-medium text-gray-900 dark:text-gray-100">{cleLabel}</Text>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() =>
                    setCleValues(prev => ({
                      ...prev,
                      [cle.id]: Math.max(0, (prev[cle.id] || 0) - 1),
                    }))
                  }
                  className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg items-center justify-center"
                >
                  <Text className="text-lg font-bold text-gray-600 dark:text-gray-300">-</Text>
                </TouchableOpacity>
                <Text className="mx-4 text-lg font-bold text-gray-900 dark:text-gray-100">
                  {cleValues[cle.id] || 0}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setCleValues(prev => ({
                      ...prev,
                      [cle.id]: (prev[cle.id] || 0) + 1,
                    }))
                  }
                  className="w-10 h-10 bg-primary-100 rounded-lg items-center justify-center"
                >
                  <Text className="text-lg font-bold text-primary-600">+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDeleteCle(cle.id, cleLabel)}
                  className="ml-3 p-2"
                >
                  <Trash2 size={18} color={COLORS.red[500]} />
                </TouchableOpacity>
              </View>
            </View>
            {cle.photo && (
              <View className="mt-2">
                <RemoteThumbnail
                  source={{
                    uri: cle.photo.startsWith('http')
                      ? cle.photo
                      : cle.photo.startsWith('/')
                        ? `${BASE_URL}${cle.photo}`
                        : `${UPLOADS_URL}/${cle.photo}`,
                  }}
                  size={80}
                  borderRadius={8}
                />
              </View>
            )}
          </Card>
        );
      })}

      {localCles.length === 0 && (
        <Card className="mb-4">
          <Text className="text-gray-500 dark:text-gray-400 text-center py-4">
            Aucune clé configurée
          </Text>
        </Card>
      )}

      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">Ajouter une clé</Text>
      <View className="flex-row flex-wrap gap-2">
        {(Object.keys(CLE_LABELS) as CleType[]).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => onAddCle(type)}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 flex-row items-center"
          >
            <Text className="mr-1">🔑</Text>
            <Text className="text-gray-700 dark:text-gray-300 text-sm">{CLE_LABELS[type]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
