import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, SectionList, RefreshControl, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useQuery, useMutation } from '@apollo/client/react';
import { ChevronRight, Calendar, DoorOpen, FileText, Search, ArrowUpDown, Filter, Layers, Building2, Edit3, Eye, FileDown, Trash2, PenTool } from 'lucide-react-native';
import { Header, Card, Badge, SearchBar, EmptyState, SkeletonList, AnimatedListItem, Fab, SwipeableRow, ConfirmSheet, ActionSheet } from '../../components/ui';
import type { ActionSheetItem } from '../../components/ui';
import { hapticMedium } from '../../utils/haptics';
import { GET_ETATS_DES_LIEUX } from '../../graphql/queries/edl';
import { DELETE_ETAT_DES_LIEUX } from '../../graphql/mutations/edl';
import type { EtatDesLieux, EdlStatut} from '../../types';
import { STATUT_BADGE, TYPE_CONFIG } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import { useToastStore } from '../../stores/toastStore';
import { cancelEdlReminders } from '../../hooks/useNotifications';

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

function FilterPill({ type, label, activeFilter, onPress }: { type: FilterType; label: string; activeFilter: FilterType; onPress: (type: FilterType) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onPress(type)}
      className={`px-4 py-2 rounded-full mr-2 ${
        activeFilter === type ? 'bg-primary-600' : 'bg-gray-100 dark:bg-gray-800'
      }`}
    >
      <Text className={activeFilter === type ? 'text-white font-medium' : 'text-gray-600 dark:text-gray-300'}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

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
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  const { success: showSuccess, error: showError } = useToastStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nom: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<EtatDesLieux | null>(null);

  const { data, refetch, loading, fetchMore } = useQuery<EdlData>(GET_ETATS_DES_LIEUX, {
    variables: { first: PAGE_SIZE },
  });

  const [deleteEdl] = useMutation(DELETE_ETAT_DES_LIEUX, {
    refetchQueries: [{ query: GET_ETATS_DES_LIEUX, variables: { first: PAGE_SIZE } }],
  });

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteEdl({ variables: { input: { id: deleteTarget.id } } });
      const edlId = deleteTarget.id.split('/').pop();
      if (edlId) cancelEdlReminders(edlId);
      showSuccess('État des lieux supprimé');
    } catch {
      showError('Erreur lors de la suppression');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteEdl, showSuccess, showError]);

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
    } catch (err) {
      if (__DEV__) console.warn('[Edl] Failed to load more EDLs:', err);
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

  const groupedEdls = useMemo(() => {
    const groups: Record<string, EtatDesLieux[]> = {};
    for (const edl of filteredEdls) {
      const key = edl.logement?.nom || 'Sans logement';
      if (!groups[key]) groups[key] = [];
      groups[key].push(edl);
    }
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((title) => ({ title, data: groups[title] }));
  }, [filteredEdls]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch({ first: PAGE_SIZE });
    setRefreshing(false);
  }, [refetch]);

  const handleLongPressEdl = useCallback((item: EtatDesLieux) => {
    hapticMedium();
    setContextMenu(item);
  }, []);

  const getEdlActions = useCallback((item: EtatDesLieux): ActionSheetItem[] => {
    const edlId = item.id.split('/').pop();
    const actions: ActionSheetItem[] = [
      {
        label: 'Voir le détail',
        icon: Eye,
        onPress: () => router.push(`/edl/${edlId}`),
      },
    ];

    // Modifier uniquement si brouillon ou en_cours
    if (item.statut === 'brouillon' || item.statut === 'en_cours') {
      actions.push({
        label: 'Modifier',
        icon: Edit3,
        color: '#4F46E5',
        onPress: () => router.push(`/edl/${edlId}/edit`),
      });
    }

    // Signer uniquement si terminé
    if (item.statut === 'termine') {
      actions.push({
        label: 'Signer',
        icon: PenTool,
        color: '#059669',
        onPress: () => router.push(`/edl/${edlId}/signature`),
      });
    }

    // PDF dispo si terminé ou signé
    if (item.statut === 'termine' || item.statut === 'signe') {
      actions.push({
        label: 'Exporter PDF',
        icon: FileDown,
        onPress: () => router.push(`/edl/${edlId}`),
      });
    }

    // Supprimer uniquement si pas signé
    if (item.statut !== 'signe') {
      actions.push({
        label: 'Supprimer',
        icon: Trash2,
        variant: 'danger',
        onPress: () => setDeleteTarget({ id: item.id, nom: item.logement?.nom || 'EDL' }),
      });
    }

    return actions;
  }, [router]);

  const renderItem = useCallback(({ item, index }: { item: EtatDesLieux; index: number }) => {
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
            onLongPress={() => handleLongPressEdl(item)}
            className="rounded-none border-0"
          >
            <View className="flex-row items-center">
              <View className={`w-12 h-12 rounded-xl items-center justify-center ${typeConfig.bg}`}>
                <Text className="text-2xl">{typeConfig.icon}</Text>
              </View>

              <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>
                  {item.logement?.nom || 'Logement'}
                </Text>
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

              <View className="flex-row items-center ml-2 gap-2">
                <Badge label={statutBadge.label} variant={statutBadge.variant} />
                <ChevronRight size={18} color={COLORS.gray[400]} />
              </View>
            </View>
          </Card>
        </AnimatedListItem>
      </SwipeableRow>
    );
  }, [router, handleLongPressEdl]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string; data: EtatDesLieux[] } }) => (
    <View className="flex-row items-center px-4 pt-4 pb-2 gap-2">
      <Building2 size={16} color={COLORS.primary[600]} />
      <Text className="text-sm font-semibold text-primary-600 dark:text-primary-400">{section.title}</Text>
      <Text className="text-xs text-gray-400">({section.data.length})</Text>
    </View>
  ), []);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={COLORS.primary[600]} />
      </View>
    );
  }, [loadingMore]);

  const renderEmpty = useMemo(() => {
    if (loading) return null;
    if (search.trim()) {
      return (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          subtitle={`Aucun EDL trouvé pour "${search}"`}
        />
      );
    }
    return (
      <EmptyState
        icon={FileText}
        title="Pas encore d'état des lieux"
        subtitle="Créez votre premier EDL pour commencer à gérer vos biens"
        actionLabel="Créer un EDL"
        onAction={() => router.push('/edl/create')}
      />
    );
  }, [loading, search, router]);

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
            onPress={() => setViewMode(viewMode === 'list' ? 'grouped' : 'list')}
            className={`flex-row items-center px-3 py-2.5 rounded-xl border ${
              viewMode === 'grouped'
                ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <Layers size={16} color={viewMode === 'grouped' ? COLORS.primary[600] : COLORS.gray[500]} />
          </TouchableOpacity>
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
          <FilterPill type="tous" label="Tous" activeFilter={filter} onPress={setFilter} />
          <FilterPill type="entree" label="Entrée" activeFilter={filter} onPress={setFilter} />
          <FilterPill type="sortie" label="Sortie" activeFilter={filter} onPress={setFilter} />
        </ScrollView>
      </View>

      <GestureHandlerRootView style={{ flex: 1 }}>
      {loading && filteredEdls.length === 0 ? (
          <SkeletonList count={5} />
        ) : viewMode === 'grouped' ? (
        <SectionList
          sections={groupedEdls}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" colors={['#6366F1']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
        ) : (
        <FlatList
          data={filteredEdls}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
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
          ListEmptyComponent={renderEmpty}
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
      <ActionSheet
        visible={!!contextMenu}
        title={contextMenu?.logement?.nom || 'État des lieux'}
        subtitle={contextMenu ? `${TYPE_CONFIG[contextMenu.type].label} — ${contextMenu.locataireNom}` : undefined}
        actions={contextMenu ? getEdlActions(contextMenu) : []}
        onClose={() => setContextMenu(null)}
      />
    </SafeAreaView>
  );
}
