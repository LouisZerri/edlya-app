import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Bell, Palette, LogOut } from 'lucide-react-native';
import { Header, Card } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { COLORS } from '../../utils/constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { info } = useToastStore();

  const handleLogout = () => {
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se deconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            info('A bientot !');
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-gray-50"
      disabled={!onPress}
    >
      <View className="w-10">{icon}</View>
      <Text className="flex-1 text-base text-gray-900">{label}</Text>
      {value && <Text className="text-base text-gray-500 mr-2">{value}</Text>}
      {onPress && <ChevronRight size={22} color={COLORS.gray[400]} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header title="Reglages" />

      <ScrollView className="flex-1 p-4">
        {/* Profil */}
        <Card className="mb-4">
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-primary-100 rounded-full items-center justify-center">
              <Text className="text-2xl">👤</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-900 text-lg">
                {user?.name || 'Utilisateur'}
              </Text>
              <Text className="text-gray-500 text-sm">{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity className="mt-4 py-2 border border-gray-200 rounded-lg">
            <Text className="text-center text-gray-700 font-medium">
              Modifier mon profil
            </Text>
          </TouchableOpacity>
        </Card>

        {/* General */}
        <Text className="text-sm font-medium text-gray-500 mb-2 px-1">GENERAL</Text>
        <Card className="mb-4">
          <SettingRow
            icon={<Bell size={20} color={COLORS.gray[500]} />}
            label="Notifications"
            value="Activees"
          />
          <SettingRow
            icon={<Palette size={20} color={COLORS.gray[500]} />}
            label="Theme"
            value="Clair"
          />
        </Card>

        {/* Deconnexion */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center py-4 mt-4"
        >
          <LogOut size={20} color={COLORS.red[600]} />
          <Text className="text-red-600 font-medium ml-2">Se deconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
