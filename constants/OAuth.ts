/**
 * OAuth Configuration Constants
 *
 * IMPORTANT: The redirect URL must be added to your Clerk dashboard:
 * 1. Go to https://dashboard.clerk.com
 * 2. Select your application
 * 3. Navigate to: Configure → User & authentication → SSO connections
 * 4. Click on your OAuth provider (Google or Apple)
 * 5. Look for "Allowed redirect URLs" or "Authorized redirect URIs"
 * 6. Add the redirect URL: animatememories://auth-callback
 *
 * For development with Expo Go, you may also need:
 * - exp://localhost:8081/auth-callback
 *
 * For production builds, use:
 * - animatememories://auth-callback
 */

// Get the app scheme from app.json (should match "scheme" field)
// Note: This is the URL scheme, not the bundle identifier
const APP_SCHEME = "animatememories";

/**
 * OAuth redirect URL for authentication callbacks
 * This URL must be registered in your Clerk dashboard
 */
export const OAUTH_REDIRECT_URL = `${APP_SCHEME}://auth-callback`;

/**
 * Development redirect URL (for Expo Go)
 * Uncomment and use this if testing with Expo Go
 */
// export const OAUTH_REDIRECT_URL = "exp://localhost:8081/auth-callback";
