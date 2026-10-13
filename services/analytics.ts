/**
 * Google Analytics for Firebase — mobile GA4 wrapper.
 *
 * Product event tracking for Animate Memories:
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
 *
 * Parameters include method, plan, price, currency, credits_used,
 * remaining_credits, animation_type, generation_time_seconds, transaction_id.
 * Events fire ONLY after the corresponding action succeeds.
 */
import analytics from "@react-native-firebase/analytics";

const safe = async (eventName: string, params: Record<string, any> | undefined, fn: () => Promise<void>) => {
  try {
    if (__DEV__) {
      console.log(`[Firebase Analytics DebugView] -> ${eventName}:`, params);
    }
    await fn();
  } catch (e) {
    // Firebase Analytics is a no-op in Expo Go / untested dev builds. Never
    // let a tracking failure crash the app.
    console.warn(`[analytics] Failed to log ${eventName}:`, e);
  }
};

/** Enable collection. Call once at startup (optional GA4 consent gate goes here). */
export function initAnalytics(): Promise<void> {
  return safe("init_analytics", undefined, async () => {
    await analytics().setAnalyticsCollectionEnabled(true);
  });
}

/** Disable/enable collection at runtime (e.g. for a per-user consent toggle). */
export function setAnalyticsConsent(enabled: boolean): Promise<void> {
  return safe("set_analytics_consent", { enabled }, async () => {
    await analytics().setAnalyticsCollectionEnabled(enabled);
  });
}

/** Bind the current user to subsequent events using the pseudonymous Clerk id. */
export function setAnalyticsUserId(userId: string | null): Promise<void> {
  return safe("set_user_id", { userId }, async () => {
    await analytics().setUserId(userId ?? null);
  });
}

/** 1. Standard GA4 "sign_up" event. Fires only after registration succeeds. */
export function logSignUp(method: string): Promise<void> {
  return safe("sign_up", { method }, async () => {
    await analytics().logEvent("sign_up", { method });
  });
}

/** 2. Standard GA4 "login" event. Fires only after login succeeds. */
export function logLogin(method: string): Promise<void> {
  return safe("login", { method }, async () => {
    await analytics().logEvent("login", { method });
  });
}

/** 3. "upload_photo" event. Fires only after photo selection/upload succeeds. */
export function logUploadPhoto(params?: {
  source?: string;
  tool?: string;
}): Promise<void> {
  const payload = {
    source: params?.source || "gallery_picker",
    tool: params?.tool || "animate",
  };
  return safe("upload_photo", payload, async () => {
    await analytics().logEvent("upload_photo", payload);
  });
}

/** 4. "animation_generation_started" event. Fires only when generation is successfully initiated. */
export function logAnimationGenerationStarted(params: {
  animation_type: string;
  model_id?: string;
  duration?: number;
  quality?: string;
  credits_used?: number;
  has_audio?: boolean;
}): Promise<void> {
  return safe("animation_generation_started", params, async () => {
    await analytics().logEvent("animation_generation_started", {
      animation_type: params.animation_type,
      model_id: params.model_id || "seedance-1-5-pro",
      duration: params.duration || 5,
      quality: params.quality || "720p",
      credits_used: params.credits_used ?? 4,
      has_audio: Boolean(params.has_audio),
    });
  });
}

/** 5. "animation_generation_completed" event. Fires only when video generation completes successfully. */
export function logAnimationGenerationCompleted(params: {
  animation_type: string;
  model_id?: string;
  duration?: number;
  quality?: string;
  generation_time_seconds: number;
  credits_used?: number;
  remaining_credits?: number;
  has_audio?: boolean;
}): Promise<void> {
  return safe("animation_generation_completed", params, async () => {
    const payload = {
      animation_type: params.animation_type,
      model_id: params.model_id || "seedance-1-5-pro",
      duration: params.duration || 5,
      quality: params.quality || "720p",
      generation_time_seconds: Math.round(params.generation_time_seconds),
      credits_used: params.credits_used ?? 4,
      remaining_credits: params.remaining_credits ?? 0,
      has_audio: Boolean(params.has_audio),
    };
    await analytics().logEvent("animation_generation_completed", payload);

    // Sync with web GA4 / GTM event names
    try {
      await analytics().logEvent("animation_generated", {
        mode: params.animation_type,
        template: params.animation_type,
        model: params.model_id || "seedance_1_5_pro",
        duration_s: params.duration || 5,
        quality: params.quality || "720p",
        credits_used: params.credits_used ?? 4,
      });
      await analytics().logEvent("generate_complete", {
        mode: params.animation_type,
        template: params.animation_type,
        model: params.model_id || "seedance_1_5_pro",
        duration_s: params.duration || 5,
        quality: params.quality || "720p",
        credits_used: params.credits_used ?? 4,
      });
    } catch (e) {
      // non-fatal
    }
  });
}

