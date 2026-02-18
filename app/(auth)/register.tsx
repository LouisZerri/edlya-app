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

const registerSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères'),
  email: z.email({ message: 'Email invalide' }),
  password: z.string().min(6, 'Minimum 6 caractères'),
  confirmPassword: z.string(),
  telephone: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore(state => state.register);
  const { success, error: showError } = useToastStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', telephone: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    setLoading(true);
    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
        telephone: data.telephone,
      });
      success('Compte créé avec succès !');
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
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
          <View className="flex-1 px-6 pt-8">
            <View className="items-center mb-8">
              <Image
                source={require('../../assets/edlya-icon.png')}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
              <Text className="text-xl font-bold text-gray-900 mt-3">Créer un compte</Text>
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <Text className="text-red-700 text-sm">{error}</Text>
              </View>
            ) : null}

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nom complet"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Jean Dupont"
                  error={errors.name?.message}
                />
              )}
            />

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
              name="telephone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Téléphone (optionnel)"
                  value={value || ''}
                  onChangeText={onChange}
                  placeholder="06 12 34 56 78"
                  keyboardType="phone-pad"
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

            <View className="mt-2">
              <Button
                label="S'inscrire"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                fullWidth
              />
            </View>

            <View className="flex-row justify-center mt-6 mb-8">
              <Text className="text-gray-500">Déjà un compte ? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-600 font-medium">Se connecter</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
