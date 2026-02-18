import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Trash2, Sparkles } from 'lucide-react-native';
import { Select, InputWithVoice, AideTooltip } from '../ui';
import { PhotoGallery } from '../photo';
import { ElementType, ElementEtat, LocalPhoto, ELEMENT_TYPE_LABELS, ELEMENT_ETAT_LABELS } from '../../types';
import { ElementNode } from '../../types/graphql';
import { COLORS } from '../../utils/constants';
import { DEGRADATIONS_SUGGESTIONS } from '../../utils/degradations';

const etatOptions = Object.entries(ELEMENT_ETAT_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface ElementCardProps {
  element: ElementNode;
  pieceId: string;
  elementStates: Record<string, ElementEtat>;
  setElementStates: React.Dispatch<React.SetStateAction<Record<string, ElementEtat>>>;
  elementObservations: Record<string, string>;
  setElementObservations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  elementDegradations: Record<string, string[]>;
  toggleDegradation: (elementId: string, degradation: string) => void;
  addCustomDegradation: (elementId: string) => void;
  elementPhotos: Record<string, LocalPhoto[]>;
  setElementPhotos: React.Dispatch<React.SetStateAction<Record<string, LocalPhoto[]>>>;
  isAnalyzing: boolean;
  onAnalyze: (element: ElementNode) => void;
  onDelete: (elementId: string, elementName: string, pieceId: string) => void;
}

export const ElementCard = React.memo(function ElementCard({
  element,
  pieceId,
  elementStates,
  setElementStates,
  elementObservations,
  setElementObservations,
  elementDegradations,
  toggleDegradation,
  addCustomDegradation,
  elementPhotos,
  setElementPhotos,
  isAnalyzing,
  onAnalyze,
  onDelete,
}: ElementCardProps) {
  const suggestions = DEGRADATIONS_SUGGESTIONS[element.type] || DEGRADATIONS_SUGGESTIONS.autre;
  const currentDegradations = Array.isArray(elementDegradations[element.id])
    ? elementDegradations[element.id]
    : [];

  return (
    <View className="py-3 border-t border-gray-100">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="font-medium text-gray-900">{element.nom}</Text>
          <Text className="text-xs text-gray-400">
            {ELEMENT_TYPE_LABELS[element.type as ElementType] || element.type}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(element.id, element.nom, pieceId)}
          className="p-2"
        >
          <Trash2 size={16} color={COLORS.red[500]} />
        </TouchableOpacity>
      </View>

      <Select
        label="État"
        value={elementStates[element.id] || element.etat}
        options={etatOptions}
        onChange={(value) =>
          setElementStates(prev => ({
            ...prev,
            [element.id]: value as ElementEtat,
          }))
        }
      />

      {/* Dégradations */}
      <View className="mt-3">
        <Text className="text-sm font-medium text-gray-700 mb-2">Dégradations</Text>
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((deg) => (
            <TouchableOpacity
              key={deg}
              onPress={() => toggleDegradation(element.id, deg)}
              className={`px-3 py-1.5 rounded-full border ${
                currentDegradations.includes(deg)
                  ? 'bg-red-100 border-red-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text
                className={`text-xs ${
                  currentDegradations.includes(deg)
                    ? 'text-red-700 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {deg}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => addCustomDegradation(element.id)}
            className="px-3 py-1.5 rounded-full border border-dashed border-gray-300 bg-white"
          >
            <Text className="text-xs text-gray-500">+ Autre</Text>
          </TouchableOpacity>
        </View>
        {currentDegradations.filter(d => !suggestions.includes(d)).length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-2">
            {currentDegradations
              .filter(d => !suggestions.includes(d))
              .map((deg) => (
                <TouchableOpacity
                  key={deg}
                  onPress={() => toggleDegradation(element.id, deg)}
                  className="px-3 py-1.5 rounded-full bg-red-100 border border-red-300"
                >
                  <Text className="text-xs text-red-700 font-medium">{deg}</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </View>

      {/* Observations + Aide IA */}
      <View className="mt-3">
        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <InputWithVoice
              label="Observations"
              value={elementObservations[element.id] || ''}
              onChangeText={(text) =>
                setElementObservations(prev => ({ ...prev, [element.id]: text }))
              }
              placeholder="Dictez ou saisissez..."
              numberOfLines={2}
            />
          </View>
          <View className="mb-4">
            <AideTooltip
              element={element.nom}
              etat={elementStates[element.id] || element.etat}
              observation={elementObservations[element.id]}
              degradations={currentDegradations}
              onApply={(text) =>
                setElementObservations(prev => ({ ...prev, [element.id]: text }))
              }
            />
          </View>
        </View>
      </View>

      {/* Photos */}
      <View className="mt-2">
        <PhotoGallery
          photos={elementPhotos[element.id] || []}
          onPhotosChange={(photos) =>
            setElementPhotos(prev => ({ ...prev, [element.id]: photos }))
          }
          elementId={element.id}
          maxPhotos={5}
          thumbnailSize="medium"
        />
      </View>

      {/* Bouton Analyse IA */}
      {(elementPhotos[element.id]?.length || 0) > 0 && (
        <TouchableOpacity
          onPress={() => onAnalyze(element)}
          disabled={isAnalyzing}
          className={`mt-3 flex-row items-center justify-center py-2.5 rounded-lg ${
            isAnalyzing ? 'bg-gray-100' : 'bg-purple-50 border border-purple-200'
          }`}
        >
          <Sparkles size={16} color={isAnalyzing ? COLORS.gray[400] : '#9333EA'} />
          <Text className={`ml-2 font-medium ${
            isAnalyzing ? 'text-gray-400' : 'text-purple-700'
          }`}>
            {isAnalyzing ? 'Analyse en cours...' : 'Analyser avec IA'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});
