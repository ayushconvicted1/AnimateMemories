import LandingLogo from "@/components/images/LandingLogo";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { getFontFamily } from "@/constants/Fonts";

const LandingAuth = () => {
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Looping video background */}
      <Video
        source={require("@/assets/videos/Lock.mp4")}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted
        useNativeControls={false}
      />
      <Text style={[styles.welcomeText, { marginBottom: 15 }]}>Welcome To</Text>
      <View style={{ marginBottom: "15%" }}>
        <LandingLogo />
      </View>
      <View style={{ height: "15%" }} />
      <Text style={styles.headingText}>Login or Sign Up</Text>
      <Text style={styles.paraText}>
        Log in to track, request, and stay settled.
      </Text>
      <TouchableOpacity
        style={{
          borderRadius: 8,
          width: "100%",
          alignItems: "center",
        }}
        onPress={() => {
          router.push("/(auth)/login");
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#28D4FA", "#D229FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 8,
            paddingVertical: 15,
            width: "70%",
            marginTop: "2%",
            alignItems: "center",
            ...(Platform.OS === "ios"
              ? {
                  shadowColor: "#000",
                  shadowOpacity: 0.18,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 6,
                }
              : { elevation: 3 }),
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontFamily: getFontFamily("600"),
              fontSize: 18,
            }}
          >
            Login
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          router.push("/(auth)/signup");
        }}
        style={{
          borderRadius: 8,
          width: "100%",
          alignItems: "center",
        }}
        activeOpacity={0.8}
      >
        <View
          style={{
            borderRadius: 8,
            paddingVertical: 15,
            width: "70%",
            marginTop: 20,
            backgroundColor: "#fff",
            alignItems: "center",
            ...(Platform.OS === "ios"
              ? {
                  shadowColor: "#000",
                  shadowOpacity: 0.18,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 6,
                }
              : { elevation: 3 }),
          }}
        >
          <Text
            style={{
              color: "#000",
              fontFamily: getFontFamily("600"),
              fontSize: 18,
            }}
          >
            Create an Account
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeText: {
    fontSize: 28,
    fontFamily: getFontFamily("700"),
    color: "#fff",
    textAlign: "center",
  },
  headingText: {
    fontSize: 24,
    fontFamily: getFontFamily("600"),
    color: "#fff",
    textAlign: "center",
  },
  paraText: {
    fontSize: 16,
    fontFamily: getFontFamily("400"),
    color: "#CBD5E1",
    marginVertical: 10,
    textAlign: "center",
  },
});

export default LandingAuth;
