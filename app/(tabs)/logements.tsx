import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { useState, useCallback, useMemo } from 'react';
import { Plus, ChevronRight, MapPin } from 'lucide-react-native';
import { Header, Card, SearchBar } from '../../components/ui';
import { GET_LOGEMENTS } from '../../graphql/queries/logements';
import { Logement } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatSurface } from '../../utils/format';

interface LogementsData {
  logements?: {
    edges: Array<{ node: Logement }>;
  };
}

export default function LogementsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const { data, refetch, loading } = useQuery<LogementsData>(GET_LOGEMENTS);

  const logements: Logement[] = data?.logements?.edges?.map((edge) => edge.node) || [];

  // Filtrer par recherche
  const filteredLogements = useMemo(() => {
    if (!search.trim()) return logements;
    const searchLower = search.toLowerCase();
    return logements.filter(l =>
      l.nom?.toLowerCase().includes(searchLower) ||
      l.adresse?.toLowerCase().includes(searchLower) ||
      l.ville?.toLowerCase().includes(searchLower)
    );
  }, [logements, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }: { item: Logement }) => {
    const logementId = item.id.split('/').pop();
    return (
    <Card
      onPress={() => router.push(`/logement/${logementId}`)}
      className="mb-3"
    >
      <View className="flex-row items-center">
        <View className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl items-center justify-center">
          <Text className="text-3xl">🏠</Text>
        </View>

        <View className="flex-1 ml-3">
          <Text className="font-semibold text-gray-900">{item.nom}</Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={12} color={COLORS.gray[400]} />
            <Text className="text-sm text-gray-500 ml-1">{item.adresse}</Text>
          </View>
          <Text className="text-xs text-gray-400 mt-0.5">{item.ville}</Text>
        </View>

        <View className="items-end mr-2">
          {item.surface && (
            <Text className="text-xs text-gray-500">📐 {formatSurface(item.surface)}</Text>
          )}
          <Text className="text-xs text-gray-400 mt-0.5">
            📋 EDL
          </Text>
        </View>

        <ChevronRight size={20} color={COLORS.gray[400]} />
      </View>
    </Card>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header
        title="Mes logements"
        rightAction={
          <TouchableOpacity onPress={() => router.push('/logement/create')}>
            <Plus size={24} color={COLORS.primary[600]} />
          </TouchableOpacity>
        }
      />

      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un logement..."
        />
      </View>

      <FlatList
        data={filteredLogements}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <Card>
              <Text className="text-gray-500 text-center py-8">
                {search.trim()
                  ? `Aucun logement trouvé pour "${search}"`
                  : 'Aucun logement pour le moment.\nCréez votre premier logement !'}
              </Text>
            </Card>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
