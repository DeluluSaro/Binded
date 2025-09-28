/**
 * Test script for Gemini API integration
 * Run this to verify your API key and available models
 */

// Import the service (this will work in Node.js environment)
const geminiService = require('./services/geminiService.js').default;

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API Integration...\n');
  
  // Check API key
  console.log('1. Checking API key...');
  if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
    console.error('❌ EXPO_PUBLIC_GEMINI_API_KEY not found in environment variables');
    console.log('💡 Create a .env file with: EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here');
    return;
  }
  
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  console.log(`✅ API key found: ${apiKey.substring(0, 10)}...`);
  
  // Test API key format
  console.log('\n2. Validating API key format...');
  if (geminiService.isApiKeyValid()) {
    console.log('✅ API key format is valid');
  } else {
    console.error('❌ API key format is invalid');
    console.log('💡 API key should start with "AI" and be longer than 10 characters');
    return;
  }
  
  // Test connection
  console.log('\n3. Testing API connection...');
  try {
    const isConnected = await geminiService.testConnection();
    if (isConnected) {
      console.log('✅ API connection successful');
    } else {
      console.error('❌ API connection failed');
      return;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return;
  }
  
  // Test word meaning
  console.log('\n4. Testing word meaning...');
  try {
    const result = await geminiService.getWordMeaning('serendipity');
    if (result.error) {
      console.error('❌ Word meaning test failed:', result.error);
    } else {
      console.log('✅ Word meaning test successful');
      console.log(`📝 Meaning: ${result.meaning}`);
    }
  } catch (error) {
    console.error('❌ Word meaning test error:', error.message);
  }
  
  console.log('\n🎉 Gemini API integration test completed!');
}

// Run the test
testGeminiAPI().catch(console.error);
