# Authentication Guide

This guide explains how authentication works in your app and how to implement proper user authentication checks.

## Overview

Your app uses Clerk for authentication and includes several components and hooks to handle user authentication automatically.

## Key Features

- ✅ Automatic redirect to sign-up for unauthenticated users
- ✅ Email validation for authenticated users
- ✅ Reusable authentication components
- ✅ Custom authentication hooks
- ✅ Loading states and error handling

## Components

### 1. AuthGuard Component

The `AuthGuard` component automatically handles authentication checks and redirects.

```tsx
import AuthGuard from '@/components/auth-guard';

export default function ProtectedScreen() {
  return (
    <AuthGuard fallbackRoute="/sign-up" requireEmail={true}>
      <YourProtectedContent />
    </AuthGuard>
  );
}
```

**Props:**
- `children`: React components to render when authenticated
- `fallbackRoute`: Route to redirect to when not authenticated (default: "/sign-up")
- `requireEmail`: Whether to require user to have an email address (default: true)

### 2. useAuthRedirect Hook

A custom hook for more granular authentication control.

```tsx
import { useAuthRedirect } from '@/hooks/use-auth-redirect';

export default function CustomAuthScreen() {
  const { isAuthenticated, isLoading, user } = useAuthRedirect({
    redirectTo: '/sign-up',
    requireEmail: true,
    onRedirect: () => {
      console.log('Redirecting user...');
    }
  });

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return null; // Will redirect automatically

  return <YourContent />;
}
```

**Options:**
- `redirectTo`: Route to redirect to (default: "/sign-up")
- `requireEmail`: Require email address (default: true)
- `onRedirect`: Callback function when redirecting

**Returns:**
- `isAuthenticated`: Boolean indicating if user is properly authenticated
- `isLoading`: Boolean indicating if authentication is still loading
- `user`: Clerk user object

## Implementation Examples

### Basic Page Protection

```tsx
// app/(tabs)/index.tsx
import AuthGuard from '@/components/auth-guard';

export default function HomeScreen() {
  return (
    <AuthGuard fallbackRoute="/sign-up" requireEmail={true}>
      {/* Your home screen content */}
    </AuthGuard>
  );
}
```

### Custom Authentication Logic

```tsx
// components/my-component.tsx
import { useAuthRedirect } from '@/hooks/use-auth-redirect';

export default function MyComponent() {
  const { isAuthenticated, isLoading, user } = useAuthRedirect({
    redirectTo: '/sign-up',
    requireEmail: true
  });

  if (isLoading) {
    return <Text>Checking authentication...</Text>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect automatically
  }

  return (
    <View>
      <Text>Welcome, {user?.firstName}!</Text>
      <Text>Email: {user?.emailAddresses?.[0]?.emailAddress}</Text>
    </View>
  );
}
```

### Multiple Authentication Levels

```tsx
// For pages that require authentication but not email
<AuthGuard fallbackRoute="/sign-up" requireEmail={false}>
  <ContentForUsersWithoutEmail />
</AuthGuard>

// For pages that require both authentication and email
<AuthGuard fallbackRoute="/sign-up" requireEmail={true}>
  <ContentForUsersWithEmail />
</AuthGuard>
```

## Authentication Flow

1. **User visits protected page**
2. **AuthGuard checks authentication status**
3. **If not signed in**: Redirect to `/sign-up`
4. **If signed in but no email (and requireEmail=true)**: Redirect to `/sign-up`
5. **If properly authenticated**: Render content

## Error Handling

The authentication system includes built-in error handling:

- **Loading states**: Shows loading indicator while checking authentication
- **Automatic redirects**: Seamlessly redirects users to appropriate pages
- **Console logging**: Logs authentication events for debugging
- **Graceful fallbacks**: Handles edge cases and errors

## Best Practices

### 1. Use AuthGuard for Simple Cases

```tsx
// ✅ Good: Simple protection
<AuthGuard fallbackRoute="/sign-up">
  <MyContent />
</AuthGuard>
```

### 2. Use useAuthRedirect for Complex Logic

```tsx
// ✅ Good: Custom logic
const { isAuthenticated, isLoading } = useAuthRedirect({
  redirectTo: '/sign-up',
  onRedirect: () => {
    // Custom logic before redirect
    analytics.track('user_redirected_to_signup');
  }
});
```

### 3. Handle Loading States

```tsx
// ✅ Good: Handle loading
if (isLoading) {
  return <LoadingScreen />;
}
```

### 4. Provide User Feedback

```tsx
// ✅ Good: User feedback
const { isAuthenticated } = useAuthRedirect({
  onRedirect: () => {
    Alert.alert('Authentication Required', 'Please sign up to continue');
  }
});
```

## Troubleshooting

### Common Issues

1. **Infinite redirect loops**
   - Check that your fallback route doesn't also require authentication
   - Ensure sign-up page is accessible without authentication

2. **Users not being redirected**
   - Verify Clerk is properly configured
   - Check that `isLoaded` is true before checking authentication

3. **Email validation not working**
   - Ensure `requireEmail={true}` is set
   - Check that user actually has email addresses in Clerk

### Debug Tips

```tsx
// Add logging to debug authentication
const { isAuthenticated, isLoading, user } = useAuthRedirect({
  onRedirect: () => {
    console.log('🔐 Redirecting user to sign-up');
    console.log('User data:', user);
  }
});

console.log('Auth status:', { isAuthenticated, isLoading });
```

## Integration with Firebase

Since you're also using Firebase, you can integrate authentication with Firestore:

```tsx
import { firestoreService } from '@/services/firestoreService';

export default function ProtectedScreen() {
  const { isAuthenticated, user } = useAuthRedirect();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create or update user in Firestore
      firestoreService.createUser({
        email: user.emailAddresses[0].emailAddress,
        displayName: user.firstName,
        photoURL: user.imageUrl
      });
    }
  }, [isAuthenticated, user]);

  return <YourContent />;
}
```

## Security Considerations

- ✅ Always validate user authentication on protected routes
- ✅ Use HTTPS in production
- ✅ Implement proper error boundaries
- ✅ Log authentication events for monitoring
- ✅ Handle edge cases (network errors, etc.)

## Next Steps

1. **Test the authentication flow** with different user scenarios
2. **Customize redirect routes** based on your app's needs
3. **Add analytics** to track authentication events
4. **Implement role-based access** if needed
5. **Add biometric authentication** for enhanced security

This authentication system ensures that users are properly authenticated before accessing protected content, with automatic redirects to the sign-up page when needed.
