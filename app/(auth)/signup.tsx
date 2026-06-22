import { ChevronLeftIcon } from "@/components/images";
import AppleIcon from "@/components/images/AppleIcon";
import GoogleIcon from "@/components/images/GoogleIcon";
import SearchGradient from "@/components/reusable/SearchGradient";
import TopScrollComponent from "@/components/reusable/TopScrollComponent";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { OAUTH_REDIRECT_URL } from "@/constants/OAuth";

// Debug: Check if Clerk key is loaded
console.log(
  "Clerk publishable key loaded:",
  !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
);

// Complete OAuth flow in browser
WebBrowser.maybeCompleteAuthSession();

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

const SignUpScreen = () => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  // OAuth hooks
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const handleSignup = async () => {
    if (!isLoaded) {
      Alert.alert(
        "Error",
        "Clerk is not loaded yet. Please wait a moment and try again."
      );
      return;
    }

    console.log("Clerk isLoaded:", isLoaded);
    console.log("SignUp object:", !!signUp);

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting signup with:", {
        emailAddress: formData.email,
        passwordLength: formData.password.length,
      });

      if (!signUp) {
        throw new Error("Clerk signUp not initialized");
      }

      const signUpAttempt = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
      });

      console.log("SignUp attempt result:", signUpAttempt);

      if (!signUpAttempt) {
        throw new Error("SignUp attempt returned null/undefined");
      }

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });

        // Try to update user profile with name after successful signup
        try {
          if (signUpAttempt.createdUserId) {
            // We can store the name in user metadata or update profile later
            console.log(
              "User created successfully, name can be updated in profile:",
              formData.fullName
            );
          }
        } catch (profileError) {
          console.log(
            "Profile update failed, but signup succeeded:",
            profileError
          );
        }

        router.replace("/(onboarding)");
      } else if (signUpAttempt.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setPendingVerification(true);
      }
    } catch (err: any) {
      console.error("Signup error:", err);

      let errorMessage = "An error occurred during sign-up.";

      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      // Handle specific error cases
      if (errorMessage.includes("email_address_exists")) {
        errorMessage =
          "An account with this email already exists. Please try logging in instead.";
      } else if (errorMessage.includes("password_pwned")) {
        errorMessage =
          "This password has been found in a data breach. Please choose a different password.";
      } else if (errorMessage.includes("password_too_short")) {
        errorMessage = "Password must be at least 8 characters long.";
      } else if (errorMessage.includes("email_address_invalid")) {
        errorMessage = "Please enter a valid email address.";
      }

      Alert.alert("Signup Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });

        // Try to update user profile with name after verification
        try {
          if (completeSignUp.createdUserId) {
            console.log(
              "User verified successfully, name can be updated in profile:",
              formData.fullName
            );
          }
        } catch (profileError) {
          console.log(
            "Profile update failed, but verification succeeded:",
            profileError
          );
        }

        router.replace("/(onboarding)");
      } else {
        Alert.alert(
          "Verification Failed",
          "Please check your code and try again."
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Verification Failed",
        err.errors?.[0]?.message || "Verification failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!isLoaded) {
      Alert.alert("Error", "Clerk is not loaded yet. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    try {
      const { createdSessionId } = await startGoogleOAuth({
        redirectUrl: OAUTH_REDIRECT_URL,
      });

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace("/(onboarding)");
      } else {
        // User cancelled or error occurred
        console.log("OAuth flow cancelled or incomplete");
      }
    } catch (err: any) {
      console.error("Google OAuth error:", err);
      const errorMessage = err.errors?.[0]?.message || "Failed to sign up with Google. Please try again.";
      Alert.alert("Sign Up Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    if (!isLoaded) {
      Alert.alert("Error", "Clerk is not loaded yet. Please wait a moment and try again.");
      return;
    }

    // Apple Sign In only works on iOS
    if (Platform.OS !== "ios") {
      Alert.alert(
        "Not Available",
        "Apple Sign In is only available on iOS devices."
      );
      return;
    }

    setIsLoading(true);
    try {
      const { createdSessionId } = await startAppleOAuth({
        redirectUrl: OAUTH_REDIRECT_URL,
      });

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace("/(onboarding)");
      } else {
        // User cancelled or error occurred
        console.log("OAuth flow cancelled or incomplete");
      }
    } catch (err: any) {
      console.error("Apple OAuth error:", err);
      const errorMessage = err.errors?.[0]?.message || "Failed to sign up with Apple. Please try again.";
      Alert.alert("Sign Up Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
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

      <Text style={styles.title}>Sign Up With</Text>

      {/* Google button wrapped */}
      <TouchableOpacity
        style={[styles.socialBtn, { marginTop: 20 }]}
        onPress={handleGoogleSignup}
        disabled={isLoading}
      >
        <View style={styles.socialBtnGradient}>
          <GoogleIcon />
          <Text style={styles.socialText}>Sign Up with Google</Text>
        </View>
      </TouchableOpacity>

      {/* Apple button wrapped */}
      <TouchableOpacity
        style={[styles.socialBtn, { marginTop: 20 }]}
        onPress={handleAppleSignup}
        disabled={isLoading}
      >
        <View style={styles.socialBtnGradient}>
          <AppleIcon color="#808080" />
          <Text style={styles.socialText}>Sign Up with Apple</Text>
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <Text style={styles.divider}>Or</Text>

      {!pendingVerification ? (
        <>
          {/* Inputs */}
          <SearchGradient
            label="Full Name"
            filter={false}
            value={formData.fullName}
            onChangeText={(text) =>
              setFormData({ ...formData, fullName: text })
            }
            autoCapitalize="words"
          />
          <SearchGradient
            label="Email Address"
            filter={false}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <SearchGradient
            label="Password"
            filter={false}
            password
            value={formData.password}
            onChangeText={(text) =>
              setFormData({ ...formData, password: text })
            }
            rightIcon={
              <TouchableOpacity onPress={() => {}}>
                <EyeOffIcon size={20} />
              </TouchableOpacity>
            }
          />
          <SearchGradient
            label="Confirm Password"
            filter={false}
            password
            value={formData.confirmPassword}
            onChangeText={(text) =>
              setFormData({ ...formData, confirmPassword: text })
            }
            rightIcon={
              <TouchableOpacity onPress={() => {}}>
                <EyeOffIcon size={20} />
              </TouchableOpacity>
            }
          />

          {/* Signup button */}
          <TouchableOpacity
            style={{ marginTop: 25 }}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#28D4FA", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtn}
            >
              <Text style={styles.loginText}>
                {isLoading ? "Signing up..." : "Sign Up"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Verification */}
          <Text style={styles.verificationText}>
            We've sent a verification code to {formData.email}
          </Text>

          <SearchGradient
            label="Verification Code"
            filter={false}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={{ marginTop: 25 }}
            onPress={handleVerification}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#28D4FA", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtn}
            >
              <Text style={styles.loginText}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 20, alignItems: "center" }}
            onPress={() => setPendingVerification(false)}
          >
            <Text style={styles.backButtonText}>← Back to Sign Up</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Login link */}
      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginLinkText}>Log In</Text>
        </Text>
      </TouchableOpacity>
    </TopScrollComponent>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: "flex-start",
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
    gap: 10,
    backgroundColor: "#fff",
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
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginLinkText: {
    color: "#28D4FA",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  verificationText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  backButtonText: {
    color: "#28D4FA",
    fontSize: 16,
    fontWeight: "500",
  },
});
