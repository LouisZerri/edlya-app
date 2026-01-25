import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Download, AlertTriangle, ArrowRight } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Header, Card, Badge, Button } from '../../../components/ui';
import { COLORS } from '../../../utils/constants';
import { COMPTEUR_CONFIG, ELEMENT_ETAT_LABELS } from '../../../types';

export default function ComparatifScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Mock data - would come from API
  const comparatif = {
    entree: { date: '01/01/2024' },
    sortie: { date: '01/12/2024' },
    degradations: 3,
    estimation: 450,
    compteurs: [
      { type: 'electricite', entree: '12450', sortie: '15230', conso: '2780 kWh' },
      { type: 'eau_froide', entree: '234', sortie: '298', conso: '64 m3' },
    ],
    cles: [
      { type: 'Porte entree', entree: 3, sortie: 3, ok: true },
      { type: 'Boite aux lettres', entree: 2, sortie: 1, ok: false },
    ],
    pieces: [
      {
        nom: 'Salon',
        elements: [
          { nom: 'Sol parquet', etatEntree: 'bon', etatSortie: 'usage', degradations: ['Rayures'] },
        ],
      },
      {
        nom: 'Cuisine',
        elements: [
          { nom: 'Plan de travail', etatEntree: 'bon', etatSortie: 'mauvais', degradations: ['Brulure', 'Taches'] },
        ],
      },
    ],
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header
        title="Comparatif"
        showBack
        rightAction={
          <TouchableOpacity>
            <Download size={22} color={COLORS.primary[600]} />
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1">
        {/* Resume */}
        <View className="bg-white p-4 border-b border-gray-100">
          <View className="flex-row items-center justify-center">
            <View className="items-center">
              <Text className="text-xs text-gray-500">Entree</Text>
              <Text className="font-semibold text-gray-900">{comparatif.entree.date}</Text>
            </View>
            <ArrowRight size={20} color={COLORS.gray[400]} className="mx-4" />
            <View className="items-center">
              <Text className="text-xs text-gray-500">Sortie</Text>
              <Text className="font-semibold text-gray-900">{comparatif.sortie.date}</Text>
            </View>
          </View>

          <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 flex-row items-center">
            <AlertTriangle size={20} color={COLORS.amber[600]} />
            <Text className="text-amber-700 ml-2 flex-1">
              {comparatif.degradations} degradations - Estimation: {comparatif.estimation} EUR
            </Text>
          </View>
        </View>

        {/* Compteurs */}
        <View className="p-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Evolution des compteurs
          </Text>
          {comparatif.compteurs.map((compteur, index) => {
            const config = COMPTEUR_CONFIG[compteur.type as keyof typeof COMPTEUR_CONFIG];
            return (
              <Card key={index} className="mb-3">
                <View className="flex-row items-center mb-2">
                  <Text className="text-xl">{config?.icon}</Text>
                  <Text className="font-medium text-gray-800 ml-2">{config?.label}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">{compteur.entree}</Text>
                  <ArrowRight size={16} color={COLORS.gray[400]} />
                  <Text className="text-gray-900 font-medium">{compteur.sortie}</Text>
                  <Badge label={compteur.conso} variant="blue" />
                </View>
              </Card>
            );
          })}
        </View>

        {/* Cles */}
        <View className="px-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">Cles</Text>
          {comparatif.cles.map((cle, index) => (
            <Card key={index} className="mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-700">{cle.type}</Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-600">{cle.entree}</Text>
                  <ArrowRight size={16} color={COLORS.gray[400]} className="mx-2" />
                  <Text className="text-gray-900 font-medium">{cle.sortie}</Text>
                  <Badge
                    label={cle.ok ? 'OK' : 'Manquante'}
                    variant={cle.ok ? 'green' : 'red'}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Degradations par piece */}
        <View className="p-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Degradations par piece
          </Text>
          {comparatif.pieces.map((piece, index) => (
            <Card key={index} className="mb-3">
              <View className="flex-row items-center mb-3">
                <Text className="text-lg">🚪</Text>
                <Text className="font-semibold text-gray-900 ml-2">{piece.nom}</Text>
              </View>
              {piece.elements.map((element, idx) => (
                <View key={idx} className="py-2 border-t border-gray-50">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-700">{element.nom}</Text>
                    <View className="flex-row items-center">
                      <Badge
                        label={ELEMENT_ETAT_LABELS[element.etatEntree as keyof typeof ELEMENT_ETAT_LABELS]}
                        variant="green"
                      />
                      <ArrowRight size={14} color={COLORS.gray[400]} className="mx-1" />
                      <Badge
                        label={ELEMENT_ETAT_LABELS[element.etatSortie as keyof typeof ELEMENT_ETAT_LABELS]}
                        variant="red"
                      />
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-1 mt-2">
                    {element.degradations.map((deg, i) => (
                      <Badge key={i} label={deg} variant="red" />
                    ))}
                  </View>
                </View>
              ))}
            </Card>
          ))}
        </View>

        <View className="h-4" />
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100">
        <Button
          label="Voir les estimations detaillees"
          onPress={() => router.push(`/edl/${id}/estimations`)}
          fullWidth
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}
