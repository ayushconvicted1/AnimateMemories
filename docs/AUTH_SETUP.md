# Authentication Setup

This document explains the authentication system implemented in the app using Clerk.

## ⚠️ IMPORTANT: Clerk OAuth Redirect URL Configuration

**Before OAuth (Google/Apple) sign-in will work, you must configure the redirect URL in your Clerk dashboard:**

### Steps to Configure Redirect URL:

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Select your application** (the same one used by your website)
3. **Navigate to**: **Configure → User & authentication → SSO connections**
4. **Click on your OAuth provider** (Google or Apple)
5. **Find "Allowed redirect URLs" or "Authorized redirect URIs"** section
6. **Add the following redirect URL:**
   ```
   animatememories://auth-callback
   ```
7. **For development with Expo Go** (optional, if testing):
   ```
   exp://localhost:8081/auth-callback
   ```
8. **Save the changes**

**Note**: You need to add this URL for EACH OAuth provider you're using (Google and Apple separately).

### Error You'll See Without This Configuration:

If the redirect URL is not configured, you'll see this error:
```
The current redirect url passed in the sign in or sign up request does not match an authorized redirect URI for this instance. Review authorized redirect urls for your instance. animatememories://auth-callback
```

### Current Redirect URL:

The app uses the redirect URL defined in `constants/OAuth.ts`:
- **Production**: `animatememories://auth-callback`
- **Development (Expo Go)**: `exp://localhost:8081/auth-callback` (if needed)

## Components Created

### Icons
- `components/images/AppleIcon.tsx` - Apple logo SVG component
- `components/images/GoogleIcon.tsx` - Google logo SVG component

### Authentication
- `contexts/AuthContext.tsx` - Clerk auth context wrapper
- `constants/OAuth.ts` - OAuth redirect URL configuration

## Features

### Login Methods
- ✅ Email/Password login (via Clerk)
- ✅ Google OAuth (requires Clerk configuration)
- ✅ Apple OAuth (requires Clerk configuration, iOS only)

### User Management
- User registration with email verification
- Profile updates
- Persistent login state (via Clerk)
- Secure logout

## Usage

The AuthProvider is already integrated in the main app layout. Use Clerk hooks in any component:

```tsx
import { useAuth, useUser } from '@clerk/clerk-expo';

const MyComponent = () => {
  const { isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  
  // Your component logic
};
```

## Integration Notes

- **Clerk SDK**: Uses `@clerk/clerk-expo` for authentication
- **Shared Database**: Uses the same Clerk application as your website
- **OAuth Providers**: Google and Apple configured in Clerk dashboard
- **Redirect Handling**: Deep links automatically handled in `app/_layout.tsx`
- **Session Management**: Clerk handles session persistence automatically

## OAuth Flow

1. User taps "Sign in with Google/Apple"
2. Browser opens with OAuth provider
3. User authenticates with provider
4. Provider redirects to: `animatememories://auth-callback`
5. App receives deep link and navigates to `/auth-callback`
6. Clerk completes authentication
7. User is redirected to appropriate screen (onboarding or tabs)

## Troubleshooting

### OAuth Not Working?

1. **Check Clerk Dashboard**: Ensure redirect URL is added
2. **Verify App Scheme**: Check `app.json` has `"scheme": "animatememories"`
3. **Check Environment**: Ensure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
4. **Rebuild App**: Deep links require a native build (not Expo Go):
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

### Common Errors

- **"Redirect url mismatch"**: Add `animatememories://auth-callback` to Clerk dashboard
- **"Clerk not loaded"**: Check environment variables and network connection
- **Deep link not working**: Rebuild the app (deep links don't work in Expo Go)