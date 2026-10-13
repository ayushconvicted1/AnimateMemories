# Extending Meta (Facebook) App Events in the Mobile App

A practical, copy-paste guide to **add more Meta events** in `AnimateMemories/`. It builds on the
`services/meta.ts` + `services/tracking.ts` wrappers already wired in. Use it to move beyond the
basics we implemented (purchase, signup, video) and unlock better **ad optimization & reporting**.

---

## 1. How Meta events work here

- **`services/meta.ts`** is the low-level wrapper around `react-native-fbsdk-next`'s `AppEventsLogger`.
  It exposes Meta's **preset events** (`logMetaPurchase`, `logMetaCompleteRegistration`, …) plus one
  generic `logMetaEvent(name, params)`.
- **`services/tracking.ts`** is what your screens call. It fans every event out to **both** GA4 (Firebase)
  and Meta so nothing is tracked twice but both dashboards stay in sync.

> **Rule of thumb:** never import `react-native-fbsdk-next` in a screen. Always go through `services/tracking.ts`.

---

## 2. Meta's standardized event names (must match exactly)

Meta matches events by **exact string**. These are the canonical names for an animation/credits app:

| Meta event | When to fire | Params that matter |
|---|---|---|
| `Purchased` (use `logMetaPurchase`) | Credits/subscription purchased | `fb_currency` (auto), value in `logPurchase` |
| `InitiatedCheckout` | Checkout screen / hosted checkout opened | `content_type`, `content_id`, `num_items` |
| `AddedToCart` | User selects/pins a credit pack or subscription | `content_type: "product"`, `content_id` |
| `CompletedRegistration` | User signs up (email, Google, Apple) | `method` |
| `SpentCredits` | A video generation consumes credits | `content_type`, `content_id`, `num_items` |
| `StartTrial` | A free trial begins | — |
| `Subscribe` | A subscription purchase succeeds | `content_type: "product"`, `content_id` |
| `CompletedTutorial` | Onboarding/tutorial finishes | `content_id` |
| `ViewedContent` | User opens templates, packs, or a single video | `content_type`, `content_id` |
| `AddedPaymentInfo` | User enters payment / saves a card | — |
| `AppInstalled` / `AppOpened` | **Auto-logged** by the Meta SDK when enabled | — |

