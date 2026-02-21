import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Trash2, Zap } from 'lucide-react-native';
import { Card } from '../ui';
import { DonneesExtraites } from '../../hooks/usePdfImport';
import { COLORS } from '../../utils/constants';
import { COMPTEUR_CONFIG, CompteurType } from '../../types';
import { ImportPhotoThumbnails } from './ImportPhotoThumbnails';

interface ImportPreviewCompteursProps {
  extractedData: DonneesExtraites;
  isEditing: boolean;
  onUpdate: (updater: (data: DonneesExtraites) => DonneesExtraites) => void;
  removeCompteur: (idx: number) => void;
  importId: string | null;
  token: string | null;
}

export function ImportPreviewCompteurs({
  extractedData,
  isEditing,
  onUpdate,
  removeCompteur,
  importId,
  token,
}: ImportPreviewCompteursProps) {
  if (!extractedData.compteurs || extractedData.compteurs.length === 0) return null;

  return (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        <Zap size={20} color={COLORS.amber[500]} />
        <Text className="font-semibold text-gray-800 dark:text-gray-200 ml-2">
          Compteurs ({extractedData.compteurs.length})
        </Text>
      </View>
      {extractedData.compteurs.map((compteur, idx) => {
        const config = COMPTEUR_CONFIG[compteur.type as CompteurType];
        return (
          <View key={idx} className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            {isEditing ? (
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2">{config?.icon || '📊'}</Text>
                    <Text className="text-gray-700 dark:text-gray-200 font-medium">
                      {config?.label || compteur.type}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeCompteur(idx)} className="p-1">
                    <Trash2 size={16} color={COLORS.red[500]} />
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">N° compteur</Text>
                    <TextInput
                      value={compteur.numero || ''}
                      onChangeText={(t) => onUpdate(d => {
                        const compteurs = [...(d.compteurs || [])];
                        compteurs[idx] = { ...compteurs[idx], numero: t };
                        return { ...d, compteurs };
                      })}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800"
                      style={{ includeFontPadding: false, height: 44, textAlignVertical: 'center', fontSize: 16 }}
                      placeholder="09 435 672 108"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Relevé</Text>
                    <TextInput
                      value={compteur.index || ''}
                      onChangeText={(t) => onUpdate(d => {
                        const compteurs = [...(d.compteurs || [])];
                        compteurs[idx] = { ...compteurs[idx], index: t };
                        return { ...d, compteurs };
                      })}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800"
                      style={{ includeFontPadding: false, height: 44, textAlignVertical: 'center', fontSize: 16 }}
                      placeholder="00000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2">{config?.icon || '📊'}</Text>
                    <Text className="text-gray-700 dark:text-gray-200 font-medium">
                      {config?.label || compteur.type}
                    </Text>
                  </View>
                  {compteur.index && (
                    <Text className="text-gray-500 dark:text-gray-400 text-sm font-mono">{compteur.index}</Text>
                  )}
                </View>
                {compteur.numero && (
                  <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1 ml-8">N° {compteur.numero}</Text>
                )}
              </View>
            )}
            {!isEditing && compteur.photo_indices && compteur.photo_indices.length > 0 && importId && (
              <View className="mt-2">
                <ImportPhotoThumbnails photoIndices={compteur.photo_indices} importId={importId} token={token} />
              </View>
            )}
          </View>
        );
      })}
    </Card>
  );
}
