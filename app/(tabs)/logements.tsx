import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useCallback, useMemo } from 'react';
import { Plus, ChevronRight, MapPin, Home, Search, ArrowUpDown } from 'lucide-react-native';
import { Header, Card, SearchBar, EmptyState, SkeletonList, AnimatedListItem, Fab, SwipeableRow, ConfirmSheet } from '../../components/ui';
import { GET_LOGEMENTS } from '../../graphql/queries/logements';
import { DELETE_LOGEMENT } from '../../graphql/mutations/logements';
import { Logement } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatSurface } from '../../utils/format';
import { useToastStore } from '../../stores/toastStore';

const PAGE_SIZE = 20;

interface LogementsData {
  logements?: {
    edges: Array<{ node: Logement; cursor: string }>;
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
    totalCount: number;
  };
}

type SortOption = 'nom_asc' | 'nom_desc' | 'ville_asc' | 'recent';

const SORT_LABELS: Record<SortOption, string> = {
  nom_asc: 'Nom A → Z',
  nom_desc: 'Nom Z → A',
  ville_asc: 'Ville A → Z',
  recent: 'Plus récent',
};

export default function LogementsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('nom_asc');
  const [showSort, setShowSort] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { success: showSuccess, error: showError } = useToastStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nom: string } | null>(null);

  const { data, refetch, loading, fetchMore } = useQuery<LogementsData>(GET_LOGEMENTS, {
    variables: { first: PAGE_SIZE },
  });

  const [deleteLogement] = useMutation(DELETE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS, variables: { first: PAGE_SIZE } }],
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLogement({ variables: { input: { id: deleteTarget.id } } });
      showSuccess('Logement supprimé');
    } catch {
      showError('Erreur lors de la suppression');
    }
    setDeleteTarget(null);
  };

  const logements: Logement[] = data?.logements?.edges?.map((edge) => edge.node) || [];
  const hasNextPage = data?.logements?.pageInfo?.hasNextPage ?? false;
  const endCursor = data?.logements?.pageInfo?.endCursor ?? null;

  const handleLoadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: { first: PAGE_SIZE, after: endCursor },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.logements) return prev;
          return {
            logements: {
              ...fetchMoreResult.logements,
              edges: [
                ...(prev.logements?.edges || []),
                ...fetchMoreResult.logements.edges,
              ],
            },
          };
        },
      });
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, loadingMore, loading, endCursor, fetchMore]);

  // Filtrer par recherche + tri
  const filteredLogements = useMemo(() => {
    let result = logements;

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(l =>
        l.nom?.toLowerCase().includes(searchLower) ||
        l.adresse?.toLowerCase().includes(searchLower) ||
        l.ville?.toLowerCase().includes(searchLower)
      );
    }

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'nom_asc':
          return (a.nom || '').localeCompare(b.nom || '');
        case 'nom_desc':
          return (b.nom || '').localeCompare(a.nom || '');
        case 'ville_asc':
          return (a.ville || '').localeCompare(b.ville || '');
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [logements, search, sort]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch({ first: PAGE_SIZE });
    setRefreshing(false);
  }, []);

  const renderItem = ({ item, index }: { item: Logement; index: number }) => {
    const logementId = item.id.split('/').pop();
    return (
    <SwipeableRow
      onDelete={() => setDeleteTarget({ id: item.id, nom: item.nom })}
      onEdit={() => router.push(`/logement/${logementId}/edit`)}
    >
      <AnimatedListItem index={index}>
        <Card
          onPress={() => router.push(`/logement/${logementId}`)}
          className="rounded-none border-0"
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl items-center justify-center">
              <Text className="text-3xl">🏠</Text>
            </View>

            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-900 dark:text-gray-100">{item.nom}</Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={12} color={COLORS.gray[400]} />
                <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1 flex-1" numberOfLines={1}>{item.adresse}</Text>
              </View>
              <Text className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{item.ville}</Text>
            </View>

            <View className="items-end mr-2">
              {item.surface && (
                <Text className="text-xs text-gray-500 dark:text-gray-400">📐 {formatSurface(item.surface)}</Text>
              )}
              <Text className="text-xs text-gray-400 mt-0.5">
                📋 EDL
              </Text>
            </View>

            <ChevronRight size={20} color={COLORS.gray[400]} />
          </View>
        </Card>
      </AnimatedListItem>
    </SwipeableRow>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={COLORS.primary[600]} />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <Header
        title="Mes logements"
      />

      <View className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un logement..."
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowSort(!showSort)}
            className="flex-row items-center px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <ArrowUpDown size={16} color={COLORS.gray[500]} />
          </TouchableOpacity>
        </View>
        {showSort && (
          <View className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => { setSort(option); setShowSort(false); }}
                className={`px-4 py-2.5 ${sort === option ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}
              >
                <Text className={`text-sm ${sort === option ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                  {SORT_LABELS[option]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <GestureHandlerRootView style={{ flex: 1 }}>
      {loading && filteredLogements.length === 0 ? (
          <SkeletonList count={5} />
        ) : (
        <FlatList
          data={filteredLogements}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" colors={['#6366F1']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !loading ? (
              search.trim() ? (
                <EmptyState
                  icon={Search}
                  title="Aucun résultat"
                  subtitle={`Aucun logement trouvé pour "${search}"`}
                />
              ) : (
                <EmptyState
                  icon={Home}
                  title="Pas encore de logement"
                  subtitle="Ajoutez votre premier logement pour commencer"
                  actionLabel="Ajouter un logement"
                  onAction={() => router.push('/logement/create')}
                />
              )
            ) : null
          }
        />
        )}
      </GestureHandlerRootView>
      <Fab onPress={() => router.push('/logement/create')} />
      <ConfirmSheet
        visible={!!deleteTarget}
        title="Supprimer ce logement ?"
        message={`Le logement "${deleteTarget?.nom}" et tous ses EDL associés seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </SafeAreaView>
  );
}
