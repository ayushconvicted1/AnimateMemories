# Mobile Analytics & Product-Event Tracking — AnimateMemories

This document covers the comprehensive **Google Analytics for Firebase** (mobile GA4) event tracking architecture implemented in the AnimateMemories mobile app (`AnimateMemories/`), perfectly synchronized with the web application (`AnimateMemories-1`), along with **Meta App Events** and **Firebase Crashlytics**.

---

## 1. Full Event Catalog (Mobile & Web GA4 Synchronized)

Every event is strictly guarded to fire **only after the corresponding action succeeds** and carries all designated parameters:

| # | Firebase Event Name | Web GTM/GA4 Alias | Trigger File / Function | Parameters Included | When It Fires |
|---|---|---|---|---|---|
| 1 | `sign_up` | — | `components/auth/LoginModal.tsx` | `method` (`"email"`, `"google"`, `"apple"`) | After user account registration succeeds |
| 2 | `login` | — | `LoginModal.tsx`, `auth-callback.tsx` | `method` (`"email"`, `"google"`, `"apple"`, `"oauth"`) | After user signs in successfully |
| 3 | `upload_photo` | — | `app/(tabs)/animate.tsx` (`uploadImageFromUri`) | `source`, `tool` | After photo is picked & uploaded to cloud |
| 4 | `animation_generation_started` | `generate_start` | `animate.tsx` (`handleAnimate`, `handleRestore`, `handleEnhance`) | `animation_type`, `model_id`, `duration`, `quality`, `credits_used`, `has_audio` | Right after generation task is initiated |
| 5 | `animation_generation_completed` | `animation_generated`, `generate_complete` | `animate.tsx` (`pollAnimationStatus`, `handleRestore`, `handleEnhance`) | `animation_type`, `model_id`, `duration`, `quality`, `generation_time_seconds`, `credits_used`, `remaining_credits`, `has_audio` | After video/restored image is confirmed & ready for preview |
| 6 | `view_animation` | `view_content` | `animate.tsx`, `gallery.tsx`, `FullScreenVideoViewer.tsx` | `animation_id`, `animation_type` | When generated video or gallery video is viewed |
| 7 | `download_animation` | — | `animate.tsx`, `gallery.tsx`, `FullScreenVideoViewer.tsx` | `animation_id`, `animation_type` | After video is successfully saved to device media library |
| 8 | `share_animation` | — | `gallery.tsx`, `FullScreenVideoViewer.tsx`, `ShareVideoModal.tsx` | `animation_id`, `animation_type`, `method` | After video is shared via native system sheet |
| 9 | `free_credits_granted` | — | `app/(tabs)/index.tsx` (`fetchUserCredits`) | `credits_granted` (`4`), `remaining_credits` (`4`) | When new user receives free signup bonus (fires once per account) |
| 10 | `free_credit_used` | — | `animate.tsx` (`handleAnimate`, `handleRestore`, `handleEnhance`) | `credits_used`, `remaining_credits`, `animation_type` | When generation successfully completes & credits deduct |
| 11 | `credits_exhausted` | — | `animate.tsx` (`handleAnimate`, `handleRestore`, `handleEnhance`) | `remaining_credits`, `required_credits` | When credits reach 0 or blocked for insufficient credits |
| 12 | `view_pricing` | — | `app/(tabs)/credit.tsx` (`useFocusEffect`) | (none) | When user opens the Credits & Plans screen |
| 13 | `select_plan` | — | `app/(tabs)/credit.tsx` (`onSelectPlan`) | `plan`, `price`, `currency` (`"USD"`), `credits` | When user taps a subscription tier or pack |
| 14 | `begin_checkout` | — | `app/(tabs)/credit.tsx` | `plan`, `price`, `currency` (`"USD"`), `credits` | Right before opening Apple IAP or Stripe checkout |
| 15 | `purchase` | `payment_success` | `credit.tsx`, `payment-callback.tsx` | `transaction_id`, `plan`, `price`, `currency`, `credits`, `remaining_credits` | Immediately after IAP receipt or payment succeeds |
| 16 | `subscription_started` | `subscribe` | `credit.tsx`, `payment-callback.tsx` | `transaction_id`, `plan`, `price`, `currency` | Immediately after subscription activation succeeds |
| 17 | `studio_view` | `studio_view` | `app/(tabs)/animate.tsx` (`useFocusEffect`) | `mode`, `template`, `screen_name` | When user opens or switches into the creation studio |
| 18 | `select_tool` | `select_tool` | `app/(tabs)/animate.tsx` (`toolTextCard`) | `tool_name`, `previous_tool`, `template` | When switching between Animate, Restore, Enhance |
| 19 | `upload_failed` | `upload_failed` | `index.tsx`, `you.tsx`, `animate.tsx` | `error_type`, `error_message`, `file_size_mb`, `mode` | When image pick, oversize (>20MB) or upload fails |
| 20 | `search` | `search` | `TemplateExplorerModal.tsx` | `search_term`, `search_type`, `results_count` | Debounced (600ms) when user searches templates |
| 21 | `view_content` | `view_content` | `TemplateExplorerModal.tsx`, `index.tsx`, `animate.tsx` | `template_name`, `category` | When user views or selects a specific template |
| 22 | `generation_failed` | `generation_failed` | `animate.tsx` (catch blocks) | `mode`, `template`, `model`, `duration_s`, `quality`, `credits_attempted`, `error_type`, `error_message`, `is_regenerate` | When API or prediction polling returns an error |
| 23 | `regenerate_click` | `regenerate_click` | `animate.tsx` (`handleAnimate`) | `mode`, `template`, `model`, `duration_s`, `quality`, `credits_used` | When user clicks Regenerate on an existing output |

