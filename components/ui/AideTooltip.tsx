import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { useAideObservation } from '../../hooks/useAideObservation';
import { COLORS } from '../../utils/constants';

interface AideTooltipProps {
  element: string;
  etat: string;
  observation?: string;
  degradations?: string[];
  onApply: (text: string) => void;
}

export function AideTooltip({
  element,
  etat,
  observation,
  degradations,
  onApply,
}: AideTooltipProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const { ameliorerObservation, isLoading, error } = useAideObservation();

  const handlePress = async () => {
    setIsModalVisible(true);
    setSuggestion(null);

    const result = await ameliorerObservation(element, etat, observation, degradations);
    if (result) {
      setSuggestion(result);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion);
    }
    setIsModalVisible(false);
    setSuggestion(null);
  };

  const handleIgnore = () => {
    setIsModalVisible(false);
    setSuggestion(null);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isLoading}
        className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30"
        activeOpacity={0.7}
      >
        <Sparkles size={18} color={COLORS.primary[600]} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleIgnore}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center px-4"
          activeOpacity={1}
          onPress={handleIgnore}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <View className="flex-row items-center">
                <Sparkles size={20} color={COLORS.primary[600]} />
                <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-2">
                  Suggestion IA
                </Text>
              </View>
              <TouchableOpacity onPress={handleIgnore} className="p-1">
                <X size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView className="p-4" style={{ maxHeight: 300 }}>
              {isLoading && (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color={COLORS.primary[600]} />
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Analyse en cours...
                  </Text>
                </View>
              )}

              {error && !isLoading && (
                <View className="bg-red-50 p-3 rounded-xl">
                  <Text className="text-sm text-red-700">{error}</Text>
                </View>
              )}

              {suggestion && !isLoading && (
                <View className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-xl">
                  <Text className="text-sm text-gray-800 dark:text-gray-200 leading-5">
                    {suggestion}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            {suggestion && !isLoading && (
              <View className="flex-row p-4 border-t border-gray-100 dark:border-gray-700 gap-3">
                <TouchableOpacity
                  onPress={handleIgnore}
                  className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    Ignorer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApply}
                  className="flex-1 py-3 rounded-xl bg-primary-600 items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-semibold text-white">
                    Appliquer
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {error && !isLoading && (
              <View className="p-4 border-t border-gray-100 dark:border-gray-700">
                <TouchableOpacity
                  onPress={handleIgnore}
                  className="py-3 rounded-xl border border-gray-300 dark:border-gray-600 items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    Fermer
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
