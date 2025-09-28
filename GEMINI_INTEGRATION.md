# Gemini AI Integration for EPUB Reader

This document describes the AI-powered word meaning feature implemented using Google's Gemini API.

## Overview

The EPUB reader now includes AI-powered word definitions that users can access by:
1. Enabling robot mode (🤖 button)
2. Selecting text using native text selection
3. Clicking the "Get Meaning" button that appears
4. Viewing the AI-generated definition in a popup

## Implementation Details

### Files Created/Modified

1. **`services/geminiService.js`** - New service module
   - Handles all Gemini API interactions
   - Includes caching, rate limiting, and error handling
   - Provides retry logic with exponential backoff

2. **`config/gemini.ts`** - Updated configuration
   - Now uses `EXPO_PUBLIC_GEMINI_API_KEY` environment variable
   - Improved API key validation

3. **`hooks/useEpubReader.ts`** - Updated WebView message handler
   - Integrated Gemini service
   - Handles `getWordMeaning` messages from WebView
   - Sends `wordMeaningResponse` back to WebView

### Environment Setup

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### Message Flow

1. **User selects text** → WebView detects selection
2. **WebView sends message**: `{type: 'getWordMeaning', data: {word: 'selectedText'}}`
3. **React Native receives** → Calls `geminiService.getWordMeaning(word)`
4. **Gemini API called** → Returns AI-generated definition
5. **React Native responds**: `{type: 'wordMeaningResponse', meaning: 'definition'}`
6. **WebView displays** → Shows definition in popup

### Features

- **Caching**: Frequently looked-up words are cached to reduce API calls
- **Rate Limiting**: Prevents API quota exhaustion
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Retry Logic**: Automatic retries with exponential backoff
- **Input Validation**: Validates selected text before API calls
- **Mobile Optimized**: Works seamlessly on mobile devices

### API Configuration

The service uses:
- **Model**: `gemini-1.5-flash-latest`
- **Temperature**: 0.3 (for consistent, factual responses)
- **Max Tokens**: 200 (concise definitions)
- **Rate Limit**: 100ms between requests

### Error Handling

The implementation handles:
- Network failures
- API rate limits
- Invalid API responses
- Malformed selected text
- Missing API key
- Timeout errors

### Caching Strategy

- Words are cached by lowercase key
- Cache persists for the app session
- Reduces API calls for repeated lookups
- Cache can be cleared with `geminiService.clearCache()`

### Testing

To test the implementation:

1. Set up your `.env` file with a valid Gemini API key
2. Open an EPUB book in the reader
3. Enable robot mode (🤖 button)
4. Select any text using native text selection
5. Click the "Get Meaning" button
6. Verify the definition appears in the popup

### Troubleshooting

**"API key not configured" error:**
- Ensure `.env` file exists with `EXPO_PUBLIC_GEMINI_API_KEY`
- Restart the development server after adding the key

**"Failed to get meaning" error:**
- Check internet connection
- Verify API key is valid
- Check API quota limits

**No response from API:**
- Check console logs for detailed error messages
- Verify API key has proper permissions
- Test API key with a simple request

## Security Notes

- API key is never exposed to the WebView
- All API calls are made from React Native side
- Environment variables are properly scoped
- No sensitive data is logged

## Performance Considerations

- Caching reduces redundant API calls
- Rate limiting prevents quota exhaustion
- Retry logic handles temporary failures
- Mobile-optimized UI for smooth experience
