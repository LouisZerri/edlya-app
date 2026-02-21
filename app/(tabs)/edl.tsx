import { View, Text, FlatList, RefreshControl, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useCallback, useMemo } from 'react';
import { Plus, ChevronRight, Calendar, DoorOpen, FileText, Search, ArrowUpDown, Filter } from 'lucide-react-native';
import { Header, Card, Badge, SearchBar, EmptyState, SkeletonList, AnimatedListItem, Fab, SwipeableRow, ConfirmSheet } from '../../components/ui';
import { GET_ETATS_DES_LIEUX } from '../../graphql/queries/edl';
import { DELETE_ETAT_DES_LIEUX } from '../../graphql/mutations/edl';
import { EtatDesLieux, EdlStatut, STATUT_BADGE, TYPE_CONFIG } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import { useToastStore } from '../../stores/toastStore';

const PAGE_SIZE = 20;

interface EdlData {
  etatDesLieuxes?: {
    edges: Array<{ node: EtatDesLieux; cursor: string }>;
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
    totalCount: number;
  };
}

type FilterType = 'tous' | 'entree' | 'sortie';
type FilterStatut = 'tous' | EdlStatut;
type SortOption = 'date_desc' | 'date_asc' | 'nom_asc' | 'nom_desc';

const SORT_LABELS: Record<SortOption, string> = {
  date_desc: 'Plus récent',
  date_asc: 'Plus ancien',
  nom_asc: 'A → Z',
  nom_desc: 'Z → A',
};

export default function EdlScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('tous');
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('tous');
  const [sort, setSort] = useState<SortOption>('date_desc');
  const [showSort, setShowSort] = useState(false);
  const [showStatut, setShowStatut] = useState(false);
  const [search, setSearch] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const { success: showSuccess, error: showError } = useToastStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nom: string } | null>(null);

  const { data, refetch, loading, fetchMore } = useQuery<EdlData>(GET_ETATS_DES_LIEUX, {
    variables: { first: PAGE_SIZE },
  });

  const [deleteEdl] = useMutation(DELETE_ETAT_DES_LIEUX, {
    refetchQueries: [{ query: GET_ETATS_DES_LIEUX, variables: { first: PAGE_SIZE } }],
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEdl({ variables: { input: { id: deleteTarget.id } } });
      showSuccess('État des lieux supprimé');
    } catch {
      showError('Erreur lors de la suppression');
    }
    setDeleteTarget(null);
  };

  const allEdls: EtatDesLieux[] = data?.etatDesLieuxes?.edges?.map((edge) => edge.node) || [];
  const hasNextPage = data?.etatDesLieuxes?.pageInfo?.hasNextPage ?? false;
  const endCursor = data?.etatDesLieuxes?.pageInfo?.endCursor ?? null;

  const handleLoadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: { first: PAGE_SIZE, after: endCursor },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.etatDesLieuxes) return prev;
          return {
            etatDesLieuxes: {
              ...fetchMoreResult.etatDesLieuxes,
              edges: [
                ...(prev.etatDesLieuxes?.edges || []),
                ...fetchMoreResult.etatDesLieuxes.edges,
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

  // Filtrer par type, statut et recherche + tri
  const filteredEdls = useMemo(() => {
    let result = allEdls;

    // Filtre par type
    if (filter !== 'tous') {
      result = result.filter(edl => edl.type === filter);
    }

    // Filtre par statut
    if (filterStatut !== 'tous') {
      result = result.filter(edl => edl.statut === filterStatut);
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

    // Tri
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'date_desc':
          return new Date(b.dateRealisation || b.createdAt).getTime() - new Date(a.dateRealisation || a.createdAt).getTime();
        case 'date_asc':
          return new Date(a.dateRealisation || a.createdAt).getTime() - new Date(b.dateRealisation || b.createdAt).getTime();
        case 'nom_asc':
          return (a.logement?.nom || '').localeCompare(b.logement?.nom || '');
        case 'nom_desc':
          return (b.logement?.nom || '').localeCompare(a.logement?.nom || '');
        default:
          return 0;
      }
    });

    return result;
  }, [allEdls, filter, filterStatut, sort, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch({ first: PAGE_SIZE });
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

  const renderItem = ({ item, index }: { item: EtatDesLieux; index: number }) => {
    const typeConfig = TYPE_CONFIG[item.type];
    const statutBadge = STATUT_BADGE[item.statut];
    const edlId = item.id.split('/').pop();

    return (
      <SwipeableRow
        onDelete={() => setDeleteTarget({ id: item.id, nom: item.logement?.nom || 'EDL' })}
        onEdit={() => router.push(`/edl/${edlId}/edit`)}
      >
        <AnimatedListItem index={index}>
          <Card
            onPress={() => router.push(`/edl/${edlId}`)}
            className="rounded-none border-0"
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
      <Header title="États des lieux" />

      <View className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher..."
            />
          </View>
          <TouchableOpacity
            onPress={() => { setShowStatut(!showStatut); setShowSort(false); }}
            className={`flex-row items-center px-3 py-2.5 rounded-xl border ${
              filterStatut !== 'tous'
                ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <Filter size={16} color={filterStatut !== 'tous' ? COLORS.primary[600] : COLORS.gray[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setShowSort(!showSort); setShowStatut(false); }}
            className="flex-row items-center px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <ArrowUpDown size={16} color={COLORS.gray[500]} />
          </TouchableOpacity>
        </View>
        {/* Statut dropdown */}
        {showStatut && (
          <View className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {(['tous', 'brouillon', 'en_cours', 'termine', 'signe'] as FilterStatut[]).map((s) => {
              const label = s === 'tous' ? 'Tous les statuts' : STATUT_BADGE[s as EdlStatut].label;
              const isActive = filterStatut === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => { setFilterStatut(s); setShowStatut(false); }}
                  className={`px-4 py-2.5 ${isActive ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}
                >
                  <Text className={`text-sm ${isActive ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {/* Sort dropdown */}
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
        {/* Type filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <FilterPill type="tous" label="Tous" />
          <FilterPill type="entree" label="Entrée" />
          <FilterPill type="sortie" label="Sortie" />
        </ScrollView>
      </View>

      <GestureHandlerRootView style={{ flex: 1 }}>
      {loading && filteredEdls.length === 0 ? (
          <SkeletonList count={5} />
        ) : (
        <FlatList
          data={filteredEdls}
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
                  subtitle={`Aucun EDL trouvé pour "${search}"`}
                />
              ) : (
                <EmptyState
                  icon={FileText}
                  title="Pas encore d'état des lieux"
                  subtitle="Créez votre premier EDL pour commencer à gérer vos biens"
                  actionLabel="Créer un EDL"
                  onAction={() => router.push('/edl/create')}
                />
              )
            ) : null
          }
        />
        )}
      </GestureHandlerRootView>
      <Fab onPress={() => router.push('/edl/create')} />
      <ConfirmSheet
        visible={!!deleteTarget}
        title="Supprimer cet état des lieux ?"
        message={`L'état des lieux "${deleteTarget?.nom}" sera définitivement supprimé avec toutes ses données.`}
        confirmLabel="Supprimer"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </SafeAreaView>
  );
}
