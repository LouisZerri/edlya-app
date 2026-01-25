import { Stack } from 'expo-router';

export default function EdlLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="signature" />
      <Stack.Screen name="comparatif" />
      <Stack.Screen name="estimations" />
    </Stack>
  );
}
