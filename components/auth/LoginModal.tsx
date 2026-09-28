import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSignIn, useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import Svg, { Path } from "react-native-svg";
import GoogleIcon from "@/components/images/GoogleIcon";
import AppleIcon from "@/components/images/AppleIcon";
import { useAuthGate } from "@/contexts/AuthGateContext";
import { OAUTH_REDIRECT_URL } from "@/constants/OAuth";
import { getFontFamily } from "@/constants/Fonts";

// Ensure WebBrowser session is handled
WebBrowser.maybeCompleteAuthSession();

// Eye icons for show/hide password
const EyeIcon = ({ size = 20, color = "#64748B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeOffIcon = ({ size = 20, color = "#64748B" }) => (
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
      strokeLinejoin="round"
    />
  </Svg>
);

export default function LoginModal() {
  const { showLoginModal, dismissModal, completedAuth, initialView } = useAuthGate();
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();

  // Active view: 'signin' | 'signup' | 'verify-email' | 'forgot-password'
  const [view, setView] = useState<"signin" | "signup" | "verify-email" | "forgot-password">("signin");

  // Sync initial view when modal opens
  useEffect(() => {
    if (showLoginModal) {
      setView(initialView || "signin");
      setError("");
      setSuccessMsg("");
    }
  }, [showLoginModal, initialView]);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [forgotPasswordCode, setForgotPasswordCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"email" | "reset">("email");

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & loading
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // OAuth hooks
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const resetFormState = () => {
    setError("");
    setSuccessMsg("");
    setPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setForgotPasswordCode("");
    setNewPassword("");
    setForgotPasswordStep("email");
  };

  const handleClose = () => {
    resetFormState();
    dismissModal();
  };

  // Google OAuth
  const handleGoogleLogin = async () => {
    if (!isSignInLoaded && !isSignUpLoaded) return;
    setError("");
    setIsGoogleLoading(true);

    try {
      const { createdSessionId, setActive } = await startGoogleOAuth({
        redirectUrl: OAUTH_REDIRECT_URL,
      });

      if (createdSessionId) {
        if (setActive) {
          await setActive({ session: createdSessionId });
        } else if (setSignInActive) {
          await setSignInActive({ session: createdSessionId });
        }
        completedAuth();
      }
    } catch (err: any) {
      console.error("[LoginModal] Google OAuth error:", err);
      const errMsg =
        err.errors?.[0]?.message ||
        err.message ||
        "Failed to sign in with Google. Please try again.";
      if (
        err.errors?.[0]?.code === "session_exists" ||
        errMsg.toLowerCase().includes("session already exists")
      ) {
        completedAuth();
        return;
      }
      setError(errMsg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Apple OAuth
  const handleAppleLogin = async () => {
    if (Platform.OS !== "ios") return;
    if (!isSignInLoaded && !isSignUpLoaded) return;
    setError("");
    setIsAppleLoading(true);

    try {
      const { createdSessionId, setActive } = await startAppleOAuth({
        redirectUrl: OAUTH_REDIRECT_URL,
      });

      if (createdSessionId) {
        if (setActive) {
          await setActive({ session: createdSessionId });
        } else if (setSignInActive) {
          await setSignInActive({ session: createdSessionId });
        }
        completedAuth();
      }
    } catch (err: any) {
      console.error("[LoginModal] Apple OAuth error:", err);
      const errMsg =
        err.errors?.[0]?.message ||
        err.message ||
        "Failed to sign in with Apple. Please try again.";
      if (
        err.errors?.[0]?.code === "session_exists" ||
        errMsg.toLowerCase().includes("session already exists")
      ) {
        completedAuth();
        return;
      }
      setError(errMsg);
    } finally {
      setIsAppleLoading(false);
    }
  };

  // Email Sign In
  const handleSignIn = async () => {
    if (!isSignInLoaded) return;
    setError("");

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedPass) {
      setError("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: trimmedEmail,
        password: trimmedPass,
      });

      if (signInAttempt.status === "complete") {
        await setSignInActive({ session: signInAttempt.createdSessionId });
        completedAuth();
      } else {
        setError("Sign-in incomplete. Please contact support.");
      }
    } catch (err: any) {
      console.error("[LoginModal] Sign In error:", err);
      const errMsg =
        err.errors?.[0]?.message || err.message || "An error occurred during sign-in.";
      const errCode = err.errors?.[0]?.code || "";

      if (
        errCode === "session_exists" ||
        errMsg.toLowerCase().includes("session already exists")
      ) {
        completedAuth();
        return;
      }

      if (errMsg.includes("Invalid authentication credentials")) {
        setError("Invalid email or password. Please check your credentials or create a new account.");
      } else {
        setError(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email Sign Up
  const handleSignUp = async () => {
    if (!isSignUpLoaded) return;
    setError("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPass || !trimmedConfirm) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (trimmedPass.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (trimmedPass !== trimmedConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const signUpAttempt = await signUp.create({
        emailAddress: trimmedEmail,
        password: trimmedPass,
      });

      if (signUpAttempt.status === "complete") {
        await setSignUpActive({ session: signUpAttempt.createdSessionId });
        completedAuth();
      } else if (signUpAttempt.status === "missing_requirements") {
        // Send email verification code
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setView("verify-email");
      } else {
        setError("Sign-up incomplete. Please try again.");
      }
    } catch (err: any) {
      console.error("[LoginModal] Sign Up error:", err);
      let errMsg = "An error occurred during sign up.";
      if (err.errors?.[0]?.message) {
        errMsg = err.errors[0].message;
      } else if (err.message) {
        errMsg = err.message;
      }

      if (errMsg.includes("email_address_exists")) {
        errMsg = "An account with this email already exists. Try signing in.";
      } else if (errMsg.includes("password_too_short")) {
        errMsg = "Password must be at least 8 characters long.";
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Verification Code
  const handleVerifyCode = async () => {
    if (!isSignUpLoaded) return;
    setError("");

    if (!verificationCode.trim()) {
      setError("Please enter the verification code sent to your email.");
      return;
    }

    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === "complete") {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        completedAuth();
      } else {
        setError("Verification incomplete. Please check the code and try again.");
      }
    } catch (err: any) {
      console.error("[LoginModal] Verification error:", err);
      setError(err.errors?.[0]?.message || err.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Request Code
  const handleRequestPasswordReset = async () => {
    if (!isSignInLoaded) return;
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setForgotPasswordStep("reset");
      setSuccessMsg("Reset code sent! Check your inbox.");
    } catch (err: any) {
      console.error("[LoginModal] Forgot Password error:", err);
      setError(err.errors?.[0]?.message || err.message || "Failed to send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Submit Code + New Password
  const handleResetPassword = async () => {
    if (!isSignInLoaded) return;
    setError("");

    if (!forgotPasswordCode.trim() || !newPassword.trim()) {
      setError("Please enter the reset code and a new password.");
      return;
    }

    if (newPassword.trim().length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: forgotPasswordCode.trim(),
        password: newPassword.trim(),
      });

      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        completedAuth();
      } else {
        setError("Password reset failed. Please try again.");
      }
    } catch (err: any) {
      console.error("[LoginModal] Reset Password error:", err);
      setError(err.errors?.[0]?.message || err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showLoginModal) return null;

  return (
    <Modal
      visible={showLoginModal}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.cardContainer}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header Badge */}
              <LinearGradient
                colors={["#38BDF8", "#D229FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.badgeGradient}
              >
                <Text style={styles.badgeText}>
                  {view === "signup"
                    ? "JOIN ANIMATEMEMORIES"
                    : view === "verify-email"
                    ? "EMAIL VERIFICATION"
                    : view === "forgot-password"
                    ? "RECOVER ACCOUNT"
                    : "WELCOME BACK"}
                </Text>
              </LinearGradient>

              {/* Title & Subtitle */}
              <Text style={styles.modalTitle}>
                {view === "signup"
                  ? "Create Your Account"
                  : view === "verify-email"
                  ? "Verify Your Email"
                  : view === "forgot-password"
                  ? "Reset Your Password"
                  : "Sign In to Continue"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {view === "signup"
                  ? "Turn your old pictures into live moments with AI."
                  : view === "verify-email"
                  ? `Enter the 6-digit verification code sent to ${email}.`
                  : view === "forgot-password"
                  ? forgotPasswordStep === "email"
                    ? "Enter your email address and we'll send you a recovery code."
                    : "Enter the recovery code sent to your email and your new password."
                  : "Animate photos, access viral templates, and export high quality videos."}
              </Text>

              {/* Status alerts */}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {successMsg ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>{successMsg}</Text>
                </View>
              ) : null}

              {/* OAuth Buttons (Only on Sign In or Sign Up views) */}
              {(view === "signin" || view === "signup") && (
                <View style={styles.oauthContainer}>
                  {/* Google Button */}
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleLogin}
                    disabled={isGoogleLoading || isLoading || isAppleLoading}
                    activeOpacity={0.85}
                  >
                    {isGoogleLoading ? (
                      <ActivityIndicator size="small" color="#4285F4" />
                    ) : (
                      <View style={styles.oauthInner}>
                        <GoogleIcon size={20} />
                        <Text style={styles.googleButtonText}>
                          {view === "signup" ? "Sign up with Google" : "Continue with Google"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Apple Button (iOS) */}
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={styles.appleButton}
                      onPress={handleAppleLogin}
                      disabled={isAppleLoading || isLoading || isGoogleLoading}
                      activeOpacity={0.85}
                    >
                      {isAppleLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <View style={styles.oauthInner}>
                          <AppleIcon size={20} color="#FFFFFF" />
                          <Text style={styles.appleButtonText}>
                            {view === "signup" ? "Sign up with Apple" : "Continue with Apple"}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Divider */}
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with email</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </View>
              )}

              {/* VIEW: SIGN IN */}
              {view === "signin" && (
                <View style={styles.formContainer}>
                  <Text style={styles.inputLabel}>Email address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <View style={styles.passwordHeaderRow}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TouchableOpacity
                      onPress={() => {
                        resetFormState();
                        setView("forgot-password");
                      }}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                    </TouchableOpacity>
                  </View>

                  {/* Primary CTA Button */}
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSignIn}
                    disabled={isLoading || isGoogleLoading || isAppleLoading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#38BDF8", "#A855F7", "#D229FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButtonFill}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Switch to Sign Up */}
                  <View style={styles.switchRow}>
                    <Text style={styles.switchText}>Don't have an account? </Text>
                    <TouchableOpacity
                      onPress={() => {
                        resetFormState();
                        setView("signup");
                      }}
                    >
                      <Text style={styles.switchLink}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* VIEW: SIGN UP */}
              {view === "signup" && (
                <View style={styles.formContainer}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#94A3B8"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />

                  <Text style={styles.inputLabel}>Email address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Text style={styles.inputLabel}>Password (8+ characters)</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                    </TouchableOpacity>
                  </View>

                  {/* Primary CTA Button */}
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSignUp}
                    disabled={isLoading || isGoogleLoading || isAppleLoading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#38BDF8", "#A855F7", "#D229FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButtonFill}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Create Account</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Switch to Sign In */}
                  <View style={styles.switchRow}>
                    <Text style={styles.switchText}>Already have an account? </Text>
                    <TouchableOpacity
                      onPress={() => {
                        resetFormState();
                        setView("signin");
                      }}
                    >
                      <Text style={styles.switchLink}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* VIEW: VERIFY EMAIL */}
              {view === "verify-email" && (
                <View style={styles.formContainer}>
                  <Text style={styles.inputLabel}>Verification Code</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="123456"
                    placeholderTextColor="#94A3B8"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={8}
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleVerifyCode}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#38BDF8", "#A855F7", "#D229FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButtonFill}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.switchRow}>
                    <TouchableOpacity
                      onPress={() => {
                        resetFormState();
                        setView("signin");
                      }}
                    >
                      <Text style={styles.switchLink}>Back to Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* VIEW: FORGOT PASSWORD */}
              {view === "forgot-password" && (
                <View style={styles.formContainer}>
                  {forgotPasswordStep === "email" ? (
                    <>
                      <Text style={styles.inputLabel}>Registered Email</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="name@example.com"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleRequestPasswordReset}
                        disabled={isLoading}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={["#38BDF8", "#A855F7", "#D229FF"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.gradientButtonFill}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.primaryButtonText}>Send Reset Code</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.inputLabel}>Reset Code</Text>
                      <TextInput
                        style={[styles.input, styles.codeInput]}
                        placeholder="123456"
                        placeholderTextColor="#94A3B8"
                        value={forgotPasswordCode}
                        onChangeText={setForgotPasswordCode}
                        keyboardType="number-pad"
                      />

                      <Text style={styles.inputLabel}>New Password (8+ chars)</Text>
                      <View style={styles.passwordWrapper}>
                        <TextInput
                          style={styles.passwordInput}
                          placeholder="••••••••"
                          placeholderTextColor="#94A3B8"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          style={styles.eyeButton}
                          onPress={() => setShowNewPassword((prev) => !prev)}
                        >
                          {showNewPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={["#38BDF8", "#A855F7", "#D229FF"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.gradientButtonFill}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.primaryButtonText}>Reset Password</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  )}

                  <View style={styles.switchRow}>
                    <TouchableOpacity
                      onPress={() => {
                        resetFormState();
                        setView("signin");
                      }}
                    >
                      <Text style={styles.switchLink}>Back to Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#64748B",
    fontFamily: getFontFamily("600"),
    marginTop: -1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: "center",
  },
  badgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: getFontFamily("700"),
    color: "#0F172A",
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    alignSelf: "flex-start",
    lineHeight: 20,
    marginBottom: 18,
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    fontFamily: getFontFamily("500"),
  },
  successBox: {
    width: "100%",
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    color: "#16A34A",
    fontFamily: getFontFamily("500"),
  },
  oauthContainer: {
    width: "100%",
    marginBottom: 8,
  },
  googleButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  appleButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  oauthInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#1E293B",
  },
  appleButtonText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: getFontFamily("500"),
    color: "#94A3B8",
  },
  formContainer: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#334155",
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    width: "100%",
    height: 46,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: getFontFamily("400"),
    color: "#0F172A",
    marginBottom: 10,
  },
  codeInput: {
    textAlign: "center",
    letterSpacing: 4,
    fontSize: 20,
    fontFamily: getFontFamily("600"),
  },
  passwordHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontFamily: getFontFamily("500"),
    color: "#A855F7",
  },
  passwordWrapper: {
    width: "100%",
    height: 46,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontFamily: getFontFamily("400"),
    color: "#0F172A",
  },
  eyeButton: {
    padding: 6,
  },
  primaryButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButtonFill: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  switchText: {
    fontSize: 14,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
  },
  switchLink: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#D229FF",
  },
});
