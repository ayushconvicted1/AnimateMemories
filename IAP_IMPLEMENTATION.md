# iOS In-App Purchase (IAP) Implementation

## Overview

The AnimateMemories app now supports platform-specific payment methods:
- **iOS**: Apple In-App Purchases (IAP) via `react-native-iap`
- **Android**: Stripe payments
- **Web**: Stripe payments

This ensures compliance with Apple App Store guidelines while maintaining the existing Stripe integration for other platforms.

---

## Architecture

### Payment Flow Decision

The app automatically detects the platform at runtime:

```typescript
if (Platform.OS === 'ios') {
  // Use IAP for iOS
  await handleIAPPurchase(userEmail);
} else {
  // Use Stripe for Android and other platforms
  await handleStripePurchase(userEmail);
}
```

### Components

#### 1. IAP Configuration (`constants/iap-config.ts`)

Defines the three credit packs available on iOS:

| Pack | Product ID | Credits | Price |
|------|-----------|---------|-------|
| Starter | `com.animatememories.credits.starter` | 30 | $9.99 |
| Popular | `com.animatememories.credits.popular` | 100 | $24.99 |
| Pro | `com.animatememories.credits.pro` | 200 | $44.99 |

#### 2. IAP Service (`services/iap-service.ts`)

Singleton service that handles:
- Initializing IAP connection
- Fetching products from App Store
- Processing purchases
- Verifying receipts with backend
- Restoring purchases
- Handling pending transactions

#### 3. Backend API Endpoints

**`/api/iap-verify`** - Verifies iOS IAP receipts
- Validates receipt with Apple's servers
- Checks for duplicate transactions
- Updates user credits
- Stores transaction with `paymentProvider: 'apple_iap'`

**`/api/iap-restore`** - Restores iOS IAP purchases
- Retrieves all transactions from receipt
- Identifies missing transactions
- Adds missing credits
- Returns list of restored purchases

#### 4. Database Schema

Updated `Transactions` table:
```javascript
{
  id: serial,
  userEmail: varchar,
  sessionId: varchar,  // Stripe session ID or Apple transaction ID
  packId: varchar,
  credits: integer,
  amount: integer,
  status: varchar,
  paymentProvider: varchar,  // 'stripe' or 'apple_iap'
  createdAt: timestamp
}
```

---

## iOS Purchase Flow

### 1. User Taps "Get Pack" Button

```typescript
handlePurchase() → handleIAPPurchase()
```

### 2. Request Purchase from App Store

```typescript
await RNIap.requestPurchase({ sku: productId });
```

### 3. Get Receipt

```typescript
const receipt = await RNIap.getReceiptIOS({ forceRefresh: false });
```

### 4. Verify with Backend

```typescript
const result = await api.verifyIAPReceipt(receipt, userEmail, token);
```

### 5. Backend Verifies with Apple

- Sends receipt to `https://buy.itunes.apple.com/verifyReceipt` (production)
- Falls back to sandbox if needed
- Extracts transaction details
- Checks for duplicates using transaction ID

### 6. Update Credits

- Adds credits to user account
- Stores transaction in database
- Returns updated credit balance

### 7. Update UI

- Shows success alert
- Refreshes credit balance
- Updates transaction history

---

## Restore Purchases Flow

### 1. User Taps "Restore Purchases" (iOS Only)

```typescript
handleRestorePurchases()
```

### 2. Get Receipt

```typescript
const receipt = await RNIap.getReceiptIOS({ forceRefresh: false });
```

### 3. Verify & Restore with Backend

```typescript
const result = await api.restoreIAPPurchases(receipt, userEmail, token);
```

### 4. Backend Processes All Transactions

- Retrieves all transactions from receipt
- Filters out already-processed transactions
- Adds credits for missing transactions
- Returns count of restored purchases

### 5. Update UI

- Shows restoration summary
- Refreshes credits and transactions

---

## Android/Web Payment Flow (Unchanged)

