import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Card, Badge } from '../ui';
import { STATUT_BADGE, TYPE_CONFIG, EdlType, EdlStatut } from '../../types';
import { formatDate } from '../../utils/format';
import { COLORS } from '../../utils/constants';

interface RecentEdlItem {
  id: string;
  type: string;
  dateRealisation: string;
  locataireNom: string;
  statut: string;
  logement: { nom: string };
}

interface RecentEdlListProps {
  edls: RecentEdlItem[];
}

export function RecentEdlList({ edls }: RecentEdlListProps) {
  const router = useRouter();

  return (
    <View className="px-4 mt-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">États des lieux récents</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/edl')}
          className="py-2 px-3 -mr-3"
        >
          <Text className="text-primary-600 text-base font-medium">Voir tout</Text>
        </TouchableOpacity>
      </View>

      {edls.length === 0 ? (
        <Card>
          <Text className="text-gray-500 dark:text-gray-400 text-center py-4">
            Aucun état des lieux pour le moment
          </Text>
        </Card>
      ) : (
        <View>
          {edls.map((item) => {
            const typeConfig = TYPE_CONFIG[item.type as EdlType] || TYPE_CONFIG.entree;
            const statutBadge = STATUT_BADGE[item.statut as EdlStatut] || STATUT_BADGE.brouillon;
            const edlId = item.id.split('/').pop();

            return (
              <Card
                key={item.id}
                onPress={() => router.push(`/edl/${edlId}`)}
                className="mb-3"
              >
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center ${typeConfig.bg}`}>
                    <Text className="text-2xl">{typeConfig.icon}</Text>
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {item.logement?.nom || 'Logement'}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.locataireNom}</Text>
                    <Text className="text-sm text-gray-400 mt-1">
                      {formatDate(item.dateRealisation)}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Badge label={statutBadge.label} variant={statutBadge.variant} />
                  </View>

                  <ChevronRight size={20} color={COLORS.gray[400]} className="ml-2" />
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </View>
  );
}
