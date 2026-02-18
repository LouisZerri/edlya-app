import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Save, HelpCircle } from 'lucide-react-native';
import { Header, Card, Input, Button, FaqModal } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { COLORS } from '../../utils/constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const { success, error: showError } = useToastStore();

  const [name, setName] = useState(user?.name || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header title="Profil" />

      <ScrollView className="flex-1 p-4">
        {/* Profil */}
        <Text className="text-sm font-medium text-gray-500 mb-2 px-1">MON PROFIL</Text>
        <Card className="mb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-14 h-14 bg-primary-100 rounded-full items-center justify-center">
              <Text className="text-2xl">👤</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-sm">{user?.email}</Text>
            </View>
          </View>

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

          {hasChanges && (
            <Button
              label="Enregistrer les modifications"
              onPress={handleSave}
              variant="primary"
              icon={<Save size={20} color="white" />}
              loading={isSaving}
            />
          )}
        </Card>

        {/* Aide */}
        <Text className="text-sm font-medium text-gray-500 mb-2 px-1 mt-2">AIDE</Text>
        <Card className="mb-4">
          <TouchableOpacity
            onPress={() => setShowFaq(true)}
            className="flex-row items-center py-2"
          >
            <View className="w-10 h-10 bg-primary-50 rounded-full items-center justify-center">
              <HelpCircle size={20} color={COLORS.primary[600]} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-medium text-gray-800">FAQ</Text>
              <Text className="text-sm text-gray-500">Questions fréquentes</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Déconnexion */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center py-4 mt-4"
        >
          <LogOut size={20} color={COLORS.red[600]} />
          <Text className="text-red-600 font-medium ml-2">Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      <FaqModal visible={showFaq} onClose={() => setShowFaq(false)} />
    </SafeAreaView>
  );
}
