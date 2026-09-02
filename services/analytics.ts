/**
 * Google Analytics for Firebase — mobile GA4 wrapper.
 *
 * This is the mobile equivalent of the web gtag.js snippet. It feeds the
 * Firebase project's GA4 property. No raw PII is ever sent here; user identity
 * is conveyed with the pseudonymous Clerk user id via setUserId (the GA4
 * "User-ID" feature), which keeps data private while letting you join funnels.
 */
import analytics from "@react-native-firebase/analytics";

const safe = async (fn: () => Promise<void>) => {
  try {
    await fn();
  } catch (e) {
    // Firebase Analytics is a no-op in Expo Go / untested dev builds. Never
    // let a tracking failure crash the app.
    console.warn("[analytics]", e);
  }
};

/** Enable collection. Call once at startup (optional GA4 consent gate goes here). */
export function initAnalytics(): Promise<void> {
  return safe(async () => {
    await analytics().setAnalyticsCollectionEnabled(true);
  });
}

/** Disable/enable collection at runtime (e.g. for a per-user consent toggle). */
export function setAnalyticsConsent(enabled: boolean): Promise<void> {
  return safe(async () => {
    await analytics().setAnalyticsCollectionEnabled(enabled);
  });
}

/** Bind the current user to subsequent events using the pseudonymous Clerk id. */
export function setAnalyticsUserId(userId: string | null): Promise<void> {
  return safe(async () => {
    await analytics().setUserId(userId ?? null);
  });
}

/** Standard GA4 "purchase" event — the key conversion event. */
export function logPurchase(params: {
  amount: number;
  currency: string;
  productId: string;
  credits?: number;
}): Promise<void> {
  return safe(async () => {
    await analytics().logEvent("purchase", {
      value: params.amount,
      currency: params.currency,
      transaction_id: params.productId,
      credits: params.credits,
    });
  });
}

/** Standard GA4 "sign_up" event (fires on registration / OAuth login). */
export function logSignUp(method: string): Promise<void> {
  return safe(async () => {
    await analytics().logEvent("sign_up", { method });
  });
}

/** GA4 "screen_view" event for automatic screen tracking. */
export function logScreen(screenName: string, screenClass?: string): Promise<void> {
  return safe(async () => {
    await analytics().logEvent("screen_view", {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  });
}

/** Custom event for a completed video/animation generation. */
export function logVideoCreated(params: {
  videoId?: string;
  templateId?: string;
  creditsCost?: number;
  durationSeconds?: number;
}): Promise<void> {
  return safe(async () => {
    await analytics().logEvent("video_generation", {
      video_id: params.videoId,
      template_id: params.templateId,
      credits_cost: params.creditsCost,
      duration_seconds: params.durationSeconds,
    });
  });
}

/** Escape hatch for any other GA4 event. */
export function logEvent(name: string, params?: Record<string, unknown>): Promise<void> {
  return safe(async () => {
    await analytics().logEvent(name, params || {});
  });
}
