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
        <Text className="font-semibold text-gray-800 ml-2">
          Compteurs ({extractedData.compteurs.length})
        </Text>
      </View>
      {extractedData.compteurs.map((compteur, idx) => (
        <View key={idx} className="py-2 border-b border-gray-100 last:border-0">
          <View className="flex-row items-center justify-between">
            {isEditing ? (
              <>
                <View className="flex-1 mr-2">
                  <Text className="text-gray-700 text-sm font-medium">
                    {COMPTEUR_CONFIG[compteur.type as CompteurType]?.icon} {COMPTEUR_CONFIG[compteur.type as CompteurType]?.label || compteur.type}
                  </Text>
                  <TextInput
                    value={compteur.index || ''}
                    onChangeText={(t) => onUpdate(d => {
                      const compteurs = [...(d.compteurs || [])];
                      compteurs[idx] = { ...compteurs[idx], index: t };
                      return { ...d, compteurs };
                    })}
                    className="border border-gray-200 rounded px-2 py-1 text-sm text-gray-600 bg-white mt-1"
                    placeholder="Index..."
                  />
                </View>
                <TouchableOpacity onPress={() => removeCompteur(idx)} className="p-1">
                  <Trash2 size={16} color={COLORS.red[500]} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="text-gray-700">
                  {COMPTEUR_CONFIG[compteur.type as CompteurType]?.icon} {COMPTEUR_CONFIG[compteur.type as CompteurType]?.label || compteur.type}
                </Text>
                {compteur.index && (
                  <Text className="text-gray-500 text-sm">{compteur.index}</Text>
                )}
              </>
            )}
          </View>
          {!isEditing && compteur.photo_indices && compteur.photo_indices.length > 0 && importId && (
            <ImportPhotoThumbnails photoIndices={compteur.photo_indices} importId={importId} token={token} />
          )}
        </View>
      ))}
    </Card>
  );
}
