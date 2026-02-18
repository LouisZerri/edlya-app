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
  neuf: 'bg-green-100 border-green-300',
  tres_bon: 'bg-green-50 border-green-200',
  bon: 'bg-blue-50 border-blue-200',
  usage: 'bg-amber-50 border-amber-200',
  mauvais: 'bg-red-50 border-red-200',
  hors_service: 'bg-red-100 border-red-300',
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

export function ImportPreviewPieces({
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
        <Text className="font-semibold text-gray-800 ml-2">
          Pièces ({extractedData.pieces.length})
        </Text>
      </View>
      {extractedData.pieces.map((piece, idx) => {
        const isExpanded = expandedPieces.includes(idx);
        return (
          <View key={idx} className="border-b border-gray-100 last:border-0">
            <TouchableOpacity
              onPress={() => togglePiece(idx)}
              className="py-2.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                {isEditing ? (
                  <TextInput
                    value={piece.nom}
                    onChangeText={(t) => updatePiece(idx, 'nom', t)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 bg-white text-sm"
                    onTouchStart={(e) => e.stopPropagation()}
                  />
                ) : (
                  <Text className="text-gray-700 font-medium">{piece.nom}</Text>
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
                  <View key={elIdx} className="py-1.5 border-t border-gray-50">
                    <View className="flex-row items-center justify-between">
                      {isEditing ? (
                        <TextInput
                          value={el.nom}
                          onChangeText={(t) => updateElement(idx, elIdx, 'nom', t)}
                          className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm text-gray-700 bg-white mr-2"
                        />
                      ) : (
                        <Text className="text-gray-600 text-sm flex-1">{el.nom}</Text>
                      )}
                      <View className="flex-row items-center">
                        {isEditing ? (
                          <View className="flex-row flex-wrap gap-1">
                            {ETAT_OPTIONS.map(opt => (
                              <TouchableOpacity
                                key={opt.value}
                                onPress={() => updateElement(idx, elIdx, 'etat', opt.value)}
                                className={`px-2 py-0.5 rounded border ${
                                  el.etat === opt.value
                                    ? ETAT_COLORS[opt.value]
                                    : 'border-gray-200'
                                }`}
                              >
                                <Text className={`text-xs ${el.etat === opt.value ? 'font-medium' : 'text-gray-500'}`}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : (
                          <Badge
                            label={ETAT_OPTIONS.find(o => o.value === el.etat)?.label || el.etat}
                            variant={
                              el.etat === 'bon' || el.etat === 'neuf' || el.etat === 'tres_bon' ? 'green' :
                              el.etat === 'mauvais' || el.etat === 'hors_service' ? 'red' : 'amber'
                            }
                          />
                        )}
                        {isEditing && (
                          <TouchableOpacity onPress={() => removeElement(idx, elIdx)} className="p-1 ml-1">
                            <Trash2 size={14} color={COLORS.red[500]} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {el.observations && !isEditing && (
                      <Text className="text-gray-400 text-xs mt-0.5">{el.observations}</Text>
                    )}
                    {isEditing && (
                      <TextInput
                        value={el.observations || ''}
                        onChangeText={(t) => updateElement(idx, elIdx, 'observations', t)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 bg-white mt-1"
                        placeholder="Observations..."
                      />
                    )}
                    {!isEditing && el.photo_indices && el.photo_indices.length > 0 && importId && (
                      <ImportPhotoThumbnails photoIndices={el.photo_indices} importId={importId} token={token} />
                    )}
                  </View>
                ))}
                {!isEditing && piece.photo_indices && piece.photo_indices.length > 0 && importId && (
                  <View className="pt-2 border-t border-gray-100">
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
}
