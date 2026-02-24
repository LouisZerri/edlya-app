import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useQuery, useMutation } from '@apollo/client/react';
import { ChevronRight, MapPin, Home, Search, ArrowUpDown, Eye, Edit3, FilePlus, Trash2, Pin, PinOff } from 'lucide-react-native';
import { Header, Card, SearchBar, EmptyState, SkeletonList, AnimatedListItem, Fab, SwipeableRow, ConfirmSheet, ActionSheet } from '../../components/ui';
import type { ActionSheetItem } from '../../components/ui';
import { hapticMedium, hapticLight } from '../../utils/haptics';
import { GET_LOGEMENTS } from '../../graphql/queries/logements';
import { DELETE_LOGEMENT } from '../../graphql/mutations/logements';
import type { Logement } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatSurface, formatLogementType } from '../../utils/format';
import { useToastStore } from '../../stores/toastStore';
import { useFavoritesStore } from '../../stores/favoritesStore';

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
  const [contextMenu, setContextMenu] = useState<Logement | null>(null);

  const { pinnedIds, initialize: initFavorites, toggle: togglePin, isPinned } = useFavoritesStore();

  useEffect(() => {
    initFavorites();
  }, []);

  const { data, refetch, loading, fetchMore } = useQuery<LogementsData>(GET_LOGEMENTS, {
    variables: { first: PAGE_SIZE },
  });

  const [deleteLogement] = useMutation(DELETE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS, variables: { first: PAGE_SIZE } }],
  });

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteLogement({ variables: { input: { id: deleteTarget.id } } });
      showSuccess('Logement supprimé');
    } catch {
      showError('Erreur lors de la suppression');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteLogement, showSuccess, showError]);

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
    } catch (err) {
      if (__DEV__) console.warn('[Logements] Failed to load more logements:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, loadingMore, loading, endCursor, fetchMore]);

  // Filtrer par recherche + tri + épinglés en haut
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
      // Épinglés toujours en premier
      const aPinned = pinnedIds.has(a.id) ? 0 : 1;
      const bPinned = pinnedIds.has(b.id) ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;

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
  }, [logements, search, sort, pinnedIds]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch({ first: PAGE_SIZE });
    setRefreshing(false);
  }, []);

  const handleLongPressLogement = useCallback((item: Logement) => {
    hapticMedium();
    setContextMenu(item);
  }, []);

  const handleTogglePin = useCallback((item: Logement) => {
    hapticLight();
    togglePin(item.id);
  }, [togglePin]);

  const getLogementActions = useCallback((item: Logement): ActionSheetItem[] => {
    const logementId = item.id.split('/').pop();
    const pinned = isPinned(item.id);
    return [
      {
        label: pinned ? 'Désépingler' : 'Épingler',
        icon: pinned ? PinOff : Pin,
        color: '#F59E0B',
        onPress: () => handleTogglePin(item),
      },
      {
        label: 'Voir le détail',
        icon: Eye,
        onPress: () => router.push(`/logement/${logementId}`),
      },
      {
        label: 'Modifier',
        icon: Edit3,
        color: '#4F46E5',
        onPress: () => router.push(`/logement/${logementId}/edit`),
      },
      {
        label: 'Créer un EDL',
        icon: FilePlus,
        color: '#059669',
        onPress: () => router.push({ pathname: '/edl/create', params: { logementId: logementId } }),
      },
      {
        label: 'Supprimer',
        icon: Trash2,
        variant: 'danger',
        onPress: () => setDeleteTarget({ id: item.id, nom: item.nom }),
      },
    ];
  }, [isPinned, handleTogglePin, router]);

  const renderItem = useCallback(({ item, index }: { item: Logement; index: number }) => {
    const logementId = item.id.split('/').pop();
    const pinned = pinnedIds.has(item.id);
    return (
    <SwipeableRow
      onDelete={() => setDeleteTarget({ id: item.id, nom: item.nom })}
      onEdit={() => router.push(`/logement/${logementId}/edit`)}
    >
      <AnimatedListItem index={index}>
        <Card
          onPress={() => router.push(`/logement/${logementId}`)}
          onLongPress={() => handleLongPressLogement(item)}
          className="rounded-none border-0"
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl items-center justify-center">
              <Text className="text-3xl">🏠</Text>
            </View>

            <View className="flex-1 ml-3">
              <View className="flex-row items-center gap-1.5">
                <Text className="font-semibold text-gray-900 dark:text-gray-100 flex-shrink" numberOfLines={1}>{item.nom}</Text>
                {pinned && (
                  <Pin size={13} color="#F59E0B" fill="#F59E0B" />
                )}
              </View>
              <View className="flex-row items-center mt-1">
                <MapPin size={12} color={COLORS.gray[400]} />
                <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1 flex-1" numberOfLines={1}>{item.adresse}</Text>
              </View>
              <Text className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{item.ville}</Text>
            </View>

            <View className="items-end mr-2">
              {item.type && (
                <View className="bg-primary-50 dark:bg-primary-500/20 px-2 py-0.5 rounded-md">
                  <Text className="text-xs font-medium text-primary-600 dark:text-primary-300">
                    {formatLogementType(item.type)}
                  </Text>
                </View>
              )}
              {item.surface && (
                <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatSurface(item.surface)}
                </Text>
              )}
            </View>

            <ChevronRight size={20} color={COLORS.gray[400]} />
          </View>
        </Card>
      </AnimatedListItem>
    </SwipeableRow>
    );
  }, [pinnedIds, router, handleLongPressLogement]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={COLORS.primary[600]} />
      </View>
    );
  }, [loadingMore]);

  const listEmptyComponent = useMemo(() => {
    if (loading) return null;
    if (search.trim()) {
      return (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          subtitle={`Aucun logement trouvé pour "${search}"`}
        />
      );
    }
    return (
      <EmptyState
        icon={Home}
        title="Pas encore de logement"
        subtitle="Ajoutez votre premier logement pour commencer"
        actionLabel="Ajouter un logement"
        onAction={() => router.push('/logement/create')}
      />
    );
  }, [loading, search, router]);

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
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" colors={['#6366F1']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          extraData={pinnedIds}
          ListEmptyComponent={listEmptyComponent}
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
      <ActionSheet
        visible={!!contextMenu}
        title={contextMenu?.nom || 'Logement'}
        subtitle={contextMenu ? `${contextMenu.adresse}, ${contextMenu.ville}` : undefined}
        actions={contextMenu ? getLogementActions(contextMenu) : []}
        onClose={() => setContextMenu(null)}
      />
    </SafeAreaView>
  );
}
