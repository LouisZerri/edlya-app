import { Stack } from 'expo-router';

export default function EdlLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 300 }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="signature" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="comparatif" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="estimations" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
