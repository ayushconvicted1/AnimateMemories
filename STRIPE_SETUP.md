# Stripe Payment Integration - Mobile App

## ✅ Implementation Complete

Stripe payment integration has been successfully added to the mobile app and synced with the web app.

## 🔑 Environment Variables

The mobile app now uses the same Stripe configuration as the web app. Environment variables are automatically synced using the `sync-env.js` script.

### Synced Variables:
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (from web's `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- `EXPO_PUBLIC_API_BASE_URL` - API base URL (from web's `NEXT_PUBLIC_BASE_URL`)
- `EXPO_PUBLIC_CLOUDINARY_*` - Cloudinary configuration
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication key

### To Sync Environment Variables:

Run the sync script:
```bash
cd AnimateMemories
node scripts/sync-env.js
```

This will read `.env.local` from the web app (`animatememories-master`) and update the mobile app's `.env` file.

## 💳 Payment Flow

### How It Works:

1. **User selects a credit pack** on the Credit screen
2. **Taps "Get Pack" button** - Opens Stripe Checkout in browser
3. **Completes payment** - Stripe processes the payment
4. **Webhook updates credits** - Backend webhook automatically adds credits to user account
5. **App refreshes credits** - When user returns to app, credits are refreshed

### Implementation Details:

- **Credit Screen** (`app/(tabs)/credit.tsx`):
  - Displays credit packs (Starter, Popular, Pro)
  - Handles payment initiation
  - Opens Stripe Checkout in browser using `expo-web-browser`
  - Refreshes credits when screen comes into focus

- **API Integration** (`services/api.ts`):
  - `createPaymentIntent()` - Creates Stripe checkout session
  - Automatically sets `platform: "mobile"` for mobile requests

- **Backend API** (`animatememories-master/app/api/create-payment-intent/route.jsx`):
  - Detects mobile platform and sets appropriate redirect URLs
  - Mobile: `animatememories://payment-success` or `animatememories://payment-cancelled`
  - Web: Standard web redirects

- **Payment Callback** (`app/payment-callback.tsx`):
  - Handles deep link callbacks from Stripe
  - Shows success/error messages
  - Refreshes user credits
  - Redirects back to credit screen

## 🔄 Credit Synchronization

Credits are automatically synchronized between web and mobile:

1. **Same Database**: Both web and mobile use the same backend API
2. **Webhook Processing**: Stripe webhook updates credits in the database
3. **Real-time Sync**: When user makes a payment:
   - Webhook processes payment → Updates database
   - Mobile app refreshes credits when screen is focused
   - Web app refreshes credits on page load

## 📱 Deep Linking

The app is configured with deep link scheme: `animatememories://`

### Payment Callbacks:
- Success: `animatememories://payment-success?session_id={SESSION_ID}`
- Cancelled: `animatememories://payment-cancelled`

Deep linking is configured in `app.json`:
```json
{
  "expo": {
    "scheme": "animatememories"
  }
}
```

## 🧪 Testing

### Test Payment Flow:

1. **Start the mobile app**
2. **Navigate to Credit tab**
3. **Select a credit pack**
4. **Tap "Get Pack" button**
5. **Complete payment in Stripe Checkout**
6. **Return to app** - Credits should be updated

### Test Credit Sync:

1. **Make a payment on web app**
2. **Check mobile app** - Credits should match
3. **Make a payment on mobile app**
4. **Check web app** - Credits should match

## 📦 Dependencies Added

- `@stripe/stripe-react-native` - Stripe React Native SDK (installed but using web checkout for now)
- `expo-web-browser` - Already installed, used for opening Stripe Checkout

## 🔐 Security Notes

- **Publishable Key**: Safe to use in mobile apps (already in code)
- **Secret Key**: Never exposed, only used on backend
- **Webhook Secret**: Only used on backend for webhook verification
- **Payment Processing**: All handled securely by Stripe

## 🚀 Next Steps (Optional Enhancements)

1. **Native Payment Sheet**: Replace web checkout with Stripe Payment Sheet for better mobile UX
2. **Transaction History**: Fetch real transaction history from API
3. **Payment Status Tracking**: Show payment status in real-time
4. **Receipt Generation**: Generate and display payment receipts

## 📝 Notes

- The current implementation uses Stripe Checkout (web-based) which works well for both platforms
- For a more native mobile experience, consider implementing Stripe Payment Sheet in the future
- All payments are processed through the same backend, ensuring consistency
- Credits are stored in the same database, so web and mobile always stay in sync









