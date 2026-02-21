import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Check, AlertCircle, Plus, Home } from 'lucide-react-native';
import { Card, Badge } from '../ui';
import { DonneesExtraites } from '../../hooks/usePdfImport';
import { LogementNode } from '../../types/graphql';
import { COLORS } from '../../utils/constants';

interface ImportPreviewLogementProps {
  extractedData: DonneesExtraites;
  isEditing: boolean;
  onUpdate: (updater: (data: DonneesExtraites) => DonneesExtraites) => void;
  selectedLogement: LogementNode | null;
  setSelectedLogement: (logement: LogementNode | null) => void;
  matchedLogement: { logement: LogementNode; score: number } | null;
  creatingLogement: boolean;
  onCreateLogementFromPdf: () => void;
  onGoToLogementStep: () => void;
}

export function ImportPreviewLogement({
  extractedData,
  isEditing,
  onUpdate,
  selectedLogement,
  setSelectedLogement,
  matchedLogement,
  creatingLogement,
  onCreateLogementFromPdf,
  onGoToLogementStep,
}: ImportPreviewLogementProps) {
  return (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        <Home size={20} color={COLORS.primary[600]} />
        <Text className="font-semibold text-gray-800 dark:text-gray-200 ml-2">Logement</Text>
      </View>

      {/* Données extraites du PDF (éditables) */}
      {extractedData.logement && (
        isEditing ? (
          <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">Données extraites (modifiables) :</Text>
            <TextInput
              value={extractedData.logement.adresse || ''}
              onChangeText={(t) => onUpdate(d => ({
                ...d, logement: { ...d.logement!, adresse: t }
              }))}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 mb-2"
              style={{ includeFontPadding: false, height: 44, textAlignVertical: 'center', fontSize: 16 }}
              placeholder="Adresse"
              placeholderTextColor="#9CA3AF"
            />
            <View className="flex-row gap-2 mb-2">
              <TextInput
                value={extractedData.logement.code_postal || ''}
                onChangeText={(t) => onUpdate(d => ({
                  ...d, logement: { ...d.logement!, code_postal: t }
                }))}
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900"
                style={{ includeFontPadding: false, height: 44, textAlignVertical: 'center', fontSize: 16 }}
                placeholder="Code postal"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <TextInput
                value={extractedData.logement.ville || ''}
                onChangeText={(t) => onUpdate(d => ({
                  ...d, logement: { ...d.logement!, ville: t }
                }))}
                className="flex-[2] border border-gray-200 dark:border-gray-600 rounded-lg px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900"
                style={{ includeFontPadding: false, height: 44, textAlignVertical: 'center', fontSize: 16 }}
                placeholder="Ville"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TextInput
              value={extractedData.logement.surface ? String(extractedData.logement.surface) : ''}
              onChangeText={(t) => onUpdate(d => ({
                ...d, logement: { ...d.logement!, surface: t ? parseFloat(t) : undefined }
              }))}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900"
              style={{ includeFontPadding: false, height: 44, textAlignVertical: 'center', fontSize: 16 }}
              placeholder="Surface (m²)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        ) : (
          <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Extrait du PDF :</Text>
            {extractedData.logement.adresse && (
              <Text className="text-gray-700 dark:text-gray-200">{extractedData.logement.adresse}</Text>
            )}
            {(extractedData.logement.code_postal || extractedData.logement.ville) && (
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                {extractedData.logement.code_postal} {extractedData.logement.ville}
              </Text>
            )}
            {extractedData.logement.surface && (
              <Text className="text-gray-500 dark:text-gray-400 text-sm">{extractedData.logement.surface} m²</Text>
            )}
          </View>
        )
      )}

      {/* Logement sélectionné ou matché */}
      {selectedLogement ? (
        <View className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
          <View className="flex-row items-center">
            <Check size={16} color={COLORS.green[600]} />
            <Text className="text-green-800 dark:text-green-300 font-medium ml-2">Logement associé</Text>
          </View>
          <Text className="text-green-700 dark:text-green-300 mt-1">{selectedLogement.nom}</Text>
          <Text className="text-green-600 dark:text-green-400 text-sm">{selectedLogement.adresse}, {selectedLogement.ville}</Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedLogement(null);
              onGoToLogementStep();
            }}
            className="mt-2"
          >
            <Text className="text-primary-600 dark:text-primary-400 text-sm font-medium">Changer de logement</Text>
          </TouchableOpacity>
        </View>
      ) : matchedLogement ? (
        <View className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <AlertCircle size={16} color={COLORS.blue[600]} />
              <Text className="text-blue-800 dark:text-blue-300 font-medium ml-2">Logement similaire trouvé</Text>
            </View>
            <Badge label={`${Math.round(matchedLogement.score * 100)}% match`} variant="blue" />
          </View>
          <Text className="text-blue-700 dark:text-blue-300 mt-1">{matchedLogement.logement.nom}</Text>
          <Text className="text-blue-600 dark:text-blue-400 text-sm">
            {matchedLogement.logement.adresse}, {matchedLogement.logement.ville}
          </Text>
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => setSelectedLogement(matchedLogement.logement)}
              className="flex-1 h-9 bg-blue-600 rounded-lg items-center justify-center"
            >
              <Text className="text-white font-medium text-sm">Utiliser ce logement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCreateLogementFromPdf}
              disabled={creatingLogement}
              className="flex-1 h-9 border border-blue-300 dark:border-blue-600 rounded-lg items-center justify-center"
            >
              {creatingLogement ? (
                <ActivityIndicator size="small" color={COLORS.blue[600]} />
              ) : (
                <Text className="text-blue-700 dark:text-blue-300 font-medium text-sm">Créer nouveau</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : extractedData.logement ? (
        <View className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
          <View className="flex-row items-center">
            <Plus size={16} color={COLORS.amber[600]} />
            <Text className="text-amber-800 dark:text-amber-300 font-medium ml-2">Aucun logement correspondant</Text>
          </View>
          <Text className="text-amber-700 dark:text-amber-400 text-sm mt-1">
            Ce logement n'existe pas encore dans votre liste.
          </Text>
          <View className="flex-row mt-3" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={onCreateLogementFromPdf}
              disabled={creatingLogement}
              className="flex-1 h-10 bg-amber-600 rounded-lg flex-row items-center justify-center px-2"
            >
              {creatingLogement ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Plus size={16} color="white" />
                  <Text className="text-white font-medium text-sm ml-1">Créer auto</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onGoToLogementStep}
              className="flex-1 h-10 border border-amber-300 dark:border-amber-600 rounded-lg items-center justify-center px-2"
            >
              <Text className="text-amber-700 dark:text-amber-300 font-medium text-sm">Choisir existant</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onGoToLogementStep}
          className="py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg items-center"
        >
          <Text className="text-gray-600 dark:text-gray-300">Sélectionner un logement</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}
