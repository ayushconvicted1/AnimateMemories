/**
 * Tracking orchestrator — the central module your screens import.
 *
 * It wires together Google Analytics for Firebase (product events & funnels)
 * and Meta App Events (ad attribution), applies App Tracking Transparency on
 * iOS, and binds the pseudonymous Clerk user id.
 *
 * Supported Product Events:
 *  1. sign_up
 *  2. login
 *  3. upload_photo
 *  4. animation_generation_started
 *  5. animation_generation_completed
 *  6. view_animation
 *  7. download_animation
 *  8. share_animation
 *  9. free_credits_granted
 * 10. free_credit_used
 * 11. credits_exhausted
 * 12. view_pricing
 * 13. select_plan
 * 14. begin_checkout
 * 15. purchase
 * 16. subscription_started
 */
import { Platform } from "react-native";
import * as TrackingTransparency from "expo-tracking-transparency";
import * as Crypto from "expo-crypto";
import * as analytics from "./analytics";
import * as meta from "./meta";
import crashlytics from "@react-native-firebase/crashlytics";

export interface TrackingUser {
  /** Pseudonymous Clerk user id (e.g. user.id). */
  id?: string | null;
  email?: string | null;
  signedIn: boolean;
}

export type TrackingStatus =
  | "undetermined"
  | "granted"
  | "denied"
  | "unavailable";

let ready = false;
let advertiserTrackingEnabled = false;

/** Normalize + SHA-256 hash. Used for server-side Conversions API dedupe only. */
export function sha256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalized
  );
}

/** Initialize both SDKs. Call once at startup BEFORE requesting tracking auth. */
export async function initTracking(): Promise<void> {
  if (ready) return;
  await analytics.initAnalytics();
  // Initialize Meta but do NOT enable advertiser tracking yet — that must wait
  // for the ATT decision below.
  meta.initMeta();
  ready = true;
}

/**
 * Request app-tracking permission (iOS) and set Meta advertiser tracking.
 * - iOS: shows the ATT prompt; advertiser tracking is enabled only on GRANTED.
 * - Android: advertiser tracking is enabled by default (no ATT prompt).
 */
export async function requestTrackingPermissionAndInit(): Promise<TrackingStatus> {
  if (Platform.OS === "ios") {
    const available = TrackingTransparency.isAvailable();
    if (!available) {
      // Simulator / IDFA not available — still allow standard app events.
      setAdvertiserTracking(true);
      return "unavailable";
    }
    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    const granted = status === TrackingTransparency.PermissionStatus.GRANTED || (status as string) === "granted";
    setAdvertiserTracking(granted);
    return granted ? "granted" : "denied";
  }

  setAdvertiserTracking(true);
  return "granted";
}

/** Enable/disable Meta advertiser tracking (IDFA-level events). */
export function setAdvertiserTracking(enabled: boolean): void {
  advertiserTrackingEnabled = enabled;
  meta.setMetaAdvertiserTrackingEnabled(enabled);
}

export function isAdvertiserTrackingEnabled(): boolean {
  return advertiserTrackingEnabled;
}

/** Attach the signed-in user to both trackers. Call whenever auth state changes. */
export function setUser(user: TrackingUser): void {
  const id = user.signedIn ? (user.id ?? null) : null;
  analytics.setAnalyticsUserId(id);
  meta.setMetaUserId(id);
  meta.setMetaUserData({ userId: id || undefined, email: user.email });
}

/** Reset identity — call on sign-out. */
export function clearUser(): void {
  analytics.setAnalyticsUserId(null);
  meta.setMetaUserId(null);
  meta.setMetaUserData({});
}

// ─────────────────────────────────────────────────────────────────────────────
// 16 Core Product Events
// ─────────────────────────────────────────────────────────────────────────────

/** 1. User signs up */
export function trackSignUp(method: string): void {
  analytics.logSignUp(method);
  meta.logMetaCompleteRegistration({ method });
}

/** 2. User logs in */
export function trackLogin(method: string): void {
  analytics.logLogin(method);
}

/** 3. Photo uploaded / selected successfully */
export function trackUploadPhoto(params?: {
  source?: string;
  tool?: string;
}): void {
  analytics.logUploadPhoto(params);
}

/** 4. Animation generation started */
export function trackAnimationGenerationStarted(params: {
  animation_type: string;
  model_id?: string;
  duration?: number;
  quality?: string;
  credits_used?: number;
  has_audio?: boolean;
}): void {
  analytics.logAnimationGenerationStarted(params);
}

/** 5. Animation generation completed */
export function trackAnimationGenerationCompleted(params: {
  animation_type: string;
  model_id?: string;
  duration?: number;
  quality?: string;
  generation_time_seconds: number;
  credits_used?: number;
  remaining_credits?: number;
  has_audio?: boolean;
}): void {
  analytics.logAnimationGenerationCompleted(params);
  meta.logMetaEvent("video_created", {
    template_id: params.animation_type,
    duration_seconds: params.duration,
    credits_cost: params.credits_used,
  });
}

/** 6. Animation viewed */
export function trackViewAnimation(params?: {
  animation_id?: string | number;
  animation_type?: string;
}): void {
  analytics.logViewAnimation(params);
}

/** 7. Animation downloaded */
export function trackDownloadAnimation(params?: {
  animation_id?: string | number;
  animation_type?: string;
}): void {
  analytics.logDownloadAnimation(params);
}

/** 8. Animation shared */
export function trackShareAnimation(params?: {
  animation_id?: string | number;
  animation_type?: string;
  method?: string;
}): void {
  analytics.logShareAnimation(params);
}

