import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="discovery" />
      <Stack.Screen name="purpose" />
      <Stack.Screen name="photo" />
      <Stack.Screen
        name="ready"
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
