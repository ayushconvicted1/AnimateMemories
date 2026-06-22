# react-native-iap Installation Issue

## Problem

Attempting to install `react-native-iap` in the Expo project encounters a CocoaPods error:

```
Unable to find a specification for `RCT-Folly` depended upon by `RNIap`
```

## Root Cause

- `react-native-iap` requires React Native's `RCT-Folly` library
- With Expo SDK 54 and React Native 0.81.5, there's a dependency resolution issue
- The library expects a bare React Native setup, not Expo's managed workflow

## Attempted Solutions

1. ✅ Cleared pod cache and reinstalled
2. ✅ Tried different versions (12.15.0, 12.10.8)
3. ✅ Added Expo plugin to app.json
4. ✅ Ran `expo prebuild --clean`
5. ❌ Issue persists

## Recommended Solutions

### Option 1: Use `expo-in-app-purchases` (RECOMMENDED)

**Pros:**
- Official Expo package with full support
- No CocoaPods issues
- Simpler integration with Expo
- Well-documented and maintained

**Cons:**
- Different API than react-native-iap
- Need to refactor IAP service code

**Installation:**
```bash
npx expo install expo-in-app-purchases
```

**Implementation Changes:**
- Update `services/iap-service.ts` to use Expo's API
- API is similar but slightly different method names
- Same backend verification approach works

### Option 2: Upgrade Expo SDK

**Pros:**
- Newer SDK may have better compatibility
- Gets latest features and fixes

**Cons:**
- Requires updating many dependencies
- May break other things
- Time-consuming

**Steps:**
```bash
npx expo install expo@latest
npx expo install --fix
```

### Option 3: Eject from Expo (NOT RECOMMENDED)

**Pros:**
- Full control over native code
- Can use any React Native library

**Cons:**
- Loses Expo's ease of use
- Must manage native builds yourself
- Complex to maintain

### Option 4: Keep Stripe for All Platforms

**Pros:**
- Already working
- Simplest solution
- No code changes needed

**Cons:**
- Not App Store compliant for iOS
- May get rejected during review
- Would need to switch to IAP eventually

## Recommended Path Forward

**Use `expo-in-app-purchases` (Option 1)**

This is the best solution because:
1. It's designed for Expo
2. No CocoaPods issues
3. Relatively quick to refactor
4. Officially supported

The refactoring would involve:
- Update imports in `iap-service.ts`
- Adjust method calls to Expo's API
- Backend code stays the same
- Everything else stays the same

Would you like me to proceed with Option 1?
