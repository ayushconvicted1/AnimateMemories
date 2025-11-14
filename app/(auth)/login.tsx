import AppleIcon from "@/components/images/AppleIcon";
import ChevronLeftIcon from "@/components/images/ChevronLeftIcon";
import GoogleIcon from "@/components/images/GoogleIcon";
import SearchGradient from "@/components/reusable/SearchGradient";
import TopScrollComponent from "@/components/reusable/TopScrollComponent";
import { useSignIn } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

// Eye icons
const EyeOffIcon = ({ size = 20, color = "#7A7A7A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.68 21.68 0 015.29-5.29M9.9 4.24A9.77 9.77 0 0112 4c7 0 11 7 11 7a21.8 21.8 0 01-3.31 4.19"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1 1l22 22"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const LoginScreen = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!isLoaded) return;
    
    if (!formData.identifier.trim() || !formData.password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: formData.identifier,
        password: formData.password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        Alert.alert("Login Failed", "Sign-in incomplete. Please contact support.");
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || "An error occurred during sign-in.";
      
      // Provide helpful message for development
      if (errorMessage.includes("Invalid authentication credentials")) {
        Alert.alert(
          "Login Failed", 
          "Invalid credentials. Try creating a new account first, or use:\n\nEmail: test@animatememories.com\nPassword: TestPassword123!"
        );
      } else {
        Alert.alert("Login Failed", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert(
      "OAuth Development Mode", 
      "OAuth sign-in works best on physical devices or in production builds. For development, please use email/password login.\n\nTest credentials:\nEmail: test@example.com\nPassword: password123",
      [
        { text: "Use Test Account", onPress: () => {
          setFormData({ identifier: "test@example.com", password: "password123" });
        }},
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleAppleLogin = async () => {
    Alert.alert(
      "OAuth Development Mode", 
      "OAuth sign-in works best on physical devices or in production builds. For development, please use email/password login.\n\nTest credentials:\nEmail: test@example.com\nPassword: password123",
      [
        { text: "Use Test Account", onPress: () => {
          setFormData({ identifier: "test@example.com", password: "password123" });
        }},
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <TopScrollComponent
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header with back button */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeftIcon size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Log in With</Text>

      {/* Google button wrapped */}
      <TouchableOpacity
        style={[styles.socialBtn, { marginTop: 20 }]}
        onPress={handleGoogleLogin}
        disabled={isLoading}
      >
        <View
          style={styles.socialBtnGradient}
        >
          <GoogleIcon />
          <Text style={styles.socialText}>Log in with Google</Text>
        </View>
      </TouchableOpacity>

      {/* Apple button wrapped */}
      <TouchableOpacity
        style={[styles.socialBtn, { marginTop: 20 }]}
        onPress={handleAppleLogin}
        disabled={isLoading}
      >
        <View
          style={styles.socialBtnGradient}
        >
          <AppleIcon color="#808080" />
          <Text style={styles.socialText}>Log in with Apple</Text>
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <Text style={styles.divider}>Or</Text>

      {/* Inputs */}
      <SearchGradient
        label="Phone Number/EmailID"
        filter={false}
        value={formData.identifier}
        onChangeText={(text) => setFormData({ ...formData, identifier: text })}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <SearchGradient
        label="Password"
        filter={false}
        password
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        rightIcon={
          <TouchableOpacity onPress={() => {}}>
            <EyeOffIcon size={20} />
          </TouchableOpacity>
        }
      />

      {/* Login button */}
      <TouchableOpacity
        style={{ marginTop: 25 }}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <LinearGradient
          colors={["#28D4FA", "#D229FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.loginBtn}
        >
          <Text style={styles.loginText}>
            {isLoading ? "Logging in..." : "Log in"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Sign up link */}
      <TouchableOpacity
        style={styles.signupLink}
        onPress={() => router.push("/(auth)/signup")}
      >
        <Text style={styles.signupText}>
          Don't have an account?{" "}
          <Text style={styles.signupLinkText}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </TopScrollComponent>
  );
};

export default LoginScreen;

// --- STYLES --- //
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    minHeight: "100%",
  },
  title: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  socialBtn: {
    borderRadius: 8,
    overflow: "hidden",
  },
  socialBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: "center",
    backgroundColor: '#fff',
    gap: 10,
  },
  socialText: {
    color: "#000",
    fontSize: 18,
    marginLeft: 10,
  },
  divider: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 15,
  },
  loginBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  signupLink: {
    marginTop: 20,
    alignItems: "center",
  },
  signupText: {
    color: "#fff",
    fontSize: 14,
  },
  signupLinkText: {
    color: "#28D4FA",
    fontWeight: "600",
    textDecorationLine: 'underline'
  },
});
