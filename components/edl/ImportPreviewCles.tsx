import { View, Text, TouchableOpacity } from 'react-native';
import { Trash2, Key } from 'lucide-react-native';
import { Card, Badge } from '../ui';
import { DonneesExtraites } from '../../hooks/usePdfImport';
import { COLORS } from '../../utils/constants';
import { CLE_LABELS, CleType } from '../../types';
import { ImportPhotoThumbnails } from './ImportPhotoThumbnails';

interface ImportPreviewClesProps {
  extractedData: DonneesExtraites;
  isEditing: boolean;
  onUpdate: (updater: (data: DonneesExtraites) => DonneesExtraites) => void;
  removeCle: (idx: number) => void;
  importId: string | null;
  token: string | null;
}

export function ImportPreviewCles({
  extractedData,
  isEditing,
  onUpdate,
  removeCle,
  importId,
  token,
}: ImportPreviewClesProps) {
  if (!extractedData.cles || extractedData.cles.length === 0) return null;

  return (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        <Key size={20} color={COLORS.gray[600]} />
        <Text className="font-semibold text-gray-800 dark:text-gray-200 ml-2">
          Clés ({extractedData.cles.reduce((sum, c) => sum + c.nombre, 0)})
        </Text>
      </View>
      {extractedData.cles.map((cle, idx) => (
        <View key={idx} className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-700 dark:text-gray-200">{CLE_LABELS[cle.type as CleType] || cle.type}</Text>
            {isEditing ? (
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => onUpdate(d => {
                    const cles = [...(d.cles || [])];
                    cles[idx] = { ...cles[idx], nombre: Math.max(0, cle.nombre - 1) };
                    return { ...d, cles };
                  })}
                  className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded items-center justify-center"
                >
                  <Text className="text-gray-600 dark:text-gray-300 font-bold">-</Text>
                </TouchableOpacity>
                <Text className="mx-3 font-bold text-gray-800 dark:text-gray-200">{cle.nombre}</Text>
                <TouchableOpacity
                  onPress={() => onUpdate(d => {
                    const cles = [...(d.cles || [])];
                    cles[idx] = { ...cles[idx], nombre: cle.nombre + 1 };
                    return { ...d, cles };
                  })}
                  className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded items-center justify-center"
                >
                  <Text className="text-primary-600 dark:text-primary-400 font-bold">+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeCle(idx)} className="p-1 ml-2">
                  <Trash2 size={16} color={COLORS.red[500]} />
                </TouchableOpacity>
              </View>
            ) : (
              <Badge label={`x${cle.nombre}`} variant="gray" />
            )}
          </View>
          {!isEditing && cle.photo_indices && cle.photo_indices.length > 0 && importId && (
            <ImportPhotoThumbnails photoIndices={cle.photo_indices} importId={importId} token={token} />
          )}
        </View>
      ))}
    </Card>
  );
}
