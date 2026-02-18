import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Sparkles, Check, AlertTriangle } from 'lucide-react-native';
import { Badge } from '../ui';
import { ELEMENT_ETAT_LABELS, ElementEtat } from '../../types';
import { COLORS } from '../../utils/constants';
import { AnalyseResult } from '../../hooks/usePhotoAnalysis';

interface AnalysisResultModalProps {
  visible: boolean;
  analysisResult: AnalyseResult | null;
  onApply: () => void;
  onClose: () => void;
}

export function AnalysisResultModal({
  visible,
  analysisResult,
  onApply,
  onClose,
}: AnalysisResultModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-4 max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Sparkles size={24} color="#9333EA" />
              <Text className="text-lg font-bold text-gray-900 ml-2">
                Analyse IA
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-gray-500">Fermer</Text>
            </TouchableOpacity>
          </View>

          {analysisResult && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Confiance */}
              <View className="flex-row items-center mb-4">
                <Text className="text-gray-500 text-sm">Confiance :</Text>
                <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2">
                  <View
                    className="h-2 bg-purple-500 rounded-full"
                    style={{ width: `${(analysisResult.confiance || 0) * 100}%` }}
                  />
                </View>
                <Text className="text-gray-700 text-sm ml-2">
                  {Math.round((analysisResult.confiance || 0) * 100)}%
                </Text>
              </View>

              {/* État détecté */}
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <Text className="text-sm text-gray-500 mb-1">État détecté</Text>
                <View className="flex-row items-center">
                  <Badge
                    label={ELEMENT_ETAT_LABELS[analysisResult.etat_global as ElementEtat] || analysisResult.etat_global}
                    variant={
                      analysisResult.etat_global === 'bon' || analysisResult.etat_global === 'neuf' || analysisResult.etat_global === 'tres_bon'
                        ? 'green'
                        : analysisResult.etat_global === 'mauvais' || analysisResult.etat_global === 'hors_service'
                          ? 'red'
                          : 'amber'
                    }
                  />
                </View>
              </View>

              {/* Dégradations détectées */}
              {analysisResult.degradations_detectees?.length > 0 && (
                <View className="bg-red-50 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center mb-2">
                    <AlertTriangle size={16} color={COLORS.red[600]} />
                    <Text className="text-sm font-medium text-red-800 ml-1">
                      Dégradations détectées ({analysisResult.degradations_detectees.length})
                    </Text>
                  </View>
                  {analysisResult.degradations_detectees.map((deg, index) => (
                    <View key={index} className="bg-white rounded-lg p-3 mb-2">
                      <Text className="font-medium text-gray-900">{deg.type}</Text>
                      {deg.localisation && (
                        <Text className="text-sm text-gray-500 mt-0.5">
                          📍 {deg.localisation}
                        </Text>
                      )}
                      {deg.description && (
                        <Text className="text-sm text-gray-600 mt-1">
                          {deg.description}
                        </Text>
                      )}
                      <Badge
                        label={deg.severite}
                        variant={deg.severite === 'legere' ? 'amber' : deg.severite === 'moyenne' ? 'orange' : 'red'}
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* Estimation réparation */}
              {analysisResult.estimation_reparation?.necessaire && (
                <View className="bg-amber-50 rounded-xl p-4 mb-4">
                  <Text className="text-sm font-medium text-amber-800 mb-2">
                    💰 Estimation réparation
                  </Text>
                  <Text className="text-2xl font-bold text-amber-900">
                    {analysisResult.estimation_reparation.cout_estime_min}€ - {analysisResult.estimation_reparation.cout_estime_max}€
                  </Text>
                  {analysisResult.estimation_reparation.type_intervention && (
                    <Text className="text-sm text-amber-700 mt-1">
                      Type : {analysisResult.estimation_reparation.type_intervention}
                    </Text>
                  )}
                </View>
              )}

              {/* Observations */}
              {analysisResult.observations && (
                <View className="bg-blue-50 rounded-xl p-4 mb-4">
                  <Text className="text-sm font-medium text-blue-800 mb-1">
                    📝 Observations IA
                  </Text>
                  <Text className="text-gray-700">
                    {analysisResult.observations}
                  </Text>
                </View>
              )}

              {/* Boutons */}
              <View className="flex-row gap-3 mt-2 mb-4">
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 py-3 rounded-xl border border-gray-300 items-center"
                >
                  <Text className="text-gray-600 font-medium">Ignorer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onApply}
                  className="flex-1 py-3 rounded-xl bg-purple-600 items-center flex-row justify-center"
                >
                  <Check size={18} color="white" />
                  <Text className="text-white font-medium ml-2">Appliquer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
