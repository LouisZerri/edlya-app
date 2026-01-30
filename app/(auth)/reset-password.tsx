import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Input, Button } from '../../components/ui';
import { useToastStore } from '../../stores/toastStore';
import { API_URL, COLORS } from '../../utils/constants';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string().min(8, 'Minimum 8 caractères'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { success, error: showError } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      showError('Token manquant');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResetSuccess(true);
        success('Mot de passe modifié !');
      } else {
        setErrorMessage(result.error || 'Une erreur est survenue');
        showError(result.error || 'Une erreur est survenue');
      }
    } catch (err: any) {
      setErrorMessage('Erreur de connexion au serveur');
      showError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Pas de token
  if (!token) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 pt-12">
          <TouchableOpacity onPress={() => router.back()} className="mb-8">
            <ArrowLeft size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center -mt-20">
            <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
              <AlertCircle size={40} color={COLORS.red[600]} />
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
              Lien invalide
            </Text>

            <Text className="text-gray-500 text-center mb-8 px-4">
              Ce lien de réinitialisation est invalide ou a expiré.
            </Text>

            <Button
              label="Demander un nouveau lien"
              onPress={() => router.replace('/(auth)/forgot-password')}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Succès
  if (resetSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 pt-12">
          <View className="flex-1 items-center justify-center -mt-20">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
              <CheckCircle size={40} color={COLORS.green[600]} />
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
              Mot de passe modifié !
            </Text>

            <Text className="text-gray-500 text-center mb-8 px-4">
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
            </Text>

            <Button
              label="Se connecter"
              onPress={() => router.replace('/(auth)/login')}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-12">
            <TouchableOpacity onPress={() => router.back()} className="mb-8">
              <ArrowLeft size={24} color={COLORS.gray[700]} />
            </TouchableOpacity>

            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-4">
                <Lock size={32} color={COLORS.primary[600]} />
              </View>
            </View>

            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Nouveau mot de passe
            </Text>

            <Text className="text-gray-500 mb-8">
              Choisissez un nouveau mot de passe sécurisé d'au moins 8 caractères.
            </Text>

            {errorMessage && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <Text className="text-red-700 text-sm">{errorMessage}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nouveau mot de passe"
                  value={value}
                  onChangeText={onChange}
                  placeholder="********"
                  secureTextEntry
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirmer le mot de passe"
                  value={value}
                  onChangeText={onChange}
                  placeholder="********"
                  secureTextEntry
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <View className="mt-6">
              <Button
                label="Réinitialiser le mot de passe"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                fullWidth
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
