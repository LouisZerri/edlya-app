import { View, Text, TouchableOpacity } from 'react-native';
import { Home, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/constants';

export interface LogementSansEdl {
  id: number;
  nom: string;
  adresse: string;
  ville: string;
}

interface LogementsSansEdlProps {
  logements: LogementSansEdl[];
}

export function LogementsSansEdl({ logements }: LogementsSansEdlProps) {
  const router = useRouter();

  if (logements.length === 0) return null;

  return (
    <View className="mx-4 mt-4">
      <Text className="text-base font-semibold text-gray-800 mb-3">
        Logements sans EDL
      </Text>
      {logements.map((logement) => (
        <TouchableOpacity
          key={logement.id}
          onPress={() => router.push(`/edl/create?logementId=${logement.id}`)}
          className="flex-row items-center bg-white rounded-xl p-3 mb-2 border border-gray-100"
          activeOpacity={0.7}
        >
          <View className="w-10 h-10 bg-amber-50 rounded-lg items-center justify-center">
            <Home size={20} color={COLORS.amber[600]} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="font-medium text-gray-800">{logement.nom}</Text>
            <Text className="text-gray-500 text-xs">
              {logement.adresse}{logement.ville ? `, ${logement.ville}` : ''}
            </Text>
          </View>
          <View className="w-8 h-8 bg-primary-50 rounded-lg items-center justify-center">
            <Plus size={16} color={COLORS.primary[600]} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
