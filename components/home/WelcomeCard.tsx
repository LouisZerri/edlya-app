import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, UserStats } from '../../types';

interface WelcomeCardProps {
  user: User | null;
  stats: UserStats;
}

export function WelcomeCard({ user, stats }: WelcomeCardProps) {
  return (
    <View className="mx-4 rounded-2xl overflow-hidden">
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <Text className="text-indigo-200 text-sm">Bonjour,</Text>
        <Text className="text-white text-xl font-bold" style={{ marginTop: 2 }}>
          {user?.name || 'Utilisateur'}
        </Text>

        <View className="flex-row gap-3" style={{ marginTop: 16 }}>
          <View
            className="flex-1 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Logements</Text>
            <Text className="text-white text-lg font-bold">{stats.totalLogements}</Text>
          </View>
          <View
            className="flex-1 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>EDL total</Text>
            <Text className="text-white text-lg font-bold">{stats.edlCeMois}</Text>
          </View>
        </View>

        <View className="flex-row gap-3" style={{ marginTop: 8 }}>
          <View
            className="flex-1 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>En attente</Text>
            <Text className="text-white text-lg font-bold">{stats.enAttente}</Text>
          </View>
          <View
            className="flex-1 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Signés</Text>
            <Text className="text-white text-lg font-bold">{stats.signes}</Text>
          </View>
        </View>

        {(stats.edlEntree > 0 || stats.edlSortie > 0) && (
          <View className="flex-row items-center" style={{ marginTop: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
              {stats.edlEntree} entrée{stats.edlEntree > 1 ? 's' : ''} / {stats.edlSortie} sortie{stats.edlSortie > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
