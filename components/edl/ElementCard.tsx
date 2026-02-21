import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Trash2, Sparkles, Zap, X } from 'lucide-react-native';
import { Select, InputWithVoice, AideTooltip } from '../ui';
import { PhotoGallery } from '../photo';
import { ElementType, ElementEtat, LocalPhoto, ELEMENT_TYPE_LABELS, ELEMENT_ETAT_LABELS } from '../../types';
import { ElementNode } from '../../types/graphql';
import { COLORS } from '../../utils/constants';
import { DEGRADATIONS_SUGGESTIONS } from '../../utils/degradations';
import { OBSERVATION_SUGGESTIONS } from '../../utils/observationSuggestions';

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
  const observationSuggestions = OBSERVATION_SUGGESTIONS[element.type] || OBSERVATION_SUGGESTIONS.autre;
  const currentDegradations = Array.isArray(elementDegradations[element.id])
    ? elementDegradations[element.id]
    : [];
  const [showObsSuggestions, setShowObsSuggestions] = useState(false);

  return (
    <View className="py-3 border-t border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="font-medium text-gray-900 dark:text-gray-100">{element.nom}</Text>
          <Text className="text-sm text-gray-400">
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
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dégradations</Text>
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((deg) => (
            <TouchableOpacity
              key={deg}
              onPress={() => toggleDegradation(element.id, deg)}
              className={`px-3 py-1.5 rounded-full border ${
                currentDegradations.includes(deg)
                  ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600'
              }`}
            >
              <Text
                className={`text-xs ${
                  currentDegradations.includes(deg)
                    ? 'text-red-700 dark:text-red-300 font-medium'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {deg}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => addCustomDegradation(element.id)}
            className="px-3 py-1.5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
          >
            <Text className="text-xs text-gray-500 dark:text-gray-400">+ Autre</Text>
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
                  className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
                >
                  <Text className="text-xs text-red-700 dark:text-red-300 font-medium">{deg}</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </View>

      {/* Observations + Suggestions rapides + Aide IA */}
      <View className="mt-3">
        <InputWithVoice
          label="Observations"
          value={elementObservations[element.id] || ''}
          onChangeText={(text) =>
            setElementObservations(prev => ({ ...prev, [element.id]: text }))
          }
          placeholder="Dictez ou saisissez..."
          numberOfLines={2}
        />
        <View className="flex-row gap-2 -mt-2">
          <TouchableOpacity
            onPress={() => setShowObsSuggestions(true)}
            className="flex-row items-center px-3 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700"
          >
            <Zap size={14} color={COLORS.amber[600]} />
            <Text className="text-amber-700 dark:text-amber-300 text-xs font-medium ml-1.5">Rapide</Text>
          </TouchableOpacity>
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

      {/* Modal suggestions observations */}
      <Modal
        visible={showObsSuggestions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowObsSuggestions(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowObsSuggestions(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-white dark:bg-gray-900 rounded-t-2xl"
          >
            <View className="flex-row items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <View>
                <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">Observations rapides</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{element.nom}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowObsSuggestions(false)}>
                <X size={24} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-3" style={{ maxHeight: 350 }}>
              {observationSuggestions.map((obs) => (
                <TouchableOpacity
                  key={obs}
                  onPress={() => {
                    const current = elementObservations[element.id] || '';
                    const newValue = current ? `${current}. ${obs}` : obs;
                    setElementObservations(prev => ({ ...prev, [element.id]: newValue }));
                    setShowObsSuggestions(false);
                  }}
                  className="py-3.5 border-b border-gray-50 dark:border-gray-800"
                  activeOpacity={0.6}
                >
                  <Text className="text-gray-800 dark:text-gray-200">{obs}</Text>
                </TouchableOpacity>
              ))}
              <View className="h-4" />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
            isAnalyzing ? 'bg-gray-100 dark:bg-gray-800' : 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
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
