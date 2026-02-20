import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { Home, FileText, Clock, CheckCircle } from 'lucide-react-native';
import { User, UserStats } from '../../types';

interface WelcomeCardProps {
  user: User | null;
  stats: UserStats;
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function formatToday(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function WelcomeCard({ user, stats }: WelcomeCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const statItems = [
    { icon: Home, label: 'Logements', value: stats.totalLogements },
    { icon: FileText, label: 'EDL', value: stats.edlCeMois },
    { icon: Clock, label: 'En attente', value: stats.enAttente },
    { icon: CheckCircle, label: 'Signés', value: stats.signes },
  ];

  return (
    <LinearGradient
      colors={isDark ? ['#1e1b4b', '#272063', '#312e81'] : ['#4338CA', '#4F46E5', '#6366F1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
    >
      {/* Greeting */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{formatToday()}</Text>
          <View className="flex-row items-center" style={{ marginTop: 4, gap: 8 }}>
            <Text className="text-white text-2xl font-bold">
              Bonjour, {user?.name?.split(' ')[0] || 'Utilisateur'}
            </Text>
            <Text style={{ fontSize: 26 }}>👋</Text>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View
        className="flex-row"
        style={{
          marginTop: 20,
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 16,
          padding: 4,
        }}
      >
        {statItems.map((item, i) => (
          <View
            key={item.label}
            className="flex-1 items-center"
            style={{
              paddingVertical: 12,
              borderRightWidth: i < statItems.length - 1 ? 1 : 0,
              borderRightColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <item.icon size={18} color="rgba(255,255,255,0.6)" />
            <Text className="text-white text-xl font-bold" style={{ marginTop: 4 }}>
              {item.value}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}
