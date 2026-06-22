import LandingLogo from "@/components/images/LandingLogo";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LandingAuth = () => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={[styles.whiteText, { marginBottom: 15 }]}>Welcome To</Text>
      <View style={{ marginBottom: "15%" }}>
        <LandingLogo />
      </View>
      {/* <Image
        source={require("@/assets/images/HandsIcon.png")}
        style={{
          height: 186,
          width: 244,
          marginBottom: "15%",
        }}
      /> */}
      <View style={{height: '15%'}} />
      <Text style={styles.whiteText}>Login or Sign Up</Text>
      <Text style={styles.paraText}>
        Log in to track, request, and stay settled.
      </Text>
      <TouchableOpacity
        style={{
          borderRadius: 5,
          width: "100%",
          alignItems: "center",
        }}
        onPress={() => {
          router.push("/(auth)/login");
        }}
      >
        <LinearGradient
          colors={["#28D4FA", "#D229FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 5,
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
              fontWeight: "500",
              fontSize: 16,
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
          borderRadius: 5,
          width: "100%",
          alignItems: "center",
        }}
      >
        <View
          style={{
            borderRadius: 5,
            paddingVertical: 15,
            width: "70%",
            marginTop: 20,
            backgroundColor: '#fff',
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
              fontWeight: "500",
              fontSize: 16,
            }}
          >
            Create an Account
          </Text>
        </View>
      </TouchableOpacity>
      {/* <TouchableOpacity
        onPress={() => {
          // router.replace("/(tabs)");
        }}
      >
        <Text
          style={[
            styles.whiteText,
            {
              fontSize: 16,
              marginTop: "7%",
            },
          ]}
        >
          Later
        </Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  whiteText: {
    fontSize: 24,
    fontWeight: "500",
    color: "#fff",
    textAlign: "center",
  },
  paraText: {
    fontSize: 14,
    color: "#A6A6A6",
    marginVertical: 10,
  },
});
export default LandingAuth;
