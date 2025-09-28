// 🔑 GEMINI API CONFIGURATION
// This file reads the Gemini API key from environment variables
// Create a .env file in your project root with: EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
// Get your API key from: https://makersuite.google.com/app/apikey

// For React Native/Expo, use EXPO_PUBLIC_ prefix to expose environment variables
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Helper function to check if API key is configured
export const isGeminiConfigured = () => {
  return GEMINI_API_KEY && GEMINI_API_KEY.length > 10 && GEMINI_API_KEY.startsWith('AI');
};
