import { Redirect, useLocalSearchParams } from 'expo-router';

// Ce fichier gère le deep link edlya://reset-password?token=xxx
// et redirige vers l'écran d'authentification approprié
export default function ResetPasswordRedirect() {
  const { token } = useLocalSearchParams<{ token: string }>();

  // Rediriger vers l'écran de réinitialisation dans le groupe (auth)
  return <Redirect href={`/(auth)/reset-password?token=${token || ''}`} />;
}
