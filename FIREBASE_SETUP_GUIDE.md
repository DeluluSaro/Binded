# Firebase Firestore Setup Guide

This guide will help you set up Firebase Firestore database for your React Native/Expo app.

## Prerequisites

- Node.js and npm installed
- Expo CLI installed
- A Google account for Firebase Console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "binded-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project dashboard, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (we'll configure security rules later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 3: Configure Authentication (Optional but Recommended)

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the authentication methods you want to use:
   - Email/Password
   - Google
   - Apple (for iOS)
   - Anonymous (for guest users)

## Step 4: Get Firebase Configuration

1. In the Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon (</>)
4. Register your app with a nickname (e.g., "binded-web")
5. Copy the Firebase configuration object

## Step 5: Update Your App Configuration

Replace the placeholder values in `app.json` with your actual Firebase configuration:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "your-actual-api-key",
      "firebaseAuthDomain": "your-project.firebaseapp.com",
      "firebaseProjectId": "your-actual-project-id",
      "firebaseStorageBucket": "your-project.appspot.com",
      "firebaseMessagingSenderId": "your-actual-sender-id",
      "firebaseAppId": "your-actual-app-id"
    }
  }
}
```

## Step 6: Configure Security Rules

1. In Firebase Console, go to "Firestore Database" > "Rules"
2. Replace the default rules with the content from `firestore.rules` file
3. Click "Publish"

## Step 7: Test Your Setup

Create a simple test component to verify everything is working:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { firestoreService } from '../services/firestoreService';

export const FirebaseTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');

  const testFirestore = async () => {
    try {
      // Test creating a document
      const docId = await firestoreService.createDocument('test', {
        message: 'Hello Firestore!',
        timestamp: new Date().toISOString()
      });
      
      setTestResult(`Success! Document created with ID: ${docId}`);
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Firebase Test</Text>
      <TouchableOpacity onPress={testFirestore}>
        <Text>Test Firestore Connection</Text>
      </TouchableOpacity>
      <Text>{testResult}</Text>
    </View>
  );
};
```

## Step 8: Set Up Environment Variables (Optional but Recommended)

For better security, you can use environment variables instead of hardcoding values in `app.json`:

1. Create a `.env` file in your project root:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

2. Install dotenv: `npm install dotenv`
3. Update your Firebase config to use environment variables (already done in `config/firebase.ts`)

## Step 9: Deploy Security Rules (Production)

For production, make sure to:

1. Review and customize the security rules in `firestore.rules`
2. Test the rules thoroughly
3. Deploy the rules to production

## Common Issues and Solutions

### Issue: "Firebase App named '[DEFAULT]' already exists"
**Solution**: Make sure you're only initializing Firebase once in your app.

### Issue: "Permission denied" errors
**Solution**: Check your Firestore security rules and make sure the user is authenticated.

### Issue: "Network request failed"
**Solution**: Check your internet connection and Firebase project configuration.

### Issue: "Invalid API key"
**Solution**: Double-check your Firebase configuration values in `app.json`.

## Next Steps

1. **Authentication**: Set up user authentication with Firebase Auth
2. **Real-time Updates**: Use the real-time listeners for live data updates
3. **Offline Support**: Firestore automatically handles offline data synchronization
4. **Indexing**: Create composite indexes for complex queries
5. **Backup**: Set up automated backups for your Firestore database

## Useful Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase React Native Guide](https://firebase.google.com/docs/web/setup)
- [Expo Firebase Integration](https://docs.expo.dev/guides/using-firebase/)

## Database Schema

Your Firestore database will have the following collections:

- `users` - User profiles and settings
- `books` - Book information and metadata
- `bookmarks` - User bookmarks and notes
- `readingProgress` - Reading progress tracking

Each collection follows the security rules defined in `firestore.rules` to ensure users can only access their own data.
