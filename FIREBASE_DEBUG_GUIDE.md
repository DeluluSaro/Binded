# Firebase Debug Guide

This guide will help you debug the Firebase connection issues you're experiencing.

## Quick Test

1. **Add the debug component to your app**:
   ```typescript
   // In your main app component or any screen
   import FirebaseDebug from '../components/firebase-debug';
   
   // Add this to your render method
   <FirebaseDebug />
   ```

2. **Check the console logs** when the app starts:
   - Look for Firebase initialization logs
   - Check for any error messages
   - Verify the configuration is loaded correctly

## Expected Console Output

When Firebase is working correctly, you should see:
```
🔧 Firebase config: { apiKey: "...", authDomain: "...", ... }
✅ Firebase app initialized: [DEFAULT]
✅ Firestore initialized
✅ Auth initialized
```

## Common Issues and Solutions

### 1. Firebase Configuration Not Loading
**Symptoms**: No Firebase config logs in console
**Solution**: 
- Check that `app.json` has the Firebase configuration in the `extra` section
- Verify the configuration values are correct
- Try restarting the development server

### 2. "where is not a function" Error
**Symptoms**: Error about `where` not being a function
**Solution**: 
- This has been fixed by importing `where` directly from Firebase
- Make sure you're using the latest version of the code

### 3. "firestoreService.updateDocument is not a function"
**Symptoms**: Error about updateDocument not being a function
**Solution**: 
- This usually means the firestoreService is not properly imported
- Check that the import path is correct
- Verify the firestoreService is properly exported

### 4. Network/Connection Issues
**Symptoms**: Timeout or network errors
**Solution**: 
- Check your internet connection
- Verify Firebase project is active
- Check Firebase console for any service issues

## Debug Steps

1. **Test Firebase Connection**:
   - Use the `FirebaseDebug` component
   - Click "Test Firebase Connection" button
   - Check console for detailed logs

2. **Test User Service**:
   - Make sure you're signed in with Clerk
   - Click "Test User Service" button
   - Check console for detailed logs

3. **Check Console Logs**:
   - Look for the detailed debugging information
   - Each step should show success/failure messages
   - Errors will show the exact point of failure

## Manual Testing

You can also test the services manually:

```typescript
import { userService } from '../services/userService';
import { firestoreService } from '../services/firestoreService';

// Test basic Firestore connection
const testDoc = await firestoreService.createDocument('test', { test: true });
console.log('Test document created:', testDoc);

// Test user service
const userId = await userService.createOrUpdateUser(clerkUser);
console.log('User created/updated:', userId);
```

## If Issues Persist

1. **Check Firebase Console**:
   - Go to Firebase Console
   - Check if your project is active
   - Verify Firestore is enabled
   - Check security rules

2. **Verify Configuration**:
   - Double-check all Firebase config values
   - Make sure they match your Firebase project
   - Try using the hardcoded values as fallback

3. **Check Dependencies**:
   - Make sure Firebase packages are installed
   - Check for version conflicts
   - Try reinstalling Firebase packages

4. **Network Issues**:
   - Check if you're behind a firewall
   - Try on a different network
   - Check if Firebase services are accessible

## Expected Behavior

When everything is working:
1. Firebase initializes on app start
2. User sync component loads user data
3. User data is created/updated in Firebase
4. All services work without errors
5. Console shows success messages

## Debugging Tips

- **Enable detailed logging**: The code now includes extensive console logging
- **Check step by step**: Each operation is logged with success/failure
- **Look for specific errors**: The logs will show exactly where the failure occurs
- **Test in isolation**: Use the debug component to test individual services

## Common Error Messages

- `"where is not a function"` → Fixed by importing `where` from Firebase
- `"updateDocument is not a function"` → Check firestoreService import
- `"Firebase app not initialized"` → Check Firebase configuration
- `"Network error"` → Check internet connection and Firebase status

The debugging code will help you identify exactly where the issue is occurring and provide detailed information about what's happening at each step.