---

## 2. Audio Templates & User End View Architecture

Audio templates (`groove-duo`, `mic-drop-rap`, `baby-dance`, etc.) are managed in the mobile UI to match the web experience:

1. **Top-Left "Sound" Badge**:
   - Audio templates automatically display a purple translucent `Sound` badge with a speaker icon in template carousels and modal grids.
   - Identified via database attributes (`hasAudio`, `hasaudio`), slug checks (`mic-drop-rap`, `groove-duo`), or backend preset configuration.

2. **Interactive Sound Control ("Sound Off" / "Sound On")**:
   - In accordance with mobile and web best practices, templates start in a muted state (`Sound Off`) so audio never blasts unexpectedly.
   - Users can tap the bottom-right pill button to toggle audio (`Sound On` with purple highlight and speaker animation).
   - Tapping "Sound On" un-mutes the video and ensures it stays playing in sync.

3. **Strict Mutual Audio Exclusion**:
   - Managed via `services/templateAudioCoordinator.ts`.
   - **Only one template card can ever play sound at a time**.
   - When a user turns sound on for Card B, Card A mutes immediately.
   - When a card scrolls out of the viewport or unmounts, sound stops cleanly.
   - When the user opens the full-screen player or completes generation, template preview sound stops immediately.

4. **Studio Banner & Model Auto-Selection**:
   - In `app/(tabs)/animate.tsx`, selecting an audio template auto-selects an audio-capable model (`seedance-1-5-pro` or `seedance-2-fast`) and displays the dedicated **Audio Motion Performance** banner:
     - 🎤 / 🎵 icon and template title
     - Purple **Audio Enabled** badge
     - Full audio description explaining synchronized background audio, crowd cheering, rap cadence, or beat generation.
   - Automatically passes `shouldGenerateAudio: true` to `api.startAnimatePhoto`.

5. **Audio in Result Video & Full-Screen Player**:
   - The generated video player in `animate.tsx` and the modal player in `FullScreenVideoViewer.tsx` play audio unmuted with full native playback controls.

---

## 3. How to Verify Every Event in Firebase DebugView

Firebase Analytics events are batched to preserve device battery. To stream events in **real time** (within 2-5 seconds):

### On Android
1. Connect an Android device via USB or run an emulator with USB debugging enabled.
2. Run in terminal:
   ```bash
   adb shell setprop debug.firebase.analytics.app com.hexerve.AnimateMemories
   ```
3. Open **Firebase Console** → Project **Animate Memories** → **Analytics** → **DebugView**.
4. Perform actions in the app:
   - Sign up / sign in → watch `sign_up` / `login`
   - Pick/upload photo → watch `upload_photo`
   - Tap template → watch `view_content`
   - Search templates → watch `search`
   - Switch tab → watch `select_tool`
   - Generate video → watch `animation_generation_started`, then `animation_generation_completed`, `free_credit_used`, and `view_animation`
   - Open Credits tab → watch `view_pricing`
   - Select plan / pack → watch `select_plan`
   - Complete checkout → watch `purchase`, `payment_success`, `subscription_started`
5. To disable debug mode after verification:
   ```bash
   adb shell setprop debug.firebase.analytics.app .none.
   ```

### On iOS
1. In Xcode: **Product** → **Scheme** → **Edit Scheme...** → **Run** → **Arguments** tab.
2. In **Arguments Passed On Launch**, add:
   ```
   -FIRDebugEnabled
   ```
3. Run the app and monitor **Firebase Console** → **Analytics** → **DebugView**.
