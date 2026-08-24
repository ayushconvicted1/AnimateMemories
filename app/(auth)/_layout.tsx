import { ResizeMode, Video } from "expo-av";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

const AuthLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F19" }}>
      {/* Shared persistent looping video background for all initial / auth screens */}
      <Video
        source={require("@/assets/videos/Lock.mp4")}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted
        useNativeControls={false}
      />

      {/* Subtle overlay for legibility across auth forms while keeping the video vibrant */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(11, 15, 25, 0.45)" },
        ]}
        pointerEvents="none"
      />

      {/* Screens */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </View>
  );
};

export default AuthLayout;
