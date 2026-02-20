import { View, Text, FlatList, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { useState, useCallback, useMemo } from 'react';
import { Plus, ChevronRight, Calendar, DoorOpen } from 'lucide-react-native';
import { Header, Card, Badge, SearchBar } from '../../components/ui';
import { GET_ETATS_DES_LIEUX } from '../../graphql/queries/edl';
import { EtatDesLieux, STATUT_BADGE, TYPE_CONFIG } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/format';

interface EdlData {
  etatDesLieuxes?: {
    edges: Array<{ node: EtatDesLieux }>;
  };
}

type FilterType = 'tous' | 'entree' | 'sortie';

export default function EdlScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('tous');
  const [search, setSearch] = useState('');

  const { data, refetch, loading } = useQuery<EdlData>(GET_ETATS_DES_LIEUX);

  const allEdls: EtatDesLieux[] = data?.etatDesLieuxes?.edges?.map((edge) => edge.node) || [];

  // Filtrer par type et recherche
  const filteredEdls = useMemo(() => {
    let result = allEdls;

    // Filtre par type
    if (filter !== 'tous') {
      result = result.filter(edl => edl.type === filter);
    }

    // Filtre par recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(edl =>
        edl.logement?.nom?.toLowerCase().includes(searchLower) ||
        edl.locataireNom?.toLowerCase().includes(searchLower) ||
        edl.logement?.adresse?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [allEdls, filter, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const FilterPill = ({ type, label }: { type: FilterType; label: string }) => (
    <TouchableOpacity
      onPress={() => setFilter(type)}
      className={`px-4 py-2 rounded-full mr-2 ${
        filter === type ? 'bg-primary-600' : 'bg-gray-100 dark:bg-gray-800'
      }`}
    >
      <Text className={filter === type ? 'text-white font-medium' : 'text-gray-600 dark:text-gray-300'}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: EtatDesLieux }) => {
    const typeConfig = TYPE_CONFIG[item.type];
    const statutBadge = STATUT_BADGE[item.statut];
    const edlId = item.id.split('/').pop();

    return (
      <Card
        onPress={() => router.push(`/edl/${edlId}`)}
        className="mb-3"
      >
        <View className="flex-row">
          <View className={`w-12 h-12 rounded-xl items-center justify-center ${typeConfig.bg}`}>
            <Text className="text-2xl">{typeConfig.icon}</Text>
          </View>

          <View className="flex-1 ml-3 mr-2">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="font-semibold text-gray-900 dark:text-gray-100 flex-1" numberOfLines={1}>
                {item.logement?.nom || 'Logement'}
              </Text>
              <Badge label={statutBadge.label} variant={statutBadge.variant} />
            </View>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.locataireNom}</Text>

            <View className="flex-row items-center mt-2 gap-3">
              <View className="flex-row items-center">
                <Calendar size={12} color={COLORS.gray[400]} />
                <Text className="text-sm text-gray-400 ml-1">
                  {formatDate(item.dateRealisation)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <DoorOpen size={12} color={COLORS.gray[400]} />
                <Text className="text-sm text-gray-400 ml-1">
                  {(item.pieces as { totalCount?: number })?.totalCount || item.pieces?.length || 0} pièces
                </Text>
              </View>
            </View>
          </View>

          <ChevronRight size={20} color={COLORS.gray[400]} style={{ alignSelf: 'center' }} />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <Header
        title="États des lieux"
        rightAction={
          <TouchableOpacity onPress={() => router.push('/edl/create')}>
            <Plus size={24} color={COLORS.primary[600]} />
          </TouchableOpacity>
        }
      />

      <View className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par logement ou locataire..."
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <FilterPill type="tous" label="Tous" />
          <FilterPill type="entree" label="Entrée" />
          <FilterPill type="sortie" label="Sortie" />
        </ScrollView>
      </View>

      <FlatList
        data={filteredEdls}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <Card>
              <Text className="text-gray-500 dark:text-gray-400 text-center py-8">
                {search.trim()
                  ? `Aucun EDL trouvé pour "${search}"`
                  : 'Aucun état des lieux pour le moment.\nCréez votre premier EDL !'}
              </Text>
            </Card>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
