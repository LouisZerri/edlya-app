import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Trash2, DoorOpen } from 'lucide-react-native';
import { Card, Badge } from '../ui';
import { DonneesExtraites } from '../../hooks/usePdfImport';
import { COLORS } from '../../utils/constants';
import { ImportPhotoThumbnails } from './ImportPhotoThumbnails';

const ETAT_OPTIONS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'tres_bon', label: 'Très bon' },
  { value: 'bon', label: 'Bon' },
  { value: 'usage', label: 'Usagé' },
  { value: 'mauvais', label: 'Mauvais' },
  { value: 'hors_service', label: 'Hors service' },
];

const ETAT_COLORS: Record<string, string> = {
  neuf: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  tres_bon: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
  bon: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
  usage: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
  mauvais: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
  hors_service: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
};

interface ImportPreviewPiecesProps {
  extractedData: DonneesExtraites;
  isEditing: boolean;
  expandedPieces: number[];
  togglePiece: (idx: number) => void;
  updatePiece: (pieceIdx: number, field: string, value: string) => void;
  updateElement: (pieceIdx: number, elIdx: number, field: string, value: string) => void;
  removePiece: (pieceIdx: number) => void;
  removeElement: (pieceIdx: number, elIdx: number) => void;
  importId: string | null;
  token: string | null;
}

export const ImportPreviewPieces = React.memo(function ImportPreviewPieces({
  extractedData,
  isEditing,
  expandedPieces,
  togglePiece,
  updatePiece,
  updateElement,
  removePiece,
  removeElement,
  importId,
  token,
}: ImportPreviewPiecesProps) {
  if (!extractedData.pieces || extractedData.pieces.length === 0) return null;

  return (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        <DoorOpen size={20} color={COLORS.green[600]} />
        <Text className="font-semibold text-gray-800 dark:text-gray-200 ml-2">
          Pièces ({extractedData.pieces.length})
        </Text>
      </View>
      {extractedData.pieces.map((piece, idx) => {
        const isExpanded = expandedPieces.includes(idx);
        return (
          <View key={idx} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
            <TouchableOpacity
              onPress={() => togglePiece(idx)}
              className="py-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 gap-2">
                {isEditing ? (
                  <TextInput
                    value={piece.nom}
                    onChangeText={(t) => updatePiece(idx, 'nom', t)}
                    className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 text-base font-medium"
                    style={{ includeFontPadding: false }}
                    onTouchStart={(e) => e.stopPropagation()}
                  />
                ) : (
                  <Text className="text-gray-700 dark:text-gray-200 font-medium">{piece.nom}</Text>
                )}
                <Badge label={`${piece.elements.length}`} variant="gray" />
              </View>
              <View className="flex-row items-center ml-2">
                {isEditing && (
                  <TouchableOpacity onPress={() => removePiece(idx)} className="p-1 mr-1">
                    <Trash2 size={16} color={COLORS.red[500]} />
                  </TouchableOpacity>
                )}
                {isExpanded ? (
                  <ChevronUp size={18} color={COLORS.gray[400]} />
                ) : (
                  <ChevronDown size={18} color={COLORS.gray[400]} />
                )}
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View className="pl-3 pb-2">
                {piece.elements.map((el, elIdx) => (
                  <View key={elIdx} className="py-3 border-t border-gray-100 dark:border-gray-700">
                    {isEditing ? (
                      <View>
                        {/* Nom + supprimer */}
                        <View className="flex-row items-center mb-2">
                          <TextInput
                            value={el.nom}
                            onChangeText={(t) => updateElement(idx, elIdx, 'nom', t)}
                            className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800"
                            style={{ includeFontPadding: false }}
                            placeholderTextColor="#9CA3AF"
                          />
                          <TouchableOpacity onPress={() => removeElement(idx, elIdx)} className="p-2 ml-2">
                            <Trash2 size={16} color={COLORS.red[500]} />
                          </TouchableOpacity>
                        </View>
                        {/* État */}
                        <View className="flex-row flex-wrap gap-2 mb-3">
                          {ETAT_OPTIONS.map(opt => (
                            <TouchableOpacity
                              key={opt.value}
                              onPress={() => updateElement(idx, elIdx, 'etat', opt.value)}
                              className={`px-3 py-1.5 rounded-lg border ${
                                el.etat === opt.value
                                  ? ETAT_COLORS[opt.value]
                                  : 'border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              <Text className={`text-sm ${el.etat === opt.value
                                ? 'font-medium text-gray-800 dark:text-gray-200'
                                : 'text-gray-500 dark:text-gray-400'}`}>
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        {/* Observations */}
                        <TextInput
                          value={el.observations || ''}
                          onChangeText={(t) => updateElement(idx, elIdx, 'observations', t)}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800"
                          style={{ includeFontPadding: false }}
                          placeholder="Observations..."
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    ) : (
                      <View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-600 dark:text-gray-300 text-sm flex-1">{el.nom}</Text>
                          <Badge
                            label={ETAT_OPTIONS.find(o => o.value === el.etat)?.label || el.etat}
                            variant={
                              el.etat === 'bon' || el.etat === 'neuf' || el.etat === 'tres_bon' ? 'green' :
                              el.etat === 'mauvais' || el.etat === 'hors_service' ? 'red' : 'amber'
                            }
                          />
                        </View>
                        {el.observations && (
                          <Text className="text-gray-400 text-sm mt-1">{el.observations}</Text>
                        )}
                        {el.photo_indices && el.photo_indices.length > 0 && importId && (
                          <ImportPhotoThumbnails photoIndices={el.photo_indices} importId={importId} token={token} />
                        )}
                      </View>
                    )}
                  </View>
                ))}
                {!isEditing && piece.photo_indices && piece.photo_indices.length > 0 && importId && (
                  <View className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <ImportPhotoThumbnails photoIndices={piece.photo_indices} importId={importId} token={token} />
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </Card>
  );
});