/** 6. "view_animation" event. Fires when an animation is viewed in preview or gallery player. */
export function logViewAnimation(params?: {
  animation_id?: string | number;
  animation_type?: string;
}): Promise<void> {
  const payload = {
    animation_id: String(params?.animation_id || ""),
    animation_type: params?.animation_type || "animate",
  };
  return safe("view_animation", payload, async () => {
    await analytics().logEvent("view_animation", payload);
  });
}

/** 7. "download_animation" event. Fires only after saving/downloading to device succeeds. */
export function logDownloadAnimation(params?: {
  animation_id?: string | number;
  animation_type?: string;
}): Promise<void> {
  const payload = {
    animation_id: String(params?.animation_id || ""),
    animation_type: params?.animation_type || "animate",
  };
  return safe("download_animation", payload, async () => {
    await analytics().logEvent("download_animation", payload);
  });
}

/** 8. "share_animation" event. Fires only after sharing sheet completes. */
export function logShareAnimation(params?: {
  animation_id?: string | number;
  animation_type?: string;
  method?: string;
}): Promise<void> {
  const payload = {
    animation_id: String(params?.animation_id || ""),
    animation_type: params?.animation_type || "animate",
    method: params?.method || "native_share",
  };
  return safe("share_animation", payload, async () => {
    await analytics().logEvent("share_animation", payload);
  });
}

/** 9. "free_credits_granted" event. Fires when a new user receives initial free credits. */
export function logFreeCreditsGranted(params: {
  credits_granted: number;
  remaining_credits: number;
}): Promise<void> {
  return safe("free_credits_granted", params, async () => {
    await analytics().logEvent("free_credits_granted", {
      credits_granted: params.credits_granted,
      remaining_credits: params.remaining_credits,
    });
  });
}

/** 10. "free_credit_used" event. Fires when free credits are deducted for animation generation. */
export function logFreeCreditUsed(params: {
  credits_used: number;
  remaining_credits: number;
  animation_type?: string;
}): Promise<void> {
  return safe("free_credit_used", params, async () => {
    await analytics().logEvent("free_credit_used", {
      credits_used: params.credits_used,
      remaining_credits: params.remaining_credits,
      animation_type: params.animation_type || "animate",
    });
  });
}

/** 11. "credits_exhausted" event. Fires when credits reach 0 or generation is blocked for insufficient credits. */
export function logCreditsExhausted(params: {
  remaining_credits: number;
  required_credits?: number;
}): Promise<void> {
  return safe("credits_exhausted", params, async () => {
    await analytics().logEvent("credits_exhausted", {
      remaining_credits: params.remaining_credits,
      required_credits: params.required_credits ?? 4,
    });
  });
}

/** 12. "view_pricing" event. Fires when user views the pricing screen. */
export function logViewPricing(params?: Record<string, unknown>): Promise<void> {
  return safe("view_pricing", params, async () => {
    await analytics().logEvent("view_pricing", params || {});
  });
}

/** 13. "select_plan" event. Fires when user selects/taps a pricing tier or credit pack. */
export function logSelectPlan(params: {
  plan: string;
  price: number;
  currency: string;
  credits?: number;
}): Promise<void> {
  return safe("select_plan", params, async () => {
    await analytics().logEvent("select_plan", {
      plan: params.plan,
      price: params.price,
      currency: params.currency,
      credits: params.credits,
    });
  });
}

