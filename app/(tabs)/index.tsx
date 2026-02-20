import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client/react';
import { useState, useCallback, useEffect } from 'react';
import { WelcomeCard, QuickActions, RecentEdlList, LogementsSansEdl } from '../../components/home';
import type { LogementSansEdl } from '../../components/home';
import { useAuthStore } from '../../stores/authStore';
import { GET_USER_STATS } from '../../graphql/queries/stats';
import { GET_RECENT_EDL } from '../../graphql/queries/edl';
import { API_URL } from '../../utils/constants';

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

  const { data: statsData, refetch: refetchStats } = useQuery<StatsData>(GET_USER_STATS);
  const { data: edlData, refetch: refetchEdl } = useQuery<RecentEdlData>(GET_RECENT_EDL);

  const stats = {
    totalLogements: statsData?.logements?.totalCount || 0,
    edlCeMois: statsData?.etatDesLieuxes?.totalCount || 0,
    enAttente: statsData?.enAttente?.totalCount || 0,
    signes: statsData?.signes?.totalCount || 0,
    edlEntree: statsData?.entrees?.totalCount || 0,
    edlSortie: statsData?.sorties?.totalCount || 0,
  };

  const recentEdls = edlData?.etatDesLieuxes?.edges?.map((edge) => edge.node) || [];

  const fetchLogementsSansEdl = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/stats/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLogementsSansEdl(data.logements_sans_edl || []);
      }
    } catch {
      // Silently fail - non-critical feature
    }
  }, [token]);

  useEffect(() => {
    fetchLogementsSansEdl();
  }, [fetchLogementsSansEdl]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchEdl(), fetchLogementsSansEdl()]);
    setRefreshing(false);
  }, [refetchStats, refetchEdl, fetchLogementsSansEdl]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="pt-4 pb-8">
          <WelcomeCard user={user} stats={stats} />
          <QuickActions />
          <LogementsSansEdl logements={logementsSansEdl} />
          <RecentEdlList edls={recentEdls} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
