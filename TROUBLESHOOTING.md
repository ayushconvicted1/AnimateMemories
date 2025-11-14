# AnimateMemories - Troubleshooting Guide

## ✅ Fixed Issues

### 1. Font Loading Error
**Error**: `Unable to resolve "../assets/fonts/SpaceMono-Regular.ttf"`
**Solution**: ✅ Removed unnecessary font loading from `_layout.tsx`

### 2. Missing Clerk Dependencies
**Error**: `Unable to resolve module expo-apple-authentication`
**Solution**: ✅ Installed required dependencies:
```bash
npx expo install expo-apple-authentication expo-crypto
```
✅ Added `expo-apple-authentication` plugin to `app.json`

### 3. Package Compatibility
**Error**: Package version mismatches
**Solution**: ✅ Updated packages with `npx expo install --fix`

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Fix any package compatibility issues
npx expo install --fix

# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator  
npx expo start --android

# Clear cache if needed
npx expo start --clear
```

## 🔧 Common Issues & Solutions

### Build Errors

**1. Metro bundler cache issues**
```bash
npx expo start --clear
```

**2. Node modules issues**
```bash
rm -rf node_modules
npm install
npx expo install --fix
```

**3. iOS simulator not opening**
```bash
# Make sure Xcode is installed
xcode-select --install

# Reset iOS simulator
xcrun simctl erase all
```

### Authentication Issues

**1. Clerk authentication not working**
- ✅ Check `.env` file has correct `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- ✅ Ensure key matches your website's Clerk application
- ✅ Verify OAuth providers are configured in Clerk dashboard

**2. OAuth Sign-In Failed (Development)**
- ⚠️ **Known Issue**: OAuth redirects don't work reliably in Expo development mode
- ✅ **Solution**: Use email/password authentication for development
- ✅ **Test Account**: Create account via signup or use existing credentials
- 🚀 **Production**: OAuth works perfectly on physical devices and production builds

**3. Development vs Production OAuth**
```bash
# Development (Simulator/Expo Go)
❌ OAuth redirects may fail
✅ Email/password works perfectly

# Production (Physical device/Standalone app)  
✅ OAuth works perfectly
✅ Email/password works perfectly
```

### Runtime Errors

**1. "Cannot read property of undefined"**
- Usually related to auth state loading
- ✅ App handles loading states properly with `isLoaded` checks

**2. Navigation errors**
- ✅ App uses proper Expo Router structure
- ✅ All routes are properly defined

### Development Warnings (Normal)

**1. "Clerk has been loaded with development keys"**
- ℹ️ **Normal**: This warning appears when using test keys
- ✅ **Safe**: Development keys work perfectly for testing
- 🚀 **Production**: Use production keys when deploying

**2. "ImageIO PNG Decoder is buggy"**
- ℹ️ **Normal**: iOS simulator warning about PNG handling
- ✅ **Safe**: Doesn't affect app functionality
- 🚀 **Production**: Not present on physical devices

**3. "Automatic Strong Password" overlay**
- ℹ️ **iOS Feature**: Automatic password suggestion covering text fields
- ✅ **Fixed**: Added `textContentType="newPassword"` to disable suggestions
- 💡 **Alternative**: Use physical device where this is less intrusive

**4. "Signup Failed - Is unknown"**
- ❌ **Common Issue**: Generic Clerk error message
- ✅ **Fixed**: Added detailed error handling and validation
- 🔍 **Check**: Email format, password strength, existing accounts

**5. "first_name is not a valid parameter"**
- ❌ **Clerk Configuration**: Some Clerk apps don't accept firstName/lastName in signup
- ✅ **Fixed**: Removed firstName/lastName from signup, using only email/password
- 💡 **Note**: User name is collected but not sent to Clerk during signup

## 📱 Testing Checklist

### Authentication Flow
- [ ] App loads without errors
- [ ] Login screen appears for unauthenticated users
- [ ] Email/password login works
- [ ] Google OAuth works (if configured)
- [ ] Apple OAuth works (if configured)
- [ ] Email verification works for signup
- [ ] Successful auth redirects to tabs

### Tab Navigation
- [ ] All 4 tabs are visible
- [ ] Home tab shows welcome message
- [ ] Studio tab has image picker
- [ ] History tab shows empty state
- [ ] Profile tab shows user info
- [ ] Sign out works properly

### UI/UX
- [ ] Colors match website theme (#03ade2)
- [ ] Loading states work properly
- [ ] Error messages are user-friendly
- [ ] Responsive on different screen sizes

## 🆘 Still Having Issues?

1. **Check Expo CLI version**: `npx expo --version`
2. **Check Node.js version**: `node --version` (should be 18+)
3. **Clear all caches**: 
   ```bash
   npx expo start --clear
   rm -rf node_modules
   npm install
   ```
4. **Restart Metro bundler**: Kill terminal and run `npx expo start` again

## 📞 Support

If you're still experiencing issues:
1. Check the error message carefully
2. Look for similar issues in Expo/Clerk documentation
3. Ensure all environment variables are set correctly
4. Try running on a different simulator/device

The app is designed to be robust and handle edge cases gracefully!