/** 14. "begin_checkout" event. Fires when user starts the checkout/purchase process. */
export function logBeginCheckout(params: {
  plan: string;
  price: number;
  currency: string;
  credits?: number;
}): Promise<void> {
  return safe("begin_checkout", params, async () => {
    await analytics().logEvent("begin_checkout", {
      plan: params.plan,
      price: params.price,
      currency: params.currency,
      credits: params.credits,
      value: params.price,
    });
  });
}

/** 15. Standard GA4 "purchase" event. Fires only after payment succeeds and is verified. */
export function logPurchase(params: {
  transaction_id: string;
  plan?: string;
  price: number;
  currency: string;
  credits?: number;
  remaining_credits?: number;
  amount?: number;
  productId?: string;
}): Promise<void> {
  const transactionId = params.transaction_id || params.productId || "unknown";
  const priceVal = params.price ?? params.amount ?? 0;
  const payload = {
    transaction_id: transactionId,
    plan: params.plan || transactionId,
    price: priceVal,
    value: priceVal,
    currency: params.currency || "USD",
    credits: params.credits,
    remaining_credits: params.remaining_credits,
  };
  return safe("purchase", payload, async () => {
    await analytics().logEvent("purchase", payload);

    // Sync with web GTM payment_success event
    try {
      await analytics().logEvent("payment_success", {
        transaction_id: transactionId,
        value: priceVal,
        currency: params.currency || "USD",
        payment_status: "success",
        credits: params.credits,
        plan: params.plan,
      });
    } catch (e) {
      // non-fatal
    }
  });
}

/** 16. "subscription_started" event. Fires only after subscription activation succeeds. */
export function logSubscriptionStarted(params: {
  transaction_id: string;
  plan: string;
  price: number;
  currency: string;
}): Promise<void> {
  return safe("subscription_started", params, async () => {
    await analytics().logEvent("subscription_started", {
      transaction_id: params.transaction_id,
      plan: params.plan,
      price: params.price,
      currency: params.currency,
    });
  });
}

