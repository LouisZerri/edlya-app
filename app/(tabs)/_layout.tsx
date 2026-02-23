import { Tabs } from 'expo-router';
import { Home, Building2, FileText, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useQuery } from '@apollo/client/react';
import { COLORS, DARK_COLORS } from '../../utils/constants';
import { GET_USER_STATS } from '../../graphql/queries/stats';

interface StatsData {
  enAttente: { totalCount: number };
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data } = useQuery<StatsData>(GET_USER_STATS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  });
  const enAttente = data?.enAttente?.totalCount || 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary[600],
        tabBarInactiveTintColor: isDark ? COLORS.gray[500] : COLORS.gray[400],
        tabBarStyle: {
          height: 80,
          paddingTop: 8,
          paddingBottom: 24,
          borderTopWidth: 1,
          borderTopColor: isDark ? DARK_COLORS.border : COLORS.gray[200],
          backgroundColor: isDark ? DARK_COLORS.surface : '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logements"
        options={{
          title: 'Logements',
          tabBarIcon: ({ color, size }) => <Building2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="edl"
        options={{
          title: 'EDL',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
          tabBarBadge: enAttente > 0 ? enAttente : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.primary[600],
            fontSize: 11,
            fontWeight: '600',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
