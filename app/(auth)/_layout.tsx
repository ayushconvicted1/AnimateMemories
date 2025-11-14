import { Image } from "expo-image";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AuthLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      {/* Background Gradient */}
      <Image
      source={require("@/assets/images/Background.png")}
        style={[StyleSheet.absoluteFill, { paddingTop: insets.top }]}
      />

      {/* Screens */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </View>
  );
};

export default AuthLayout;
