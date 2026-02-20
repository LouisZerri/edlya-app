import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Check, AlertCircle, Home, Plus } from 'lucide-react-native';
import { Card, Badge, Button } from '../ui';
import { DonneesExtraites } from '../../hooks/usePdfImport';
import { LogementNode } from '../../types/graphql';
import { COLORS } from '../../utils/constants';

interface LogementSelectorProps {
  logements: LogementNode[];
  selectedLogement: LogementNode | null;
  setSelectedLogement: (logement: LogementNode | null) => void;
  matchedLogement: { logement: LogementNode; score: number } | null;
  extractedData: DonneesExtraites | null;
  creatingLogement: boolean;
  onCreateLogementFromPdf: () => void;
  onNavigateToCreate: () => void;
}

export function LogementSelector({
  logements,
  selectedLogement,
  setSelectedLogement,
  matchedLogement,
  extractedData,
  creatingLogement,
  onCreateLogementFromPdf,
  onNavigateToCreate,
}: LogementSelectorProps) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-4">
        <Text className="text-blue-800 dark:text-blue-300 font-medium">Sélectionnez le logement</Text>
        <Text className="text-blue-700 dark:text-blue-400 text-sm mt-1">
          L'EDL sera créé pour ce logement avec les données extraites du PDF.
        </Text>
      </View>

      {extractedData?.logement && (
        <TouchableOpacity
          onPress={onCreateLogementFromPdf}
          disabled={creatingLogement}
          className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-xl"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl items-center justify-center">
              {creatingLogement ? (
                <ActivityIndicator size="small" color={COLORS.primary[600]} />
              ) : (
                <Plus size={24} color={COLORS.primary[600]} />
              )}
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-primary-700 dark:text-primary-300">Créer un nouveau logement</Text>
              <Text className="text-primary-600 dark:text-primary-400 text-sm">À partir des données du PDF</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {logements.length === 0 && !extractedData?.logement ? (
        <Card className="mb-4">
          <View className="flex-row items-center">
            <AlertCircle size={20} color={COLORS.amber[600]} />
            <Text className="text-amber-800 dark:text-amber-300 ml-2">Aucun logement disponible</Text>
          </View>
          <Text className="text-gray-600 dark:text-gray-300 text-sm mt-2">
            Créez d'abord un logement avant de pouvoir importer un EDL.
          </Text>
          <View className="mt-3">
            <Button
              label="Créer un logement"
              onPress={onNavigateToCreate}
              variant="secondary"
              fullWidth
            />
          </View>
        </Card>
      ) : (
        <>
          {logements.length > 0 && (
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3">Ou sélectionnez un logement existant :</Text>
          )}
          {logements.map((logement) => {
            const isMatched = matchedLogement?.logement.id === logement.id;
            const isSelected = selectedLogement?.id === logement.id;
            return (
              <TouchableOpacity
                key={logement.id}
                onPress={() => setSelectedLogement(logement)}
                className={`mb-3 p-4 rounded-xl border-2 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : isMatched
                    ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900'
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                    isSelected ? 'bg-primary-100 dark:bg-primary-900/30' :
                    isMatched ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Home size={24} color={
                      isSelected ? COLORS.primary[600] :
                      isMatched ? COLORS.blue[600] : COLORS.gray[500]
                    } />
                  </View>
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className={`font-semibold ${
                        isSelected ? 'text-primary-700 dark:text-primary-300' :
                        isMatched ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {logement.nom}
                      </Text>
                      {isMatched && (
                        <View className="ml-2">
                          <Badge label="Suggéré" variant="blue" />
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">{logement.adresse}</Text>
                    <Text className="text-gray-400 dark:text-gray-500 text-xs">{logement.ville}</Text>
                  </View>
                  {isSelected && (
                    <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                      <Check size={16} color="white" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      <View className="h-24" />
    </ScrollView>
  );
}
