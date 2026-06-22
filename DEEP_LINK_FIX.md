# Deep Link Redirect Fix

## Problem
After completing payment in Stripe checkout, the app wasn't redirecting back from the browser.

## Solution
Implemented comprehensive deep link handling to catch Stripe redirects and navigate back to the app.

## Changes Made

### 1. Root Layout (`app/_layout.tsx`)
- Added deep link listener using `expo-linking`
- Handles both app-open and app-closed scenarios
- Parses `animatememories://payment-success` and `animatememories://payment-cancelled` URLs
- Navigates to payment callback screen with proper parameters

### 2. Credit Screen (`app/(tabs)/credit.tsx`)
- Added AppState listener to refresh credits when app comes to foreground
- This serves as a fallback if deep link doesn't trigger immediately
- Credits refresh automatically when user returns to app

### 3. Deep Link Flow
```
User completes payment in Stripe
  ↓
Stripe redirects to: animatememories://payment-success?session_id=xxx
  ↓
Deep link handler catches the URL
  ↓
Navigates to /payment-callback screen
  ↓
Payment callback verifies payment and shows success message
  ↓
Redirects back to credit screen with updated credits
```

## Testing

### On iOS Simulator:
1. Complete payment in Stripe checkout
2. The browser should close and app should open
3. You should see the payment callback screen
4. After 2 seconds, it redirects to credit screen with updated credits

### On Real Device:
Deep linking works more reliably on real devices. The flow should be:
1. Complete payment
2. Browser closes automatically
3. App opens to payment callback screen
4. Credits are updated

## Important Notes

### Rebuild Required
For deep linking to work properly, you may need to rebuild the app:
```bash
# For iOS
npx expo run:ios

# For Android  
npx expo run:android
```

The deep link scheme is already configured in `app.json`:
```json
{
  "expo": {
    "scheme": "animatememories"
  }
}
```

### Fallback Mechanism
If the deep link doesn't trigger immediately:
- App state listener refreshes credits when app comes to foreground
- Screen focus effect refreshes credits when credit tab is viewed
- Both ensure credits are updated even if deep link is delayed

## Debugging

If deep links still don't work:

1. **Check console logs**: The deep link handler logs when it receives URLs
   - Look for: "Deep link received:" and "Parsed deep link:"

2. **Verify URL format**: Stripe should redirect to:
   - Success: `animatememories://payment-success?session_id=xxx`
   - Cancel: `animatememories://payment-cancelled`

3. **Test deep link manually**:
   ```bash
   # On iOS Simulator
   xcrun simctl openurl booted "animatememories://payment-success?session_id=test123"
   
   # On Android (via ADB)
   adb shell am start -W -a android.intent.action.VIEW -d "animatememories://payment-success?session_id=test123"
   ```

4. **Check app scheme**: Ensure `app.json` has the correct scheme:
   ```json
   {
     "expo": {
       "scheme": "animatememories"
     }
   }
   ```

## Expected Behavior

✅ **Working correctly:**
- Payment completes in Stripe
- Browser closes automatically
- App opens to payment callback screen
- Shows success message with updated credits
- Redirects to credit screen after 2 seconds

❌ **If not working:**
- Payment completes but browser stays open
- App doesn't open automatically
- Credits don't update

In this case, manually close the browser and return to the app. The AppState listener will refresh credits when the app comes to foreground.









