import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { Input, Button } from '../../components/ui';
import { useToastStore } from '../../stores/toastStore';
import { API_URL } from '../../utils/constants';
import { COLORS } from '../../utils/constants';
import { TouchableOpacity } from 'react-native';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { control, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (result.success) {
        setEmailSent(true);
        success('Email envoyé !');
      } else {
        showError(result.error || 'Une erreur est survenue');
      }
    } catch (err: unknown) {
      showError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 pt-12">
          <TouchableOpacity onPress={() => router.back()} className="mb-8">
            <ArrowLeft size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center -mt-20">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
              <CheckCircle size={40} color={COLORS.green[600]} />
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
              Email envoyé !
            </Text>

            <Text className="text-gray-500 text-center mb-8 px-4">
              Si un compte existe avec l'adresse{'\n'}
              <Text className="font-medium text-gray-700">{getValues('email')}</Text>
              {'\n'}vous recevrez un lien de réinitialisation.
            </Text>

            <Text className="text-gray-400 text-sm text-center mb-8">
              Pensez à vérifier vos spams.
            </Text>

            <Button
              label="Retour à la connexion"
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
                <Mail size={32} color={COLORS.primary[600]} />
              </View>
            </View>

            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Mot de passe oublié ?
            </Text>

            <Text className="text-gray-500 mb-8">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  placeholder="exemple@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  error={errors.email?.message}
                />
              )}
            />

            <View className="mt-6">
              <Button
                label="Envoyer le lien"
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
