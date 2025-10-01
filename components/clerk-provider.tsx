import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import Constants from 'expo-constants';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || Constants.expoConfig?.extra?.clerkPublishableKey;

// Check if we have a valid Clerk key - handle undefined/null cases
const hasValidClerkKey = publishableKey && 
  publishableKey !== null && 
  publishableKey !== undefined && 
  typeof publishableKey === 'string' && 
  publishableKey.length > 0 &&
  publishableKey.startsWith('pk_') && 
  !publishableKey.includes('placeholder');

if (!hasValidClerkKey) {
  console.warn('⚠️ No valid Clerk credentials found. Authentication will be disabled.');
  console.warn('📖 Please set up your environment variables for Clerk authentication.');
}

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // If we don't have a valid Clerk key, just return children without Clerk provider
  if (!hasValidClerkKey) {
    console.log('🔓 Running without authentication (Clerk not configured)');
    return <>{children}</>;
  }

  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      telemetry={false}
    >
      {children}
    </ClerkProvider>
  );
}
