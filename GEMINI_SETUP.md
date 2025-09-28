# 🤖 Gemini API Setup Guide

This guide will help you set up the Gemini API key for the word meaning feature in your EPUB reader.

## 📋 Prerequisites

1. A Google account
2. Access to Google AI Studio

## 🔑 Getting Your API Key

1. **Visit Google AI Studio**: Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

2. **Sign in** with your Google account

3. **Create a new API key**:
   - Click "Create API Key"
   - Choose your Google Cloud project (or create a new one)
   - Copy the generated API key

## ⚙️ Setting Up Environment Variables

### Method 1: Using .env file (Recommended)

1. **Create a `.env` file** in your project root directory:
   ```bash
   # Create the file
   touch .env
   ```

2. **Add your API key** to the `.env` file:
   ```env
   # Gemini API Configuration
   EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Replace `your_actual_api_key_here`** with the API key you copied from Google AI Studio

### Method 2: Using Expo CLI

You can also set environment variables using Expo CLI:

```bash
# Set the environment variable
expo env:set EXPO_PUBLIC_GEMINI_API_KEY your_actual_api_key_here

# Or for development
expo start --env-file .env
```

## 🔒 Security Notes

- ✅ The `.env` file is already in `.gitignore`, so your API key won't be committed to GitHub
- ✅ Use `EXPO_PUBLIC_` prefix for React Native/Expo to expose the variable to the client
- ✅ Never commit your actual API key to version control

## 🧪 Testing the Setup

1. **Start your development server**:
   ```bash
   npm start
   # or
   expo start
   ```

2. **Test the word meaning feature**:
   - Open the EPUB reader
   - Click the 🤖 robot button
   - Select some text
   - Click "Get Meaning"
   - You should see the meaning popup

## 🚨 Troubleshooting

### "Gemini API key not configured" Error

If you see this error, it means the environment variable isn't being read properly:

1. **Check your `.env` file**:
   - Make sure it's in the project root directory
   - Ensure the variable name is `EXPO_PUBLIC_GEMINI_API_KEY`
   - No spaces around the `=` sign

2. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm start
   ```

3. **Check the console** for any environment variable loading errors

### API Key Not Working

1. **Verify your API key** is correct and active
2. **Check your Google Cloud billing** (some APIs require billing to be enabled)
3. **Ensure you have the right permissions** in Google AI Studio

## 📱 Production Deployment

For production builds, make sure to set the environment variable in your deployment platform:

- **Expo**: Use `expo env:set` or the Expo dashboard
- **EAS Build**: Set environment variables in your `eas.json`
- **Other platforms**: Use their respective environment variable systems

## 🔄 Updating Your API Key

If you need to update your API key:

1. **Update the `.env` file** with the new key
2. **Restart your development server**
3. **Test the functionality** to ensure it works

---

## 📞 Support

If you're still having issues:

1. Check the [Google AI Studio documentation](https://ai.google.dev/docs)
2. Verify your API key is active in the Google AI Studio dashboard
3. Make sure you have the necessary permissions for the Gemini API

Happy reading! 📚✨
