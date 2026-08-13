import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChevronLeftIcon from "@/components/images/ChevronLeftIcon";
import SearchGradient from "@/components/reusable/SearchGradient";
import TopScrollComponent from "@/components/reusable/TopScrollComponent";
import Svg, { Path } from "react-native-svg";

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

const ForgotPasswordScreen = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Send the password reset code to the user's email
  const onRequestReset = async () => {
    if (!isLoaded) return;
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    
    setIsLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setSuccessfulCreation(true);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.errors?.[0]?.message || err.message || "Failed to send reset code.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the password with the code and the new password
  const onReset = async () => {
    if (!isLoaded) return;
    if (!code.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both the reset code and a new password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        if (router.canDismiss()) router.dismissAll();
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Password reset failed. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.errors?.[0]?.message || err.message || "Failed to reset password.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TopScrollComponent
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeftIcon size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        {successfulCreation ? "Reset Password" : "Forgot Password"}
      </Text>
      
      <Text style={styles.subtitle}>
        {successfulCreation 
          ? "Enter the code sent to your email and your new password." 
          : "Enter your email address and we'll send you a code to reset your password."}
      </Text>

      {!successfulCreation ? (
        <>
          <SearchGradient
            label="Email Address"
            filter={false}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={{ marginTop: 25 }}
            onPress={onRequestReset}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#28D4FA", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <SearchGradient
            label="Reset Code"
            filter={false}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            keyboardType="number-pad"
          />
          <SearchGradient
            label="New Password"
            filter={false}
            password
            value={password}
            onChangeText={setPassword}
            rightIcon={
              <TouchableOpacity onPress={() => {}}>
                <EyeOffIcon size={20} />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={{ marginTop: 25 }}
            onPress={onReset}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#28D4FA", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </TopScrollComponent>
  );
};

export default ForgotPasswordScreen;

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
    fontSize: 27,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#A0A0A0",
    fontSize: 17,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
});
