# AnimateMemories Payment & In-App Purchase (IAP) Setup Guide

This guide provides step-by-step instructions for configuring payments across Web (Next.js), iOS (Apple App Store In-App Purchase via `react-native-iap`), Android (Google Play Billing & Stripe), and Backend Receipt Verification.

---

## 1. Credit Packs & Subscription Architecture

AnimateMemories uses a unified credit system across Web and Mobile:

### One-Time Credit Packs
| Pack ID | Name | Credits | Price (USD) | Apple Product ID | Google Product ID |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `starter` | Starter Pack | 30 | **$5.99** | `com.hexerve.AnimateMemories.credits.starter` | `com.hexerve.animatememories.credits.starter` |
| `popular` | Popular Pack | 100 | **$19.99** | `com.hexerve.AnimateMemories.credits.popular` | `com.hexerve.animatememories.credits.popular` |
| `pro` | Pro Pack | 200 | **$34.99** | `com.hexerve.AnimateMemories.credits.pro` | `com.hexerve.animatememories.credits.pro` |

### Auto-Renewable Subscriptions
| Plan ID | Name | Monthly Credits | Price (USD/mo) | Apple Product ID | Google Product ID |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `sub_basic` | Basic Monthly | 50 | **$7.99** | `com.hexerve.AnimateMemories.sub.basic` | `com.hexerve.animatememories.sub.basic` |
| `sub_standard` | Standard Monthly | 120 | **$14.99** | `com.hexerve.AnimateMemories.sub.standard` | `com.hexerve.animatememories.sub.standard` |
| `sub_premium` | Premium Monthly | 250 | **$39.99** | `com.hexerve.AnimateMemories.sub.premium` | `com.hexerve.animatememories.sub.premium` |

---

## 2. Apple App Store Connect Configuration (iOS)

### Step 2.1: Agreements, Tax, and Banking
1. Log in to [App Store Connect](https://appstoreconnect.apple.com).
2. Go to **Agreements, Tax, and Banking**.
3. Accept and complete the **Paid Apps Agreement**.
4. Set up your Banking and Tax information. *(IAP will not work until this is active).*

### Step 2.2: Create In-App Purchase Items (Consumable Packs)
1. Go to **Apps** → **AnimateMemories** → **In-App Purchases**.
2. Click **+** to add a new In-App Purchase.
3. Select **Consumable**.
4. Configure each pack:
   - **Starter Pack**:
     - Product Name: `Starter Pack`
     - Product ID: `com.hexerve.AnimateMemories.credits.starter`
     - Pricing: Tier 6 / $5.99 USD
   - **Popular Pack**:
     - Product Name: `Popular Pack`
     - Product ID: `com.hexerve.AnimateMemories.credits.popular`
     - Pricing: Tier 20 / $19.99 USD
   - **Pro Pack**:
     - Product Name: `Pro Pack`
     - Product ID: `com.hexerve.AnimateMemories.credits.pro`
     - Pricing: Tier 35 / $34.99 USD

### Step 2.3: Create Subscription Group & Products
1. Under **In-App Purchases**, select **Subscriptions**.
2. Create a Subscription Group named `AnimateMemories VIP`.
3. Add the 3 Subscription items:
   - **Basic Monthly**: ID `com.hexerve.AnimateMemories.sub.basic` ($7.99/mo)
   - **Standard Monthly**: ID `com.hexerve.AnimateMemories.sub.standard` ($14.99/mo)
   - **Premium Monthly**: ID `com.hexerve.AnimateMemories.sub.premium` ($39.99/mo)

### Step 2.4: App Store Shared Secret
1. Go to **App Store Connect** → **Apps** → **AnimateMemories** → **App Information**.
2. Scroll to **App-Specific Shared Secret**.
3. Generate and copy the secret key for receipt validation on the backend.

### Step 2.5: Create iOS Sandbox Testers
1. In App Store Connect, go to **Users and Access** → **Sandbox Testers**.
2. Create a test user account with a test email.
3. Use this email on an iOS test device under **Settings** → **App Store** → **Sandbox Account**.

---

## 3. Google Play Console Configuration (Android)

### Step 3.1: Merchant Account Setup
1. Log in to [Google Play Console](https://play.google.com/console).
2. Go to **Setup** → **Merchant account** and link your Google Payment Merchant account.

### Step 3.2: Create Managed Products & Subscriptions
1. Under **Monetize** → **In-app products**, create:
   - `com.hexerve.animatememories.credits.starter` ($5.99)
   - `com.hexerve.animatememories.credits.popular` ($19.99)
   - `com.hexerve.animatememories.credits.pro` ($34.99)
2. Under **Monetize** → **Subscriptions**, create:
   - `com.hexerve.animatememories.sub.basic` ($7.99/mo)
   - `com.hexerve.animatememories.sub.standard` ($14.99/mo)
   - `com.hexerve.animatememories.sub.premium` ($39.99/mo)

### Step 3.3: License Testing Setup
1. In Google Play Console, go to **Setup** → **License testing**.
2. Add your developer email addresses to test purchases without actual charges.

---

## 4. Stripe Setup (Web & Android Mobile Fallback)

### Step 4.1: Stripe Dashboard Configuration
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com).
2. Ensure API Keys are created (Publishable Key & Secret Key).
3. Create Webhooks pointing to `https://www.animatememories.com/api/stripe-webhook`.
4. Webhook events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`

---

## 5. Backend Receipt Verification Endpoints

The Next.js backend (`animatememories-master`) provides receipt validation endpoints for mobile purchases:

### 1. Verification Endpoint: `/api/iap-verify`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "receiptData": "<base64_encoded_receipt_string>",
    "userEmail": "user@example.com"
  }
  ```
- **Behavior**:
  - Sends receipt to Apple (`buy.itunes.apple.com/verifyReceipt`).
  - Automatically handles Sandbox fallback (Status code `21007` retries on `sandbox.itunes.apple.com/verifyReceipt`).
  - Matches `productId` against database pack definitions.
  - Credits the user account and records transaction in `Transactions` table.

### 2. Restore Endpoint: `/api/iap-restore`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "receiptData": "<base64_encoded_receipt_string>",
    "userEmail": "user@example.com"
  }
  ```
- **Behavior**:
  - Re-evaluates purchase history for restoring existing subscriptions or unused non-consumables.

---

## 6. Environment Variables Checklist

### Mobile App (`AnimateMemories/.env`)
```env
EXPO_PUBLIC_API_BASE_URL=https://www.animatememories.com
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Backend Web App (`animatememories-master/.env.local`)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APPLE_IAP_SHARED_SECRET=your_apple_shared_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## 7. Testing & Verification Steps

1. **iOS Sandbox Purchase**:
   - Run `npx expo run:ios` or test via TestFlight build.
   - Go to Credit Screen, select **Popular Pack ($19.99)**, click Buy.
   - Enter iOS Sandbox credentials when prompted.
   - Verify success modal appears and credits balance updates instantly.

2. **Restore Purchases Test**:
   - Tap **Restore Purchases** on the Credits screen.
   - Confirm previously purchased items / active subscriptions re-sync successfully.

3. **Web Stripe Purchase**:
   - Visit `https://www.animatememories.com/buy-credits`.
   - Complete checkout with test credit card `4242 4242 4242 4242`.
   - Verify redirect to success page and credit increment in database.
