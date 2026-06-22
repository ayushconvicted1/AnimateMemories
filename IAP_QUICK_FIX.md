# Quick IAP Fix Checklist

Use this checklist to quickly diagnose and fix the "0 products fetched" issue.

## ⚡ 5-Minute Quick Check

### Step 1: Verify Product IDs (2 minutes)

Go to **App Store Connect** → Your App → **Features** → **In-App Purchases**

Check that these EXACT product IDs exist:

```
✅ com.hexerve.AnimateMemories.credits.starter
✅ com.hexerve.AnimateMemories.credits.popular
✅ com.hexerve.AnimateMemories.credits.pro
```

**If they don't match:** This is your problem! Either:
- Update your code to match App Store Connect
- Delete products and recreate with correct IDs

---

### Step 2: Check Product Status (1 minute)

For EACH product, the status MUST be one of:
- ✅ "Ready to Submit"
- ✅ "Waiting for Review"  
- ✅ "Approved"

**If status is blank or "Missing Metadata":**

Click on the product and ensure you have:
1. ✅ Display Name filled
2. ✅ Description filled
3. ✅ **Price tier selected** (at least one country!)
4. ✅ **Screenshot uploaded** (CRITICAL - upload any screenshot)

Then click **Save**.

---

### Step 3: Verify Agreements (1 minute)

Go to **App Store Connect Homepage** → **Agreements, Tax, and Banking**

Check that:
- ✅ Paid Applications: **Active** (green checkmark)
- ✅ Banking: **Complete** (green checkmark)
- ✅ Tax: **Complete** (green checkmark)

**If any are incomplete or pending:**
- Complete them NOW
- Wait 24-48 hours for Apple approval
- IAP won't work until this is done

---

### Step 4: Wait for Propagation (if just created) (1 minute)

**When did you create/modify the products?**

- ⏱️ **Less than 2 hours ago:** Wait and retry later
- ⏱️ **2-24 hours ago:** Might still be propagating, check logs
- ✅ **More than 24 hours ago:** Products should be available

---

## 🎯 Most Likely Issue

Based on "products configured but not submitted yet," the issue is likely:

### 🔴 Products Not "Ready to Submit"

**Missing:** Review screenshot (most common!)

**Fix:**
1. Open each product in App Store Connect
2. Scroll to "App Store Review Information"
3. Upload ANY screenshot (640x920 minimum)
   - Can be your credit screen
   - Can be any placeholder
4. Click **Save**
5. Status should change to "Ready to Submit"

---

## 📱 Test Again

After fixing the above:

1. **Rebuild your app** (or restart if using Expo Go)
2. **Check the new console logs** for detailed debugging info
3. **Look for:**
   ```
   ✅ IAP: Successfully fetched products:
     - com.hexerve.AnimateMemories.credits.starter: ...
   ```

---

## ❓ Still Not Working?

If you've completed ALL the above and still see 0 products:

1. **Check console output** - share the new detailed logs
2. **Screenshot your App Store Connect** IAP page
3. **Wait 24 hours** if you just completed agreements

See `IAP_TROUBLESHOOTING.md` for detailed troubleshooting steps.

---

## 📸 Required Screenshots for App Store Connect

For each product, you need ONE screenshot showing where users can buy it.

**Quick way to create:**
1. Run your app
2. Navigate to Credits screen
3. Take a screenshot
4. Upload same screenshot to all 3 products

**Requirements:**
- Minimum: 640x920 pixels
- Format: PNG or JPG
- Shows: Where user can purchase the product

---

## 🚀 Expected Timeline

| Action | Wait Time |
|--------|-----------|
| Create new products | 2-24 hours |
| Modify existing products | 1-2 hours |
| Submit banking/tax | 24-48 hours |
| App review (IAP) | 24-48 hours |
| App review (full app) | 1-7 days |

---

**TL;DR:** Most likely you need to upload screenshots to make products "Ready to Submit" ✅
