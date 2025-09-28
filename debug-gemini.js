/**
 * Debug script to test Gemini API and find working models
 */

// Simple fetch test without dependencies
async function testGeminiAPI() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ EXPO_PUBLIC_GEMINI_API_KEY not found');
    console.log('💡 Create a .env file with: EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here');
    return;
  }
  
  console.log('🔍 Testing Gemini API with key:', apiKey.substring(0, 10) + '...');
  
  try {
    // Test 1: Get available models
    console.log('\n1. Fetching available models...');
    const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!modelsResponse.ok) {
      console.error('❌ Failed to fetch models:', modelsResponse.status, modelsResponse.statusText);
      const errorText = await modelsResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const modelsData = await modelsResponse.json();
    const models = modelsData.models || [];
    
    console.log(`✅ Found ${models.length} total models`);
    
    // Filter for generateContent supported models
    const supportedModels = models.filter(model => 
      model.supportedGenerationMethods && 
      model.supportedGenerationMethods.includes('generateContent')
    );
    
    console.log(`✅ Found ${supportedModels.length} models supporting generateContent:`);
    supportedModels.slice(0, 10).forEach(model => {
      console.log(`  - ${model.name}`);
    });
    
    // Test 2: Try a simple request with the first available model
    if (supportedModels.length > 0) {
      const testModel = supportedModels[0].name;
      console.log(`\n2. Testing with model: ${testModel}`);
      
      const testRequest = {
        contents: [{
          parts: [{
            text: 'What does "serendipity" mean? Provide a clear, concise definition in 1-2 sentences.'
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200
        }
      };
      
      const testResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testRequest)
        }
      );
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Test request successful!');
        console.log('📝 Response:', testData.candidates?.[0]?.content?.parts?.[0]?.text || 'No content');
      } else {
        const errorText = await testResponse.text();
        console.error('❌ Test request failed:', testResponse.status, errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Run the test
testGeminiAPI().catch(console.error);
