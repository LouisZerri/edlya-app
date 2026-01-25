import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client/react';
import { useState, useCallback } from 'react';
import { WelcomeCard, QuickActions, RecentEdlList } from '../../components/home';
import { useAuthStore } from '../../stores/authStore';
import { GET_USER_STATS } from '../../graphql/queries/stats';
import { GET_RECENT_EDL } from '../../graphql/queries/edl';

interface StatsData {
  logements?: { totalCount: number };
  etatDesLieuxes?: { totalCount: number };
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
  const [refreshing, setRefreshing] = useState(false);

  const { data: statsData, refetch: refetchStats } = useQuery<StatsData>(GET_USER_STATS);
  const { data: edlData, refetch: refetchEdl } = useQuery<RecentEdlData>(GET_RECENT_EDL);

  const stats = {
    totalLogements: statsData?.logements?.totalCount || 0,
    edlCeMois: statsData?.etatDesLieuxes?.totalCount || 0,
  };

  const recentEdls = edlData?.etatDesLieuxes?.edges?.map((edge) => edge.node as any) || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchEdl()]);
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="pt-4 pb-8">
          <WelcomeCard user={user} stats={stats} />
          <QuickActions />
          <RecentEdlList edls={recentEdls} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
