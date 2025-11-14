# Authentication Setup

This document explains the authentication system implemented in the app.

## Components Created

### Icons
- `components/images/AppleIcon.tsx` - Apple logo SVG component
- `components/images/GoogleIcon.tsx` - Google logo SVG component

### Authentication Hook
- `hooks/useAuth.ts` - Main authentication logic with AsyncStorage persistence
- `contexts/AuthContext.tsx` - React context wrapper for the auth hook

## Features

### Login Methods
- Email/Password login
- Google Sign-In (mock implementation)
- Apple Sign-In (placeholder)

### User Management
- User registration
- Profile updates
- Persistent login state
- Secure logout

### Mock Credentials
For testing, use:
- Email: `test@example.com`
- Password: `password123`

## Usage

The AuthProvider is already integrated in the main app layout. Use the `useAuth` hook in any component:

```tsx
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Your component logic
};
```

## Integration Notes

- AsyncStorage is used for persistence
- All auth methods return `AuthResult` with success/error states
- User data is automatically saved and restored on app restart
- Routes redirect to main index ("/") after successful authentication

## Next Steps

1. Replace mock API calls with real backend integration
2. Implement proper Google Sign-In SDK
3. Add Apple Sign-In SDK for iOS
4. Add form validation and better error handling
5. Create protected route wrapper components