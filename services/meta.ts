/**
 * Meta (Facebook) App Events wrapper — used for ad attribution.
 *
 * Meta is the platform you use to know which ads bring paying customers, so its
 * events carry more marketing intent. Only call log* methods AFTER the user has
 * (a) been granted app-tracking permission on iOS, or (b) consented/gone through
 * your Android consent flow. Guard that in `tracking.ts`.
 */
import { AppEventsLogger, Settings, type Params } from "react-native-fbsdk-next";

function sanitizeParams(params?: Record<string, unknown>): Params {
  if (!params) return {};
  const clean: Params = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" || typeof v === "number") {
      clean[k] = v;
    } else if (typeof v === "boolean") {
      clean[k] = v ? "true" : "false";
    }
  }
  return clean;
}

/** Opt the user into Meta advertiser tracking (required for IDFA / ad attribution). */
export function setMetaAdvertiserTrackingEnabled(enabled: boolean): void {
  try {
    Settings.setAdvertiserTrackingEnabled(enabled);
  } catch (e) {
    console.warn("[meta] setAdvertiserTrackingEnabled", e);
  }
}

/** Initialize the Meta SDK. Call after the tracking-permission decision. */
export function initMeta(opts?: { advertiserTrackingEnabled?: boolean }): void {
  try {
    Settings.initializeSDK();
    if (opts?.advertiserTrackingEnabled) {
      Settings.setAdvertiserTrackingEnabled(true);
    }
  } catch (e) {
    console.warn("[meta] initMeta", e);
  }
}

/**
 * Attach user contact data for Meta's "Advanced Matching". The Meta SDK hashes
 * the email/phone values on-device before sending, so raw PII never leaves the
 * device and you DO NOT pre-hash here (pre-hashing causes double-hashing and
 * silently breaks matching).
 *
 * first_name/last_name are intentionally omitted: setUserData has no name-based
 * matching, and raw names must never be sent to Meta.
 */
export function setMetaUserData(data: {
  userId?: string | null;
  email?: string | null;
}): void {
  try {
    const userData: Record<string, string> = {};
    if (data.userId) userData.external_id = data.userId;
    if (data.email) userData.email = data.email.trim().toLowerCase();
    AppEventsLogger.setUserData(userData);
  } catch (e) {
    console.warn("[meta] setUserData", e);
  }
}

/** Set the Meta user id (used to dedupe with the server-side Conversions API). */
export function setMetaUserId(userId: string | null): void {
  try {
    AppEventsLogger.setUserID(userId || "");
  } catch (e) {
    console.warn("[meta] setUserID", e);
  }
}

/**
 * Standard Meta "Purchase" event with currency and value.
 * Used by Meta Ads Manager to optimize for purchase conversions and ROAS.
 */
export function logMetaPurchase(params: {
  amount: number;
  currency: string;
  productId?: string;
  credits?: number;
}): Promise<void> {
  return new Promise((resolve) => {
    try {
      const extra: Params = {};
      if (params.productId) extra.productId = params.productId;
      if (params.credits !== undefined) extra.credits = params.credits;
      AppEventsLogger.logPurchase(params.amount, params.currency, extra);
    } catch (e) {
      console.warn("[meta] logPurchase", e);
    }
    resolve();
  });
}

/** Meta's predefined "CompletedRegistration" event — fire on sign-up / registration. */
export function logMetaCompleteRegistration(params?: Record<string, unknown>): void {
  try {
    AppEventsLogger.logEvent("CompletedRegistration", sanitizeParams(params));
  } catch (e) {
    console.warn("[meta] CompletedRegistration", e);
  }
}

/** Meta predefined "InitiatedCheckout" event — fire when a checkout starts. */
export function logMetaInitiatedCheckout(params?: Record<string, unknown>): void {
  try {
    AppEventsLogger.logEvent("InitiatedCheckout", sanitizeParams(params));
  } catch (e) {
    console.warn("[meta] InitiatedCheckout", e);
  }
}

/** Meta predefined "AddedToCart" event — fire when credits/subscription is added. */
export function logMetaAddToCart(params?: Record<string, unknown>): void {
  try {
    AppEventsLogger.logEvent("AddedToCart", sanitizeParams(params));
  } catch (e) {
    console.warn("[meta] AddedToCart", e);
  }
}

/** Meta predefined "SpentCredits" event — fire when a video consumes credits. */
export function logMetaSpentCredits(params?: Record<string, unknown>): void {
  try {
    AppEventsLogger.logEvent("SpentCredits", sanitizeParams(params));
  } catch (e) {
    console.warn("[meta] SpentCredits", e);
  }
}

/** Meta predefined "StartTrial" event — fire when a free trial begins. */
export function logMetaStartTrial(params?: Record<string, unknown>): void {
  try {
    AppEventsLogger.logEvent("StartTrial", sanitizeParams(params));
  } catch (e) {
    console.warn("[meta] StartTrial", e);
  }
}

/** Meta predefined "Subscribe" event — fire on a successful subscription. */
export function logMetaSubscribe(params?: Record<string, unknown>): void {
  try {
    AppEventsLogger.logEvent("Subscribe", sanitizeParams(params));
  } catch (e) {
    console.warn("[meta] Subscribe", e);
  }
}

/** Generic/custom Meta event (e.g. "video_created", "app_open", "tutorial_complete"). */
export function logMetaEvent(event: string, params?: Record<string, unknown>): void {
  try {
    AppEventsLogger.logEvent(event, sanitizeParams(params));
  } catch (e) {
    console.warn("[meta] logEvent", e);
  }
}