Android and web platforms continue to use Stripe:

1. User selects credit pack
2. Backend creates Stripe checkout session
3. User redirected to Stripe Checkout
4. Payment processed by Stripe
5. Webhook updates credits
6. User redirected back to app

---

## App Store Connect Setup

See [APPSTORE_IAP_SETUP.md](./APPSTORE_IAP_SETUP.md) for detailed instructions on:

1. Configuring agreements, tax, and banking
2. Creating IAP products in App Store Connect
3. Setting up pricing and descriptions
4. Sandbox testing
5. Submitting for review

---

## Testing

### iOS Sandbox Testing

1. Create sandbox tester account in App Store Connect
2. Sign out of App Store on device
3. Run app and attempt purchase
4. Sign in with sandbox account when prompted
5. Complete purchase (free in sandbox)
6. Verify credits added

### Android Testing

1. Test Stripe checkout flow
2. Verify webhook processing
3. Confirm credits sync

### Cross-Platform Sync

1. Make purchase on iOS
2. Verify credits on Android/web
3. Check transaction history shows correct payment provider

---

## Error Handling

### IAP Errors

- **User Cancelled**: Silent failure, no error shown
- **Network Error**: "Unable to connect" message
- **Invalid Product**: "Product not available" alert
- **Receipt Verification Failed**: Backend returns specific Apple error code

### Stripe Errors

- **Payment Failed**: Shows Stripe error message
- **Network Error**: "Check your connection" message
- **Invalid Session**: "Checkout URL not available" alert

---

## Key Files

### Mobile App

- `app/(tabs)/credit.tsx` - Credit screen with platform-aware purchase logic
- `services/iap-service.ts` - IAP service singleton
- `services/api.ts` - API client with IAP methods
- `constants/iap-config.ts` - IAP product configuration

### Backend

- `app/api/iap-verify/route.js` - IAP receipt verification
- `app/api/iap-restore/route.js` - IAP purchase restoration
- `app/api/stripe-webhook/route.js` - Stripe webhook (unchanged)
- `config/schema.js` - Database schema with paymentProvider field

### Documentation

- `APPSTORE_IAP_SETUP.md` - App Store Connect setup guide
- `IAP_IMPLEMENTATION.md` - This file
- `STRIPE_SETUP.md` - Stripe setup guide (existing)

---

## Security Considerations

### Receipt Verification

- All receipts verified server-side with Apple
- Transaction IDs checked for duplicates
- Invalid receipts rejected before credit update

### Database

- Payment provider tracked for audit trail
- Transaction IDs stored for reconciliation
- Credits only added after successful verification

### Client-Side

- IAP service only exposes high-level methods
- Receipt data never manipulated on client
- All credit updates come from backend

---

## Troubleshooting

### iOS Purchases Not Working

1. Check App Store Connect agreements are signed
2. Verify banking and tax information submitted
3. Confirm IAP products are "Ready to Submit" or "Approved"
4. Ensure product IDs match exactly
5. Check bundle ID matches App Store Connect

### Credits Not Adding

1. Verify backend API is reachable
2. Check backend logs for verification errors
3. Confirm database connection working
4. Test receipt verification manually

### Restore Not Finding Purchases

1. Ensure using same Apple ID
2. Check if purchases already restored (duplicate check)
3. Verify receipt contains transactions
4. Test with different sandbox account

---

## Future Enhancements

1. **Subscription Support**: Add auto-renewable subscriptions
2. **Promotional Offers**: Implement introductory pricing
3. **Transaction History**: Show detailed purchase history
4. **Receipt Details**: Display receipt information for debugging
5. **Offline Support**: Queue purchases for later verification

---

## Support

For issues:

1. Check relevant documentation file
2. Review App Store Connect status
3. Inspect backend logs
4. Test with sandbox account
5. Contact Apple Developer Support if needed

---

**Last Updated**: January 2026  
**  Version**: 1.0