/** 9. Free credits granted (e.g. signup bonus) */
export function trackFreeCreditsGranted(params: {
  credits_granted: number;
  remaining_credits: number;
}): void {
  analytics.logFreeCreditsGranted(params);
}

/** 10. Free credits used for generation */
export function trackFreeCreditUsed(params: {
  credits_used: number;
  remaining_credits: number;
  animation_type?: string;
}): void {
  analytics.logFreeCreditUsed(params);
}

/** 11. Credits exhausted (e.g. hit zero or blocked for insufficient credits) */
export function trackCreditsExhausted(params: {
  remaining_credits: number;
  required_credits?: number;
}): void {
  analytics.logCreditsExhausted(params);
}

/** 12. Viewed pricing / credits store */
export function trackViewPricing(params?: Record<string, unknown>): void {
  analytics.logViewPricing(params);
}

/** 13. Selected a plan or pack */
export function trackSelectPlan(params: {
  plan: string;
  price: number;
  currency: string;
  credits?: number;
}): void {
  analytics.logSelectPlan(params);
}

/** 14. Began checkout process */
export function trackBeginCheckout(params: {
  plan: string;
  price: number;
  currency: string;
  credits?: number;
}): void {
  analytics.logBeginCheckout(params);
  meta.logMetaInitiatedCheckout({
    value: params.price,
    currency: params.currency,
    content_name: params.plan,
  });
}

/** 15. Purchase completed and verified */
export function trackPurchase(p: {
  transaction_id: string;
  plan?: string;
  price: number;
  currency: string;
  credits?: number;
  remaining_credits?: number;
  amount?: number;
  productId?: string;
}): void {
  analytics.logPurchase(p);
  meta.logMetaPurchase({
    amount: p.price ?? p.amount ?? 0,
    currency: p.currency || "USD",
    productId: p.transaction_id || p.productId || "credit_pack",
    credits: p.credits,
  });
}

/** 16. Subscription started */
export function trackSubscriptionStarted(params: {
  transaction_id: string;
  plan: string;
  price: number;
  currency: string;
}): void {
  analytics.logSubscriptionStarted(params);
  analytics.logSubscribe({
    transaction_id: params.transaction_id,
    plan_name: params.plan,
    value: params.price,
    currency: params.currency,
  });
  meta.logMetaEvent("Subscribe", {
    value: params.price,
    currency: params.currency,
    predicted_ltv: params.price * 12,
  });
}

/** Track Generation Start: fired immediately on Generate/Regenerate click */
export function trackGenerateStart(params: {
  mode?: "animate" | "restore" | "enhance";
  template?: string;
  model?: string;
  duration_s?: number;
  quality?: string;
  aspect_ratio?: string;
  credits_used?: number;
  is_regenerate?: boolean;
  button_label?: "generate" | "regenerate";
}): void {
  analytics.logGenerateStart(params);
}

/** Track Regenerate Button Click */
export function trackRegenerateClick(params: {
  mode?: "animate" | "restore" | "enhance";
  template?: string;
  model?: string;
  duration_s?: number;
  quality?: string;
  aspect_ratio?: string;
  credits_used?: number;
}): void {
  analytics.logRegenerateClick(params);
}

/** Track Generation Failed: captures error type and credits attempted */
export function trackGenerationFailed(params: {
  mode?: "animate" | "restore" | "enhance";
  template?: string;
  model?: string;
  duration_s?: number;
  quality?: string;
  aspect_ratio?: string;
  credits_attempted?: number;
  error_type?: string;
  error_message?: string;
  is_regenerate?: boolean;
}): void {
  analytics.logGenerationFailed(params);
}

/** Track Studio View: fired when entering studio / animate screen */
export function trackStudioView(params?: {
  mode?: "animate" | "restore" | "enhance";
  template?: string;
  screen_name?: string;
}): void {
  analytics.logStudioView(params);
}

/** Track Tool Selection: fired when switching modes between Animate, Restore, Enhance */
export function trackSelectTool(params: {
  tool_name: "animate" | "restore" | "enhance";
  previous_tool?: string | null;
  template?: string;
}): void {
  analytics.logSelectTool(params);
}

/** Track Upload Failure: fired when image selection or upload fails */
export function trackUploadFailed(params: {
  error_type: string;
  error_message: string;
  file_type?: string;
  file_size_mb?: number;
  mode?: string;
}): void {
  analytics.logUploadFailed(params);
}

/** Track Search: fired when user searches templates */
export function trackSearch(params: {
  search_term: string;
  search_type?: string;
  results_count?: number;
}): void {
  analytics.logSearch(params);
}

/** Track View Content: fired when user views or selects a template */
export function trackViewContent(params: {
  template_name: string;
  category?: string;
}): void {
  analytics.logViewContent(params);
  meta.logMetaViewContent({
    content_name: params.template_name,
    content_category: params.category,
  });
}

/** Track Subscribe: fired when subscription activation completes */
export function trackSubscribe(params: {
  transaction_id?: string;
  plan_id?: string;
  plan_name?: string;
  value?: number;
  currency?: string;
  period?: string;
  credits?: number;
}): void {
  analytics.logSubscribe(params);
  meta.logMetaEvent("Subscribe", {
    value: params.value ?? 0,
    currency: params.currency || "USD",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen & Generic Event Tracking
// ─────────────────────────────────────────────────────────────────────────────

export function trackScreen(screenName: string, screenClass?: string): void {
  analytics.logScreen(screenName, screenClass);
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  analytics.logEvent(name, params);
}

export function trackCrash(crash: Error): string | void {
  try {
    crashlytics().recordError(crash);
  } catch (e) {
    console.warn("[crashlytics] recordError", e);
  }
}
