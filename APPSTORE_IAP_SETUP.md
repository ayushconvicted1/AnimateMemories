# App Store Connect: In-App Purchase Setup Guide

Complete guide to setting up In-App Purchases (IAP) for AnimateMemories in App Store Connect.

---

## Prerequisites

Before you begin, ensure you have:

- [x] An active Apple Developer account ($99/year)
- [x] Access to App Store Connect
- [x] Your app's Bundle ID (e.g., `com.animatememories.app`)

---

## Table of Contents

1. [Agreements, Tax, and Banking](#1-agreements-tax-and-banking)
2. [Create or Configure Your App](#2-create-or-configure-your-app)
3. [Create In-App Purchase Products](#3-create-in-app-purchase-products)
4. [Configure Product Details](#4-configure-product-details)
5. [Sandbox Testing](#5-sandbox-testing)
6. [Submit for Review](#6-submit-for-review)
7. [Testing Checklist](#7-testing-checklist)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Agreements, Tax, and Banking

> [!IMPORTANT]
> You **MUST** complete this section before IAP will work, even in sandbox mode.

### Steps:

1. **Sign in to App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Sign in with your Apple Developer account

2. **Navigate to Agreements, Tax, and Banking**
   - Click on **Agreements, Tax, and Banking** in the homepage

3. **Accept Paid Applications Agreement**
   - Under **Agreements**, find **Paid Applications**
   - Click **Request** (if not already accepted)
   - Review and accept the agreement
   - Click **Submit**

4. **Set Up Banking Information**
   - Under **Banking**, click **Set Up**
   - Enter your bank account details for receiving payments
   - **Important**: This must be a bank account that can receive USD payments
   - Save your information

5. **Configure Tax Information**
   - Under **Tax**, click **Set Up**
   - Complete the required tax forms (W-9 for US developers, W-8BEN for non-US)
   - Provide your Tax ID (SSN/EIN for US, Tax ID for others)
   - Save your information

6. **Wait for Approval**
   - Apple will review your banking and tax information
   - This can take 24-48 hours
   - You'll receive an email when approved

> [!TIP]
> While waiting for approval, you can continue with the next steps. However, IAP won't work in sandbox until this is approved.

---

## 2. Create or Configure Your App

### If App Already Exists:

1. Go to **My Apps** in App Store Connect
2. Select your **AnimateMemories** app
3. Skip to [Section 3](#3-create-in-app-purchase-products)

### If App Doesn't Exist Yet:

1. **Create New App**
   - Click the **+** button
   - Select **New App**

2. **Fill in Basic Information**
   ```
   Platform: iOS
   Name: AnimateMemories
   Primary Language: English (U.S.)
   Bundle ID: [Select your Bundle ID from dropdown]
   SKU: animatememories-app-001
   User Access: Full Access
   ```

3. **Click Create**

---

## 3. Create In-App Purchase Products

You need to create **three consumable products** for the credit packs.

### Navigate to In-App Purchases:

1. In your app's page, click **Features** tab
2. Click **In-App Purchases** in the sidebar
3. Click the **+** button to create a new IAP

### Product 1: Starter Pack (30 Credits)

1. **Select Type**
   - Choose **Consumable**
   - Click **Create**

2. **Reference Name**
   ```
   Starter Pack - 30 Credits
   ```

3. **Product ID**
   ```
   com.animatememories.credits.starter
   ```
   > [!WARNING]
   > Product IDs **CANNOT** be changed after creation! Make sure this matches exactly.

4. **Click Create**

### Product 2: Popular Pack (100 Credits)

1. Click **+** to create another IAP
2. **Select Type**: Consumable
3. **Reference Name**:
   ```
   Popular Pack - 100 Credits
   ```
4. **Product ID**:
   ```
   com.animatememories.credits.popular
   ```
5. **Click Create**

### Product 3: Pro Pack (200 Credits)

1. Click **+** to create another IAP
2. **Select Type**: Consumable
3. **Reference Name**:
   ```
   Pro Pack - 200 Credits
   ```
4. **Product ID**:
   ```
   com.animatememories.credits.pro
   ```
5. **Click Create**

---

## 4. Configure Product Details

You need to configure each product with pricing, descriptions, and review information.

### For Each Product (Starter, Popular, Pro):

#### A. Pricing and Availability

1. Click on the product to open it
2. Scroll to **In-App Purchase Pricing**
3. Click **Add Pricing**
4. **Select all territories** or specific ones
5. **Set Price Tier**:
   - **Starter Pack**: Select tier that equals **$9.99** (Tier 10)
   - **Popular Pack**: Select tier that equals **$24.99** (Tier 25)
   - **Pro Pack**: Select tier that equals **$44.99** (Tier 45)

   > [!NOTE]
   > Apple uses price tiers. Find the tier closest to your desired price. Tier 10 = $9.99, Tier 25 = $24.99, Tier 45 = $44.99

6. Click **Next**, then **Confirm**

#### B. In-App Purchase Information

For **Starter Pack** (30 Credits):

```
Display Name (English US):
30 AI Credits - Starter Pack

Description (English US):
Purchase 30 AI processing credits to restore and animate your old photos. Perfect for getting started with AI-powered photo restoration.
```

For **Popular Pack** (100 Credits):

```
Display Name (English US):
100 AI Credits - Popular Pack

Description (English US):
Purchase 100 AI processing credits to restore and animate your old photos. Most popular choice for photo enthusiasts and historians.
```

For **Pro Pack** (200 Credits):

```
Display Name (English US):
200 AI Credits - Pro Pack

Description (English US):
Purchase 200 AI processing credits to restore and animate your old photos. Best value for professionals and power users.
```

> [!TIP]
> You can add more languages later by clicking **Add Language**

#### C. Review Information (Screenshot)

Apple requires a screenshot showing the purchase flow for review:

1. Scroll to **App Store Review Information**
2. **Screenshot**:
   - Take a screenshot of your app's credit purchase screen
   - Should show the product being offered
   - Must be clear and show pricing
   - Upload the screenshot (PNG or JPG, max 4096x4096)

3. **Review Notes** (optional):
   ```
   This consumable IAP provides users with AI processing credits for photo restoration and animation. Credits are consumed when users process photos through our AI service.
   ```

#### D. Save

1. Click **Save** in the top-right corner
2. Repeat for all three products

---

## 5. Sandbox Testing

### A. Create Sandbox Tester Account

1. **Navigate to Sandbox Testers**
   - In App Store Connect, go to **Users and Access**
   - Click **Sandbox** in the sidebar
   - Click **Testers** sub-tab

2. **Add Sandbox Tester**
   - Click the **+** button
   - Fill in the form:
     ```
     First Name: Test
     Last Name: User
     Email: [Create a NEW email, e.g., test@yourdomain.com]
     Password: [Strong password]
     Country/Region: [Your country]
     ```
   - Click **Add**

   > [!WARNING]
   > - Do NOT use your actual Apple ID email
   - This email does NOT need to be a real email address
   - You'll use this ONLY for testing IAP

### B. Test on iOS Device/Simulator

1. **Sign Out of App Store**
   - On your iOS device: Settings → App Store → Sign Out
   - **Important**: Sign out from App Store, NOT iCloud!

2. **Run Your App**
   - Build and run your AnimateMemories app
   - Navigate to the Credits screen

3. **Test Purchase**
   - Tap on a credit pack (e.g., Starter Pack)
   - Tap "Get Pack" button
   - iOS will prompt for sign-in
   - **Sign in with your Sandbox Tester account**

4. **Complete Purchase**
   - The purchase will show **[Environment: Sandbox]** banner
   - Complete the purchase (it's free in sandbox)
   - Verify credits are added to your account

5. **Test All Products**
   - Test all three credit packs
   - Verify credits update correctly
   - Check transaction history

6. **Test Restore Purchases**
   - Reinstall the app or use "Restore Purchases" button
   - Verify any non-consumed purchases are restored

### C. Monitor Sandbox Transactions

1. Go to **Users and Access** → **Sandbox** → **Testers**
2. Click on your tester account
3. View transaction history
4. You can clear purchase history if needed

---

## 6. Submit for Review

### A. Prepare Your App for Review

1. **Complete App Information**
   - Fill in all required metadata (name, description, screenshots, etc.)
   - Add app privacy details
   - Set age rating

2. **Build and Upload**
   - Build your app with Xcode
   - Upload to App Store Connect via Xcode or Transporter

### B. Submit IAP Products

1. **IAP Status**
   - Each IAP product should show **"Ready to Submit"**
   - If not, ensure all sections are complete

2. **Submit with App**
   - IAP products are automatically submitted with your app
   - Go to your app version
   - Click **Add for Review** on your app version
   - Click **Submit for Review**

### C. Review Timeline

- **IAP Review**: 24-48 hours typically
- **App Review**: 1-7 days typically
- You'll receive email updates on review status

### D. Common Rejection Reasons

> [!CAUTION]
> Avoid these common pitfalls:

1. **Missing Restore Purchases** - Must have a "Restore Purchases" button
2. **Unclear Value** - Description must clearly state what user gets
3. **Missing Screenshot** - Must provide review screenshot for each product
4. **Banking Not Set Up** - Complete banking/tax forms first
5. **App Functionality** - App must demonstrate using the credits

---

## 7. Testing Checklist

Before submitting for review, verify:

- [ ] All three IAP products created with correct Product IDs:
  - [ ] `com.animatememories.credits.starter`
  - [ ] `com.animatememories.credits.popular`
  - [ ] `com.animatememories.credits.pro`

- [ ] Pricing configured correctly:
  - [ ] Starter: $9.99
  - [ ] Popular: $24.99
  - [ ] Pro: $44.99

- [ ] Product details complete:
  - [ ] Display names set
  - [ ] Descriptions written
  - [ ] Review screenshots uploaded

- [ ] Sandbox testing completed:
  - [ ] Created sandbox tester account
  - [ ] Tested purchasing all three products
  - [ ] Verified credits added correctly
  - [ ] Tested restore purchases
  - [ ] Verified transaction history

- [ ] App features:
  - [ ] "Restore Purchases" button visible on iOS
  - [ ] Purchase flow works smoothly
  - [ ] Error handling works (cancel, failure)
  - [ ] Credits sync with database

- [ ] Agreements and banking:
  - [ ] Paid Applications agreement accepted
  - [ ] Banking information submitted and approved
  - [ ] Tax forms completed

---

## 8. Troubleshooting

### "Cannot connect to iTunes Store"

**Solutions:**
- Ensure you're signed out of App Store (not iCloud)
- Verify sandbox tester account is active
- Try on a real device (not simulator, if issue persists)
- Check internet connection

### "Invalid Product ID"

**Solutions:**
- Verify Product IDs in code match App Store Connect exactly
- Ensure IAP products are in "Ready to Submit" or "Approved" status
- Wait a few hours after creating products (can take time to propagate)
- Clear app data and reinstall

### "You've already purchased this"

**Solutions:**
- For consumables, this shouldn't happen
- Clear sandbox tester purchase history in App Store Connect
- Create a new sandbox tester account

### Purchase Completes but Credits Don't Update

**Solutions:**
- Check network connectivity to your backend
- Verify receipt validation endpoint is working
- Check backend logs for verification errors
- Ensure database is being updated correctly

### "Unable to Purchase"

**Solutions:**
- Verify Paid Applications agreement is accepted
- Ensure banking and tax information is approved
- Check that IAP products are "Ready to Submit" or "Approved"
- Verify app's Bundle ID matches App Store Connect

### iOS Sandbox Receipt Verification Fails

**Solutions:**
- Use correct verification URL (sandbox: `https://sandbox.itunes.apple.com/verifyReceipt`)
- Implement fallback to sandbox URL if production fails
- Check receipt data is being sent correctly
- Verify your backend can reach Apple's servers

---

## Additional Resources

### Apple Documentation

- [In-App Purchase Programming Guide](https://developer.apple.com/in-app-purchase/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Receipt Validation](https://developer.apple.com/documentation/appstorereceipts/verifying_receipts_with_the_app_store)

### Product ID Reference

| Pack | Product ID | Price | Credits |
|------|-----------|-------|---------|
| Starter | `com.animatememories.credits.starter` | $9.99 | 30 |
| Popular | `com.animatememories.credits.popular` | $24.99 | 100 |
| Pro | `com.animatememories.credits.pro` | $44.99 | 200 |

### Important URLs

- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer Portal**: https://developer.apple.com/account
- **Sandbox Receipt Verification**: `https://sandbox.itunes.apple.com/verifyReceipt`
- **Production Receipt Verification**: `https://buy.itunes.apple.com/verifyReceipt`

---

## Next Steps

After completing this setup:

1. ✅ IAP products are configured in App Store Connect
2. ➡️ Implement IAP code in your app (see `IAP_IMPLEMENTATION.md`)
3. ➡️ Test thoroughly with sandbox account
4. ➡️ Submit app for review
5. ➡️ Monitor reviews and respond to feedback

---

## Support

If you encounter issues:

1. Check [Apple Developer Forums](https://developer.apple.com/forums/)
2. Review [App Store Connect Help](https://help.apple.com/app-store-connect/)
3. Contact Apple Developer Support
4. Consult the troubleshooting section above

---

**Last Updated**: January 2026  
**Version**: 1.0