> Custom events are fine too (e.g. `video_created`), but they won't appear in Meta's preset
> **standard-event** pickers. Use them only for events you'll optimize with a custom conversion, and
> name them consistently (`snake_case` is Meta's convention).

---

## 3. Adding a new Meta event (3 steps)

### Step 1 — add/find the helper in `services/meta.ts`

Preset events mostly exist already. For anything new, add a function that mirrors the pattern:

```ts
// services/meta.ts
export function logMetaViewedContent(params?: Record<string, unknown>): void {
  try {
    AppEventsLogger.logEvent(
      "ViewedContent",
      (params || {}) as Record<string, unknown>
    );
  } catch (e) {
    console.warn("[meta] ViewedContent", e);
  }
}
```

### Step 2 — expose it through `services/tracking.ts`

```ts
// services/tracking.ts
export function trackViewedContent(p?: { contentType?: string; contentId?: string }): void {
  analytics.logEvent("view_item", p || {});          // GA4 side
  meta.logMetaViewedContent(p as Record<string, unknown>); // Meta side
}
```

### Step 3 — call it from the screen

```ts
// app/(tabs)/gallery.tsx  (when a user opens a saved video)
import { trackViewedContent } from "@/services/tracking";
trackViewedContent({ contentType: "video", contentId: videoId });
```

---

## 4. Advanced Matching — link users to their purchases

Already wired in `services/tracking.ts` `setUser()`. On sign-in it sends:

- Meta `external_id` = **Clerk user id**
- Meta `email` = the normalized email (**Meta hashes it on-device** via SHA-256 for Advanced Matching)

**Important:** do **not** pre-hash the values you pass to `setUserData` — Meta hashes them itself, so a
pre-hashed value would be double-hashed and quietly break matching.

To **dedupe with the server-side Conversions API**, hash the email yourself and send the **same**
`external_id` (Clerk id) in both the SDK event and the CAPI event:

```ts
import { sha256 } from "@/services/tracking";
const emailHash = await sha256(userEmail); // normalized SHA-256
// send { event_id: "purchase_123", ... , user_data: { external_id: clerkId, em: emailHash } }
```

---

## 5. Enable app events you care about at the SDK level

`Settings` (`react-native-fbsdk-next`) has a few useful switches you can flip in `meta.initMeta()` today:

```ts
Settings.setAutoLogAppEventsEnabled(true);      // auto AppInstalled/AppOpened/AppLaunch
Settings.setAdvertiserIDCollectionEnabled(true); // collect IDFA for ad attribution
Settings.setAdvertiserTrackingEnabled(true);     // only AFTER ATT grant on iOS
Settings.setDataProcessingOptions(["LDU"], 1);   // Limited Data Use where REQUIRED (California/opt-in)
```

The **advertiser-tracking** flag is the one that most affects whether Meta can attribute installs to
ads. It's already gated behind App Tracking Transparency on iOS in `requestTrackingPermissionAndInit()`.

---

## 6. Requesting tracking consent at the right moment

Calling ATT on cold launch is discouraged by Apple analytics-review. A cleaner pattern:

```ts
// Fire this when the user first reaches a high-value moment (e.g. first "Create" tap)
import { requestTrackingPermissionAndInit } from "@/services/tracking";

// in the onPress of the first "Animate" / "Create" button:
const status = await requestTrackingPermissionAndInit();
if (status === "granted") {
  // now safe to log advertising-centric events
}
```

The plumbing in `tracking.ts` is idempotent, so calling it later is safe (it re-checks `expo-tracking-transparency`).

---

## 7. Testing new Meta events

1. Open **Meta Events Manager → your app → "Test events"**.
2. Run the app in a **dev build** and trigger the event. It appears instantly as a **test event**
   (with a green "Test" badge).
3. Confirm the **event name**, **value**, and **currency** look right.
4. After a real run, check the **Events Manager → Events** table for non-test counts.

> Use test events to verify **before** spending ad budget — a misnamed event silently earns the wrong
> attribution.

---

## 8. Best practices for ad attribution

- **Always send `value` + `currency`** on `Purchase`/`InitiatedCheckout` so Meta can optimize for
  ROAS. Currency should be the ISO code (e.g. `USD`).
- **Keep event names stable.** If you rename `video_created`, historical data splits.
- **One canonical event per action.** Don't fire `Purchase` twice (e.g. also as a custom event) — it
  inflates counts and confuses the algorithm.
- **Set `user_id` / `external_id` consistently** for cross-device + CAPI dedupe.
- **Place `SpentCredits` (or a `video_created` custom conversion) close to the act**, so the app
  learns which ads create engaged, spending users.
- **Handle de-dup** if you ever add the Meta **Conversions API** — send `event_id` in both the SDK and
  CAPI and Meta dedupes on `event_id` + `external_id`.
- **Add `AddedToCart` → `InitiatedCheckout` → `Purchase`** for a full funnel, so Meta can optimize at
  each step, not just at purchase.

---

## 9. Quick reference of Meta conversion categories

When building a campaign, you'll pick an "optimization event." Map your app's actions like this:

| Goal | Fire these Meta events |
|---|---|
| Get sign-ups | `CompletedRegistration` (plus `view_lead`-style custom if needed) |
| Get purchases | `AddedToCart` → `InitiatedCheckout` → `Purchase` |
| Build engaged users | `video_created` / `SpentCredits` / `CompletedTutorial` |
| Subscriptions | `StartTrial` → `Subscribe` |
| Re-engage | `ViewedContent`, `AppOpened` (auto) |

Start with `CompletedRegistration` for acquisition and `Purchase` for ROAS; layer the funnel events in
as your volume grows.
