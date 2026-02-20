import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Card } from '../ui';
import { PhotoGallery } from '../photo';
import { COMPTEUR_CONFIG, CompteurType, LocalPhoto } from '../../types';
import { CompteurNode } from '../../types/graphql';
import { COLORS, DARK_COLORS } from '../../utils/constants';

interface EdlCompteursTabProps {
  localCompteurs: CompteurNode[];
  compteurValues: Record<string, string>;
  setCompteurValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compteurNumeros: Record<string, string>;
  setCompteurNumeros: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compteurComments: Record<string, string>;
  setCompteurComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compteurPhotos: Record<string, LocalPhoto[]>;
  setCompteurPhotos: React.Dispatch<React.SetStateAction<Record<string, LocalPhoto[]>>>;
  onDeleteCompteur: (compteurId: string, label: string) => void;
  onAddCompteur: (type: CompteurType) => void;
}

export function EdlCompteursTab({
  localCompteurs,
  compteurValues,
  setCompteurValues,
  compteurNumeros,
  setCompteurNumeros,
  compteurComments,
  setCompteurComments,
  compteurPhotos,
  setCompteurPhotos,
  onDeleteCompteur,
  onAddCompteur,
}: EdlCompteursTabProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const darkInput = isDark ? { backgroundColor: DARK_COLORS.inputBg, borderColor: DARK_COLORS.inputBorder, color: DARK_COLORS.text } : {};

  return (
    <View className="p-4">
      {localCompteurs.map((compteur) => {
        const config = COMPTEUR_CONFIG[compteur.type as keyof typeof COMPTEUR_CONFIG];
        return (
          <Card key={compteur.id} className="mb-3">
            {/* Header : icône + label + delete */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center mr-2.5">
                  <Text className="text-lg">{config?.icon || '📊'}</Text>
                </View>
                <Text className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  {config?.label || compteur.type}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onDeleteCompteur(compteur.id, config?.label || compteur.type)}
                className="p-1.5"
              >
                <Trash2 size={16} color={COLORS.red[500]} />
              </TouchableOpacity>
            </View>

            {/* N° compteur + Relevé côte à côte */}
            <View className="flex-row gap-3 mb-2">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">N° compteur</Text>
                <TextInput
                  value={compteurNumeros[compteur.id] || ''}
                  onChangeText={(text) =>
                    setCompteurNumeros(prev => ({ ...prev, [compteur.id]: text }))
                  }
                  placeholder="09 435 672 108"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, darkInput]}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Relevé</Text>
                <TextInput
                  value={compteurValues[compteur.id] || ''}
                  onChangeText={(text) =>
                    setCompteurValues(prev => ({ ...prev, [compteur.id]: text }))
                  }
                  placeholder="00000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  style={[styles.input, darkInput]}
                />
              </View>
            </View>

            {/* Observations */}
            <View className="mb-2">
              <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Observations</Text>
              <TextInput
                value={compteurComments[compteur.id] || ''}
                onChangeText={(text) =>
                  setCompteurComments(prev => ({ ...prev, [compteur.id]: text }))
                }
                placeholder="Emplacement, état, remarques..."
                placeholderTextColor="#9CA3AF"
                multiline
                style={[styles.input, styles.multiline, darkInput]}
              />
            </View>

            {/* Photos */}
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
          </Card>
        );
      })}

      {localCompteurs.length === 0 && (
        <Card className="mb-4">
          <Text className="text-gray-500 dark:text-gray-400 text-center py-4">
            Aucun compteur configuré
          </Text>
        </Card>
      )}

      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">Ajouter un compteur</Text>
      <View className="flex-row flex-wrap gap-2">
        {(Object.keys(COMPTEUR_CONFIG) as CompteurType[]).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => onAddCompteur(type)}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 flex-row items-center"
          >
            <Text className="mr-1">{COMPTEUR_CONFIG[type].icon}</Text>
            <Text className="text-gray-700 dark:text-gray-300 text-sm">{COMPTEUR_CONFIG[type].label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'center',
  },
  multiline: {
    height: undefined,
    minHeight: 36,
    maxHeight: 80,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'top',
  },
});
