import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client/react';
import { WelcomeCard, QuickActions, RecentEdlList, LogementsSansEdl, ActivityChart } from '../../components/home';
import type { LogementSansEdl } from '../../components/home';
import { useAuthStore } from '../../stores/authStore';
import { GET_USER_STATS } from '../../graphql/queries/stats';
import { GET_RECENT_EDL } from '../../graphql/queries/edl';
import { API_URL } from '../../utils/constants';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

interface StatsData {
  logements?: { totalCount: number };
  etatDesLieuxes?: { totalCount: number };
  enAttente?: { totalCount: number };
  signes?: { totalCount: number };
  entrees?: { totalCount: number };
  sorties?: { totalCount: number };
}

interface EdlNode {
  id: string;
  type: string;
  dateRealisation: string;
  locataireNom: string;
  statut: string;
  createdAt: string;
  updatedAt: string;
  logement: { nom: string };
}

interface RecentEdlData {
  etatDesLieuxes?: {
    edges: Array<{ node: EdlNode }>;
  };
}

export default function HomeScreen() {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const [refreshing, setRefreshing] = useState(false);
  const [logementsSansEdl, setLogementsSansEdl] = useState<LogementSansEdl[]>([]);
  const [activity, setActivity] = useState<Array<{ date: string; count: number }>>([]);

  const { data: statsData, refetch: refetchStats } = useQuery<StatsData>(GET_USER_STATS);
  const { data: edlData, refetch: refetchEdl } = useQuery<RecentEdlData>(GET_RECENT_EDL);

  const stats = useMemo(() => ({
    totalLogements: statsData?.logements?.totalCount || 0,
    edlCeMois: statsData?.etatDesLieuxes?.totalCount || 0,
    enAttente: statsData?.enAttente?.totalCount || 0,
    signes: statsData?.signes?.totalCount || 0,
    edlEntree: statsData?.entrees?.totalCount || 0,
    edlSortie: statsData?.sorties?.totalCount || 0,
  }), [statsData]);

  const allEdls = edlData?.etatDesLieuxes?.edges?.map((edge) => edge.node) || [];
  const recentEdls = useMemo(() =>
    [...allEdls]
      .sort((a, b) => new Date(b.updatedAt || b.dateRealisation).getTime() - new Date(a.updatedAt || a.dateRealisation).getTime())
      .slice(0, 5),
    [allEdls]
  );

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetchWithAuth(`${API_URL}/stats/dashboard`);
      if (response.ok) {
        const data = await response.json();
        setLogementsSansEdl(data.logements_sans_edl || []);
        setActivity(data.activity || []);
      }
    } catch (err) {
      if (__DEV__) console.warn('[Home] Failed to fetch dashboard data:', err);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      refetchStats();
      refetchEdl();
      fetchDashboardData();
    }, [refetchStats, refetchEdl, fetchDashboardData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchEdl(), fetchDashboardData()]);
    setRefreshing(false);
  }, [refetchStats, refetchEdl, fetchDashboardData]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" colors={['#6366F1']} />
        }
      >
        <View className="pb-8">
          <WelcomeCard user={user} stats={stats} />
          <QuickActions />
          <ActivityChart data={activity} />
          <LogementsSansEdl logements={logementsSansEdl} />
          <RecentEdlList edls={recentEdls} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
