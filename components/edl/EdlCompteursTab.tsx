import { View, Text, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Card, Input } from '../ui';
import { PhotoGallery } from '../photo';
import { COMPTEUR_CONFIG, CompteurType, LocalPhoto } from '../../types';
import { CompteurNode } from '../../types/graphql';
import { COLORS } from '../../utils/constants';

interface EdlCompteursTabProps {
  localCompteurs: CompteurNode[];
  compteurValues: Record<string, string>;
  setCompteurValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compteurPhotos: Record<string, LocalPhoto[]>;
  setCompteurPhotos: React.Dispatch<React.SetStateAction<Record<string, LocalPhoto[]>>>;
  onDeleteCompteur: (compteurId: string, label: string) => void;
  onAddCompteur: (type: CompteurType) => void;
}

export function EdlCompteursTab({
  localCompteurs,
  compteurValues,
  setCompteurValues,
  compteurPhotos,
  setCompteurPhotos,
  onDeleteCompteur,
  onAddCompteur,
}: EdlCompteursTabProps) {
  return (
    <View className="p-4">
      <View className="flex-row flex-wrap gap-3">
        {localCompteurs.map((compteur) => {
          const config = COMPTEUR_CONFIG[compteur.type as keyof typeof COMPTEUR_CONFIG];
          return (
            <View key={compteur.id} className="w-[48%]">
              <Card>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Text className="text-xl">{config?.icon || '📊'}</Text>
                    <Text className="text-sm font-medium text-gray-700 ml-2">
                      {config?.label || compteur.type}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onDeleteCompteur(compteur.id, config?.label || compteur.type)}
                    className="p-1"
                  >
                    <Trash2 size={16} color={COLORS.red[500]} />
                  </TouchableOpacity>
                </View>
                <Input
                  label="Index"
                  value={compteurValues[compteur.id] || ''}
                  onChangeText={(text) =>
                    setCompteurValues(prev => ({ ...prev, [compteur.id]: text }))
                  }
                  keyboardType="numeric"
                />
                <View className="mt-2">
                  <PhotoGallery
                    photos={compteurPhotos[compteur.id] || []}
                    onPhotosChange={(photos) =>
                      setCompteurPhotos(prev => ({ ...prev, [compteur.id]: photos }))
                    }
                    elementId={compteur.id}
                    maxPhotos={2}
                    thumbnailSize="small"
                    uploadType="compteur"
                  />
                </View>
              </Card>
            </View>
          );
        })}
      </View>

      {localCompteurs.length === 0 && (
        <Card className="mb-4">
          <Text className="text-gray-500 text-center py-4">
            Aucun compteur configure
          </Text>
        </Card>
      )}

      <Text className="text-sm font-medium text-gray-700 mb-2 mt-4">Ajouter un compteur</Text>
      <View className="flex-row flex-wrap gap-2">
        {(Object.keys(COMPTEUR_CONFIG) as CompteurType[]).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => onAddCompteur(type)}
            className="bg-gray-100 rounded-lg px-3 py-2 flex-row items-center"
          >
            <Text className="mr-1">{COMPTEUR_CONFIG[type].icon}</Text>
            <Text className="text-gray-700 text-sm">{COMPTEUR_CONFIG[type].label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
