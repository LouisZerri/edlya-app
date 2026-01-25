import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Download, Info } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Header, Card, Badge, Button } from '../../../components/ui';
import { COLORS } from '../../../utils/constants';
import { formatCurrency } from '../../../utils/format';

export default function EstimationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Mock data - would come from API
  const estimations = {
    total: 425,
    depotGarantie: 1200,
    aRestituer: 775,
    degradations: [
      {
        piece: 'Salon',
        element: 'Sol parquet',
        degradation: 'Rayures profondes',
        montantBrut: 200,
        vetuste: 15,
        montantNet: 170,
      },
      {
        piece: 'Cuisine',
        element: 'Plan de travail',
        degradation: 'Brulure',
        montantBrut: 180,
        vetuste: 20,
        montantNet: 144,
      },
    ],
    clesManquantes: [
      { type: 'Boite aux lettres', nombre: 1, cout: 25, total: 25 },
    ],
    nettoyage: 86,
    recapitulatif: {
      degradationsBrut: 380,
      abattementVetuste: -66,
      cles: 25,
      nettoyage: 86,
    },
    vetustePieces: [
      { element: 'Parquet', duree: '5 ans', taux: '15%' },
      { element: 'Plan de travail', duree: '8 ans', taux: '20%' },
    ],
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header
        title="Estimations"
        showBack
        rightAction={
          <TouchableOpacity>
            <Download size={22} color={COLORS.primary[600]} />
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1">
        {/* Hero */}
        <LinearGradient
          colors={['#F59E0B', '#EA580C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 mt-4 p-5 rounded-2xl"
        >
          <Text className="text-amber-100 text-sm">Estimation totale des retenues</Text>
          <Text className="text-white text-4xl font-bold mt-1">
            {formatCurrency(estimations.total)}
          </Text>

          <View className="flex-row mt-4 gap-4">
            <View className="bg-white/20 rounded-lg px-3 py-2 flex-1">
              <Text className="text-white/80 text-xs">Depot de garantie</Text>
              <Text className="text-white font-bold">{formatCurrency(estimations.depotGarantie)}</Text>
            </View>
            <View className="bg-white/20 rounded-lg px-3 py-2 flex-1">
              <Text className="text-white/80 text-xs">A restituer</Text>
              <Text className="text-white font-bold">{formatCurrency(estimations.aRestituer)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Degradations */}
        <View className="p-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Degradations locatives
          </Text>
          {estimations.degradations.map((deg, index) => (
            <Card key={index} className="mb-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">{deg.element}</Text>
                  <Text className="text-sm text-gray-500">{deg.piece}</Text>
                  <Badge label={deg.degradation} variant="red" />
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-gray-900">
                    {formatCurrency(deg.montantNet)}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {formatCurrency(deg.montantBrut)} - {deg.vetuste}% vetuste
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Cles manquantes */}
        {estimations.clesManquantes.length > 0 && (
          <View className="px-4">
            <Text className="text-base font-semibold text-gray-800 mb-3">
              Cles manquantes
            </Text>
            {estimations.clesManquantes.map((cle, index) => (
              <Card key={index} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-medium text-gray-900">{cle.type}</Text>
                    <Text className="text-sm text-gray-500">
                      {cle.nombre} x {formatCurrency(cle.cout)}
                    </Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900">
                    {formatCurrency(cle.total)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Grille vetuste */}
        <View className="px-4 mt-2">
          <Card className="bg-blue-50 border-blue-200">
            <View className="flex-row items-center mb-3">
              <Info size={18} color={COLORS.blue[600]} />
              <Text className="text-blue-800 font-medium ml-2">Grille de vetuste</Text>
            </View>
            <Text className="text-sm text-blue-700 mb-3">
              Duree de location: 11 mois
            </Text>
            {estimations.vetustePieces.map((item, index) => (
              <View key={index} className="flex-row items-center justify-between py-1">
                <Text className="text-blue-700">{item.element}</Text>
                <Text className="text-blue-800 font-medium">{item.taux}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Recapitulatif */}
        <View className="p-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Recapitulatif
          </Text>
          <Card>
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-700">Degradations (brut)</Text>
              <Text className="font-medium text-gray-900">
                {formatCurrency(estimations.recapitulatif.degradationsBrut)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <Text className="text-green-700">- Abattement vetuste</Text>
              <Text className="font-medium text-green-700">
                {formatCurrency(estimations.recapitulatif.abattementVetuste)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-700">Cles manquantes</Text>
              <Text className="font-medium text-gray-900">
                {formatCurrency(estimations.recapitulatif.cles)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-700">Nettoyage</Text>
              <Text className="font-medium text-gray-900">
                {formatCurrency(estimations.recapitulatif.nettoyage)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-3 mt-2 bg-amber-50 -mx-4 -mb-4 px-4 rounded-b-xl">
              <Text className="text-amber-800 font-semibold">Total retenues</Text>
              <Text className="text-xl font-bold text-amber-700">
                {formatCurrency(estimations.total)}
              </Text>
            </View>
          </Card>
        </View>

        <View className="h-4" />
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100">
        <Button
          label="Exporter le detail PDF"
          onPress={() => {}}
          fullWidth
        />
        <Button
          label="Envoyer au locataire"
          onPress={() => {}}
          fullWidth
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}
