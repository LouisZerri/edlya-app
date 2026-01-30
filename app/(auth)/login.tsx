import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Input, Button } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';

const loginSchema = z.object({
  email: z.email({ message: 'Email invalide' }),
  password: z.string().min(6, 'Minimum 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore(state => state.login);
  const { success, error: showError } = useToastStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      await login(data.email, data.password);
      success('Connexion reussie !');
      router.replace('/(tabs)');
    } catch (err: any) {
      const message = err.message || 'Erreur de connexion';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

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
            <View className="items-center mb-10">
              <Image
                source={require('../../assets/edlya-icon.png')}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
              <Text className="text-gray-500 mt-4">Gestion d'etats des lieux</Text>
            </View>

            <Text className="text-xl font-semibold text-gray-900 mb-6">Connexion</Text>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <Text className="text-red-700 text-sm">{error}</Text>
              </View>
            ) : null}

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
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Mot de passe"
                  value={value}
                  onChangeText={onChange}
                  placeholder="********"
                  secureTextEntry
                  error={errors.password?.message}
                />
              )}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              className="mb-6"
            >
              <Text className="text-primary-600 text-sm text-right">
                Mot de passe oublie ?
              </Text>
            </TouchableOpacity>

            <Button
              label="Se connecter"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              fullWidth
            />

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500">Pas encore de compte ? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-600 font-medium">S'inscrire</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
