import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Save, HelpCircle, Sun, Moon, Smartphone, ChevronRight, Mail, Phone, Shield, MapPin } from 'lucide-react-native';
import { Header, Card, Input, Button, FaqModal } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import type { ThemePreference } from '../../stores/themeStore';
import { useThemeStore } from '../../stores/themeStore';
import { useToastStore } from '../../stores/toastStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { COLORS } from '../../utils/constants';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Smartphone },
];

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const { preference, setPreference } = useThemeStore();
  const { gpsEnabled, setGpsEnabled } = useSettingsStore();
  const { success, error: showError } = useToastStore();

  const [name, setName] = useState(user?.name || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.1';

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTelephone(user.telephone || '');
    }
  }, [user]);

  useEffect(() => {
    const nameChanged = name !== (user?.name || '');
    const telChanged = telephone !== (user?.telephone || '');
    setHasChanges(nameChanged || telChanged);
  }, [name, telephone, user]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Le nom est obligatoire');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim(), telephone: telephone.trim() || undefined });
      success('Profil mis à jour');
      setHasChanges(false);
      setShowEditProfile(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        await logout();
        router.replace('/(auth)/login');
      }
    } else {
      Alert.alert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se déconnecter',
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <Header title="Profil" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar + Nom */}
        <View className="items-center pt-6 pb-4">
          <View className="w-20 h-20 bg-primary-600 rounded-full items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-white">{getInitials(user?.name)}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {user?.name || 'Utilisateur'}
          </Text>
          <View className="flex-row items-center mt-1">
            <Mail size={14} color={COLORS.gray[400]} />
            <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1.5">{user?.email}</Text>
          </View>
          {user?.telephone ? (
            <View className="flex-row items-center mt-0.5">
              <Phone size={14} color={COLORS.gray[400]} />
              <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1.5">{user.telephone}</Text>
            </View>
          ) : null}
        </View>

        <View className="px-4">
          {/* Modifier le profil */}
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">COMPTE</Text>
          <Card className="mb-5">
            {showEditProfile ? (
              <View>
                <Input
                  label="Nom complet"
                  value={name}
                  onChangeText={setName}
                  placeholder="Votre nom"
                />
                <Input
                  label="Téléphone"
                  value={telephone}
                  onChangeText={setTelephone}
                  placeholder="06 12 34 56 78"
                  keyboardType="phone-pad"
                />
                <View className="flex-row gap-3 mt-1">
                  <TouchableOpacity
                    onPress={() => {
                      setShowEditProfile(false);
                      setName(user?.name || '');
                      setTelephone(user?.telephone || '');
                    }}
                    className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl items-center"
                  >
                    <Text className="text-gray-600 dark:text-gray-300 font-medium">Annuler</Text>
                  </TouchableOpacity>
                  {hasChanges && (
                    <Button
                      label="Enregistrer"
                      onPress={handleSave}
                      variant="primary"
                      icon={<Save size={18} color="white" />}
                      loading={isSaving}
                    />
                  )}
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowEditProfile(true)}
                className="flex-row items-center"
              >
                <View className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-full items-center justify-center">
                  <Shield size={20} color={COLORS.primary[600]} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-medium text-gray-800 dark:text-gray-200">Modifier mon profil</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">Nom, téléphone</Text>
                </View>
                <ChevronRight size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            )}
          </Card>

          {/* Apparence */}
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">APPARENCE</Text>
          <Card className="mb-5">
            <View className="flex-row gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                const isActive = preference === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setPreference(value)}
                    className={`flex-1 items-center py-3 rounded-xl border ${
                      isActive
                        ? 'bg-primary-600 border-primary-600'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Icon size={22} color={isActive ? '#ffffff' : COLORS.gray[500]} />
                    <Text
                      className={`mt-1.5 font-medium text-sm ${
                        isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Confidentialité */}
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">CONFIDENTIALITÉ</Text>
          <Card className="mb-5">
            <TouchableOpacity
              onPress={() => setGpsEnabled(!gpsEnabled)}
              className="flex-row items-center"
            >
              <View className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full items-center justify-center">
                <MapPin size={20} color={COLORS.blue[600]} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-medium text-gray-800 dark:text-gray-200">Géolocalisation des photos</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {gpsEnabled ? 'Les coordonnées GPS sont ajoutées aux photos' : 'Aucune donnée GPS transmise'}
                </Text>
              </View>
              <View className={`w-12 h-7 rounded-full justify-center ${gpsEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <View className={`w-5 h-5 bg-white rounded-full shadow ${gpsEnabled ? 'ml-6' : 'ml-1'}`} />
              </View>
            </TouchableOpacity>
          </Card>

          {/* Aide */}
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">AIDE</Text>
          <Card className="mb-5">
            <TouchableOpacity
              onPress={() => setShowFaq(true)}
              className="flex-row items-center"
            >
              <View className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center">
                <HelpCircle size={20} color={COLORS.amber[600]} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-medium text-gray-800 dark:text-gray-200">FAQ</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">Questions fréquentes</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </Card>

          {/* Déconnexion */}
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center py-4 mt-2 bg-red-50 dark:bg-red-900/20 rounded-xl"
          >
            <LogOut size={20} color={COLORS.red[600]} />
            <Text className="text-red-600 font-semibold ml-2">Se déconnecter</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6 mb-8">
            Edlya v{appVersion}
          </Text>
        </View>
      </ScrollView>

      <FaqModal visible={showFaq} onClose={() => setShowFaq(false)} />
    </SafeAreaView>
  );
}
