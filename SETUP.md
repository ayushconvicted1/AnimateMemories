# AnimateMemories Mobile App Setup

## Prerequisites

1. Node.js (v18 or higher)
2. Expo CLI (`npm install -g @expo/cli`)
3. iOS Simulator (for iOS development) or Android Studio (for Android development)

## Clerk Authentication Setup

### ✅ Already Configured!
The mobile app is already configured to use the **same Clerk application** as your website:
- **Publishable Key**: Already set in `.env` file
- **OAuth Providers**: Uses the same Google/Apple configuration as website
- **User Database**: Shares the same user accounts as your website

### Why No Secret Key Needed?

**Mobile App (Client-side):**
- ✅ **Publishable Key** (`pk_test_...`) - Safe for client use
- ❌ **Secret Key** - Never used in mobile apps for security

**Your Website (Server-side):**
- ✅ **Publishable Key** - For frontend authentication
- ✅ **Secret Key** - For backend admin operations

### Key Benefits:
1. **Shared User Accounts**: Users can login with same credentials on web and mobile
2. **Consistent OAuth**: Same Google/Apple login experience
3. **Secure Architecture**: Secret key stays safely on your server

### 4. Configure Redirect URLs
In Clerk dashboard, add these redirect URLs:
- `exp://localhost:8081/auth-callback` (for development)
- Your production app scheme when deploying

## Installation & Running

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on device:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## Features Implemented

### Authentication
- ✅ Email/Password signup with email verification
- ✅ Email/Password login
- ✅ Google OAuth (configured in Clerk)
- ✅ Apple OAuth (configured in Clerk)
- ✅ Automatic redirect to tabs after successful auth

### App Structure
- ✅ Tab navigation with 4 tabs:
  - **Home**: Welcome screen with quick actions
  - **Studio**: Create AI videos (image picker ready)
  - **History**: View created videos
  - **Profile**: User profile and settings

### UI Components
- ✅ Consistent styling matching website theme
- ✅ Loading states and error handling
- ✅ Responsive design for mobile

## Next Steps

1. **API Integration**: Connect to the same backend APIs as the website
2. **Video Creation**: Implement actual AI video generation
3. **File Upload**: Connect to Cloudinary or similar service
4. **Push Notifications**: Add notifications for video completion
5. **Subscription**: Implement in-app purchases for credits

## Troubleshooting

### Common Issues

1. **Clerk key not working**: Make sure you're using the correct publishable key from your Clerk dashboard

2. **OAuth not working**: Ensure OAuth providers are properly configured in Clerk dashboard with correct redirect URLs

3. **Build errors**: Try clearing cache:
```bash
npx expo start --clear
```

4. **Navigation issues**: Make sure all required dependencies are installed and linked properly

## File Structure

```
AnimateMemories/
├── app/
│   ├── (auth)/          # Authentication screens
│   ├── (tabs)/          # Main app tabs
│   ├── _layout.tsx      # Root layout with auth provider
│   └── index.tsx        # Entry point with auth routing
├── components/          # Reusable components
├── contexts/           # Auth context with Clerk
├── constants/          # App constants and colors
└── hooks/              # Custom hooks
```