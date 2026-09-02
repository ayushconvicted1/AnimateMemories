/**
 * Tracking orchestrator — the ONLY module your screens should import.
 *
 * It wires together Google Analytics for Firebase (funnel/behaviour) and Meta
 * App Events (ad attribution), applies the App Tracking Transparency decision on
 * iOS, and attaches the pseudonymous Clerk user id so purchases can be joined to
 * the ad that drove them.
 *
 * User-identity policy (no raw PII on the trackers):
 *  - Firebase/GA4: only the Clerk user id via setUserId (GA4 User-ID feature).
 *  - Meta: only the Clerk user id (external_id) + the email, which Meta hashes
 *    on-device for Advanced Matching. Full name is never sent.
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

export function trackPurchase(p: {
  amount: number;
  currency: string;
  productId: string;
  credits?: number;
}): void {
  analytics.logPurchase(p);
  meta.logMetaPurchase(p);
}

export function trackSignUp(method: string): void {
  analytics.logSignUp(method);
  meta.logMetaCompleteRegistration({ method });
}

export function trackInitiatedCheckout(p?: Record<string, unknown>): void {
  analytics.logEvent("begin_checkout", p || {});
  meta.logMetaInitiatedCheckout(p);
}

export function trackAddToCart(p?: Record<string, unknown>): void {
  analytics.logEvent("add_to_cart", p || {});
  meta.logMetaAddToCart(p);
}

export function trackVideoCreated(p: {
  videoId?: string;
  templateId?: string;
  creditsCost?: number;
  durationSeconds?: number;
}): void {
  analytics.logVideoCreated(p);
  meta.logMetaEvent("video_created", p as Record<string, unknown>);
}

export function trackScreen(screenName: string, screenClass?: string): void {
  analytics.logScreen(screenName, screenClass);
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  analytics.logEvent(name, params);
}

export function trackCrash(crash: Error): string | void {
  // Crashlytics is auto-initialized by the module; this records a custom non-fatal
  // error from an error boundary or try/catch.
  try {
    crashlytics().recordError(crash);
  } catch (e) {
    console.warn("[crashlytics] recordError", e);
  }
}
