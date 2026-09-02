# Mobile Analytics & Attribution Setup — AnimateMemories

This wires **Google Analytics for Firebase** (mobile GA4) and **Meta (Facebook) App Events** into
the Expo app at `AnimateMemories/`, plus **Firebase Crashlytics**. It reuses your existing Firebase
project and keeps **mobile and web reports separate**, per your decisions.

> Web GA4 (`G-0H1P9K2Y5F` in `animatememories-master/app/layout.js`) is **untouched**. Mobile gets its
> own GA4 property — see the note below.

---

## 1. What was added

| File | Purpose |
|---|---|
| `services/analytics.ts` | Firebase / mobile GA4 wrapper. Standard events: `purchase`, `sign_up`, `screen_view`, `video_generation`. **No raw PII.** |
| `services/meta.ts` | Meta App Events wrapper: `logPurchase`, `CompleteRegistration`, `InitiatedCheckout`, `AddToCart`, custom events, `setUserData` Advanced Matching, advertiser-tracking toggle. |
| `services/tracking.ts` | **The only module your screens import.** Orchestrates Firebase + Meta, App Tracking Transparency (iOS), user-identity sync (Clerk id), and a `sha256()` helper for server-side dedupe. |
| `plugins/withFacebookAppEvents.js` | Expo config plugin that injects the Facebook/Meta keys into iOS `Info.plist` and Android `AndroidManifest.xml` (the Meta SDK doesn't ship its own). |
| `app/_layout.tsx` | Initialize SDKs, request ATT, sync Clerk user id, auto-track `screen_view` on route change. |
| `app/(tabs)/credit.tsx` | `trackPurchase` on iOS IAP success; `trackInitiatedCheckout` before the Android/web checkout opens. |
| `app.json` | Config plugins + iOS privacy strings + Facebook keys. |
| `package.json` | New dependencies. |

---

## 2. One-time Firebase setup (your existing project)

You already have a Firebase project — reuse it rather than making a new one.

1. Open [Firebase console](https://console.firebase.google.com) → your project.
2. **Add an Android app** (package `com.hexerve.AnimateMemories`) → download **`google-services.json`**.
3. **Add an iOS app** (bundle id `com.hexerve.AnimateMemories`) → download **`GoogleService-Info.plist`**.
4. Place both files at the **project root of the mobile app**:

   ```
   AnimateMemories/google-services.json
   AnimateMemories/GoogleService-Info.plist
   ```

   (`app.json` already points the `@react-native-firebase/app` plugin at `./google-services.json` and
   `./GoogleService-Info.plist`.)

5. **Enable Analytics**: In Firebase console → Project settings → your iOS/Android app →
   enable "Firebase Analytics" / "Google Analytics". This auto-creates a **GA4 property** for the
   project. Because your web GA4 (`G-0H1P9K2Y5F`) is a gtag/web property, mobile events land in the
   Firebase project's GA4 property — a **different property**, so mobile and web stay in **separate
   reports**.

   > **If your existing Firebase project is already linked to the *same* GA4 property as the web
   > `G-0H1P9K2Y5F`** (i.e. the web property was created *from* Firebase), then Android/iOS will join it
   > as extra **data streams** in that one property. You can still view them separately with a
   > platform/"stream" filter, or (for a hard split) create a second GA4 property and link the Firebase
   > project to that instead.

> **Crashlytics:** if iOS shows a Crashlytics "upload symbols" prompt in Xcode, accept it — it only
> enables symbolication, not required for the native SDK to function.

---

## 3. Install dependencies & build

This is a **bare/prebuild** app (it has `ios/` and `android/`), so these native SDKs work — but you
**must** rebuild the native app. Expo Go is not supported for `@react-native-firebase` / `react-native-fbsdk-next`.

```bash
cd AnimateMemories
npm install                              # installs react-native-firebase, fbsdk-next (already in package.json)
npx expo install expo-tracking-transparency   # ensures the Expo-compatible version
npx expo prebuild                        # regenerates ios/ + android/ with the new native modules
npx expo run:ios     # (or npx expo run:android)
```

If `expo prebuild` errors because the Firebase config files are missing, place them and re-run.

---

## 4. Replace the placeholders

Two values come from your **Meta** account and are currently placeholders in **three** places:

1. `app.json` → `ios.infoPlist.FacebookAppID` = `REPLACE_WITH_META_APP_ID`
2. `app.json` → `ios.infoPlist.FacebookClientToken` = `REPLACE_WITH_META_CLIENT_TOKEN`
3. `app.json` → `plugins` → `./plugins/withFacebookAppEvents` → `facebookAppId` / `facebookClientToken`

Get them from [Meta Business Suite → Events Manager → Data sources → your app](https://business.facebook.com/events_manager/)
(the **App ID** on the app's settings page, and the **App Secret/Client Token** under
App Settings → Basic). Optional: if you only fire app events (no Audience Network / ads we need server
token), the **Client Token can be omitted** — remove the `facebookClientToken` key and the
`FacebookClientToken` infoPlist line.

`FacebookDisplayName` / meta-data already default to "AnimateMemories".

---

## 5. iOS: App Tracking Transparency (ATT)

Already wired in `app/_layout.tsx` via `services/tracking.ts`:

- **`requestTrackingPermissionAndInit()`** calls `expo-tracking-transparency` on iOS; on **granted**
  it calls `Settings.setAdvertiserTrackingEnabled(true)` so Meta can read IDFA for ad attribution.
  On **denied** it still logs standard app events (they just aren't attributed to an ad).
- Android auto-enables advertiser tracking (no ATT prompt).

The prompt text comes from `NSUserTrackingUsageDescription` (already set in `app.json`). Change the
wording to match your privacy policy if needed.

> **Privacy compliance:** asking for tracking **before** the user has value is against store policy.
> Best practice is to request it on first entry to the value moment (e.g. first "Create" tap) — see the
> "Requesting consent at the right moment" section in `META_EXTENSION_GUIDE.md`.

---

## 6. iOS build gotcha — RN 0.81 + Firebase modular headers

On **React Native 0.81 / New Architecture** the Firebase pods (Analytics/Crashlytics) can fail to build
with Swift-pod/modular-header errors. If you hit it, add this to `AnimateMemories/ios/Podfile` inside the
`target ... do` block:

```ruby
# in ios/Podfile
use_frameworks!
# or, if use_frameworks conflicts with other pods, scope the fix:
pod 'FirebaseCore', :modular_headers => true
```

Then `cd ios && pod install`. This is the documented workaround for the RN 0.81 + Firebase build issue
([issue #8827](https://github.com/invertase/react-native-firebase/issues/8827)). If `use_frameworks!`
already exists, prefer the `:modular_headers => true` per-pod option.

---

## 7. Event call sites (already wired vs. where to add)

Already wired:

- **Purchase (iOS IAP)** — `app/(tabs)/credit.tsx`, in `if (result.success)`:
  `trackPurchase({ amount, currency: 'USD', productId, credits })`
- **Initiated checkout (Android/web hosted flow)** — same file, before `WebBrowser.openAuthSessionAsync`:
  `trackInitiatedCheckout({ value, currency: 'USD', productId, credits })`

Still to add (copy-paste):

### Sign-up / registration (`app/(auth)/signup.tsx`)
After a successful account creation / OAuth callback:
```ts
import { trackSignUp } from "@/services/tracking";
// ...
trackSignUp("email"); // or "google" / "apple"
```

### Video completion (`app/(tabs)/animate.tsx`)
Where the animation finishes rendering / is generated successfully:
```ts
import { trackVideoCreated } from "@/services/tracking";
// ...
trackVideoCreated({ videoId, templateId, creditsCost, durationSeconds });
```

---

## 8. Verify your events

**Google / GA4 (Firebase):**
1. Build & run → open the app, trigger a `sign_up` / `purchase`.
2. In Firebase console → **Analytics → DebugView** (turn on "Debug mode" in the app by long-pressing
   the log in Expo dev / or add `analytics().setAnalyticsCollectionEnabled(true)` and use a debug build).
3. Confirm `purchase`, `sign_up`, `screen_view` appear.

**Meta:**
1. In **Events Manager → your app → "Test events"**, open the app and trigger the event. It should
   appear as a **test event** (isMetaEvent) with `_eventName`, `_value`, `_currency`.
2. Check **App Events** under the app's Insights for the live (non-test) count after a real run.

**Crashlytics:**
1. Force a crash (or temporarily `throw` in dev) → confirm it appears in Firebase → **Crashlytics**.

---

## 9. Consent & privacy notes

- **No raw PII is sent.** GA4 gets the pseudonymous Clerk user id (`user_id`). Meta gets the Clerk id as
  `external_id` + the email, which Meta **hashes on-device** for Advanced Matching (raw names are never
  sent; `setUserData` has no name-based matching anyway).
- **If you ever do GA4/Meta server-side** (Conversions API dedupe), use `sha256()` from
  `services/tracking.ts` to hash the email yourself, and pass the same Clerk id so it dedupes.
- To respect GDPR/consent, gate `setAnalyticsConsent(true)` / `setAdvertiserTracking(true)` on your
  consent state. The plumbing is exposed in `services/tracking.ts`.

---

## 10. Files-to-change during the store review / privacy labels

When submitting, Apple asks for **tracking** — you now use App Tracking Transparency, so declare
"Tracking" = **Yes** ("Data Used to Track You": Purchases, User ID, Product Interaction is the norm for
ad attribution). Google Play requires a **Data safety** form: declare "App activity", "App info and
performance" (Crashlytics), and "Device or other IDs" for advertising.
