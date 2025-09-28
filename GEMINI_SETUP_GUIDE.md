# 🔧 Gemini AI Setup Guide

## Quick Fix for the Current Error

The error you're seeing is because the Gemini API model names were incorrect. I've fixed this by:

1. ✅ **Updated to Gemini 2.0 Flash** (`gemini-2.0-flash-exp`) as primary model
2. ✅ **Added comprehensive fallback models** including `gemini-1.5-flash-8b`, `gemini-1.5-flash`, etc.
3. ✅ **Enhanced error handling** with better debugging
4. ✅ **Added connection testing** to verify API key and available models
5. ✅ **Dynamic model detection** to use only available models

## Setup Steps

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with `AI`)

### 2. Create Environment File

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

**Replace `your_actual_api_key_here` with your real API key from step 1.**

### 3. Restart Development Server

After adding the API key, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm start
# or
expo start
```

### 4. Test the Integration

1. Open an EPUB book in your app
2. Click the 🤖 button to enable robot mode
3. Select any text using native text selection
4. Click "🤖 Get Meaning" button
5. You should see the AI-generated definition

## Troubleshooting

### Error: "API key not configured"
- ✅ Make sure `.env` file exists in project root
- ✅ Make sure API key starts with `AI`
- ✅ Restart development server after adding key

### Error: "API request failed: 404"
- ✅ This should be fixed now with Gemini 2.0 Flash and correct model names
- ✅ The service now tries multiple models automatically
- ✅ Run `node debug-gemini.js` to see available models

### Error: "Connection test failed"
- ✅ Check your internet connection
- ✅ Verify API key is correct
- ✅ Make sure you have API access enabled

### Still having issues?

Run the test script to debug:

```bash
node test-gemini.js
```

This will check your API key and test the connection.

## How It Works Now

1. **User selects text** → Robot mode enabled
2. **"Get Meaning" button appears** → Mobile-optimized
3. **API call made** → Tries multiple Gemini models
4. **AI response received** → Cached for future use
5. **Definition displayed** → In popup with loading states

## Features Included

- ✅ **Multiple Model Fallback**: Tries `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`
- ✅ **Smart Caching**: Repeated words are cached
- ✅ **Error Handling**: Network failures, API errors, invalid responses
- ✅ **Mobile Optimized**: Touch events, positioning, responsive design
- ✅ **Rate Limiting**: Prevents API quota exhaustion
- ✅ **Retry Logic**: Automatic retries with exponential backoff
- ✅ **Connection Testing**: Verifies API key on first use

## API Usage

The integration uses Google's Gemini API with these settings:
- **Models**: `gemini-1.5-flash` (primary), `gemini-1.5-pro`, `gemini-pro` (fallbacks)
- **Temperature**: 0.3 (consistent, factual responses)
- **Max Tokens**: 200 (concise definitions)
- **Rate Limit**: 100ms between requests

## Cost Information

- **Free Tier**: 15 requests per minute, 1 million tokens per day
- **Pricing**: $0.000075 per 1K characters input, $0.0003 per 1K characters output
- **Typical Cost**: ~$0.001 per word definition request

The integration is optimized to minimize API calls through caching and efficient prompting.