/** GA4 "screen_view" event for automatic screen tracking. */
export function logScreen(screenName: string, screenClass?: string): Promise<void> {
  return safe("screen_view", { screen_name: screenName }, async () => {
    await analytics().logEvent("screen_view", {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  });
}

/** Custom legacy event for a completed video/animation generation. */
export function logVideoCreated(params: {
  videoId?: string;
  templateId?: string;
  creditsCost?: number;
  durationSeconds?: number;
}): Promise<void> {
  return safe("video_generation", params, async () => {
    await analytics().logEvent("video_generation", {
      video_id: params.videoId,
      template_id: params.templateId,
      credits_cost: params.creditsCost,
      duration_seconds: params.durationSeconds,
    });
  });
}

/** Track Generation Start: fired immediately when the user clicks Generate or Regenerate. */
export function logGenerateStart(params: {
  mode?: "animate" | "restore" | "enhance";
  template?: string;
  model?: string;
  duration_s?: number;
  quality?: string;
  aspect_ratio?: string;
  credits_used?: number;
  is_regenerate?: boolean;
  button_label?: "generate" | "regenerate";
}): Promise<void> {
  const payload = {
    mode: params.mode || "animate",
    template: params.template || "custom_prompt",
    model: params.model || "seedance_1_5_pro",
    duration_s: params.duration_s ?? 5,
    quality: params.quality || "720p",
    aspect_ratio: params.aspect_ratio || "9:16",
    credits_used: params.credits_used ?? 1,
    is_regenerate: Boolean(params.is_regenerate),
    button_label: params.button_label || (params.is_regenerate ? "regenerate" : "generate"),
  };
  return safe("generate_start", payload, async () => {
    await analytics().logEvent("generate_start", payload);
  });
}

/** Track Regenerate Button Click: reports how many users clicked Regenerate. */
export function logRegenerateClick(params: {
  mode?: "animate" | "restore" | "enhance";
  template?: string;
  model?: string;
  duration_s?: number;
  quality?: string;
  aspect_ratio?: string;
  credits_used?: number;
}): Promise<void> {
  const payload = {
    mode: params.mode || "animate",
    template: params.template || "custom_prompt",
    model: params.model || "seedance_1_5_pro",
    duration_s: params.duration_s ?? 5,
    quality: params.quality || "720p",
    aspect_ratio: params.aspect_ratio || "9:16",
    credits_used: params.credits_used ?? 1,
  };
  return safe("regenerate_click", payload, async () => {
    await analytics().logEvent("regenerate_click", payload);
  });
}

/** Track Generation Failure: captures error type and credits attempted. */
export function logGenerationFailed(params: {
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
}): Promise<void> {
  const payload = {
    mode: params.mode || "animate",
    template: params.template || "custom_prompt",
    model: params.model || "seedance_1_5_pro",
    duration_s: params.duration_s ?? 5,
    quality: params.quality || "720p",
    aspect_ratio: params.aspect_ratio || "9:16",
    credits_attempted: params.credits_attempted ?? 1,
    error_type: params.error_type || "UNKNOWN_ERROR",
    error_message: (params.error_message || "Unknown error").slice(0, 200),
    is_regenerate: Boolean(params.is_regenerate),
  };
  return safe("generation_failed", payload, async () => {
    await analytics().logEvent("generation_failed", payload);
  });
}

/** Track Studio View: fired when user enters the creation workspace. */
export function logStudioView(params?: {
  mode?: "animate" | "restore" | "enhance";
  template?: string;
  screen_name?: string;
}): Promise<void> {
  const payload = {
    mode: params?.mode || "animate",
    template: params?.template || "custom_prompt",
    screen_name: params?.screen_name || "AnimateScreen",
  };
  return safe("studio_view", payload, async () => {
    await analytics().logEvent("studio_view", payload);
  });
}

/** Track Tool Selection: fired when switching modes between Animate, Restore, Enhance. */
export function logSelectTool(params: {
  tool_name: "animate" | "restore" | "enhance";
  previous_tool?: string | null;
  template?: string;
}): Promise<void> {
  const payload = {
    tool_name: params.tool_name,
    previous_tool: params.previous_tool || undefined,
    template: params.template,
  };
  return safe("select_tool", payload, async () => {
    await analytics().logEvent("select_tool", payload);
  });
}

/** Track Upload Failure: fired when image selection or upload fails. */
export function logUploadFailed(params: {
  error_type: string;
  error_message: string;
  file_type?: string;
  file_size_mb?: number;
  mode?: string;
}): Promise<void> {
  const payload = {
    error_type: params.error_type,
    error_message: params.error_message.slice(0, 200),
    file_type: params.file_type,
    file_size_mb: params.file_size_mb,
    mode: params.mode || "animate",
  };
  return safe("upload_failed", payload, async () => {
    await analytics().logEvent("upload_failed", payload);
  });
}

/** Track Search: fired when user searches templates or styles. */
export function logSearch(params: {
  search_term: string;
  search_type?: string;
  results_count?: number;
}): Promise<void> {
  if (!params.search_term || !params.search_term.trim()) return Promise.resolve();
  const payload = {
    search_term: params.search_term.trim(),
    search_type: params.search_type || "templates",
    results_count: params.results_count ?? 0,
  };
  return safe("search", payload, async () => {
    await analytics().logEvent("search", payload);
  });
}

/** Track View Content: fired when user views or selects a specific template. */
export function logViewContent(params: {
  template_name: string;
  category?: string;
}): Promise<void> {
  if (!params.template_name) return Promise.resolve();
  const payload = {
    template_name: params.template_name.trim(),
    category: params.category || "All",
  };
  return safe("view_content", payload, async () => {
    await analytics().logEvent("view_content", payload);
  });
}

/** Standard GA4 "subscribe" event. */
export function logSubscribe(params: {
  transaction_id?: string;
  plan_id?: string;
  plan_name?: string;
  value?: number;
  currency?: string;
  period?: string;
  credits?: number;
}): Promise<void> {
  const payload = {
    transaction_id: params.transaction_id,
    plan_id: params.plan_id,
    plan_name: params.plan_name,
    value: params.value ?? 0,
    currency: params.currency || "USD",
    period: params.period || "monthly",
    credits: params.credits ?? 0,
  };
  return safe("subscribe", payload, async () => {
    await analytics().logEvent("subscribe", payload);
  });
}

/** Escape hatch for any other GA4 event. */
export function logEvent(name: string, params?: Record<string, unknown>): Promise<void> {
  return safe(name, params, async () => {
    await analytics().logEvent(name, params || {});
  });
}
