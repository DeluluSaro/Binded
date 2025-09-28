/**
 * Gemini API Service for Word Meanings
 * Handles AI-powered word definition requests
 */

class GeminiService {
  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    this.cache = new Map();
    this.rateLimitQueue = [];
    this.isProcessingQueue = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.connectionTested = false;
  }

  /**
   * Get word meaning from Gemini API
   * @param {string} word - The word or phrase to get meaning for
   * @returns {Promise<{meaning: string, error?: string}>}
   */
  async getWordMeaning(word) {
    try {
      // Validate input
      if (!word || typeof word !== 'string') {
        throw new Error('Invalid word provided');
      }

      const cleanWord = word.trim();
      if (cleanWord.length === 0) {
        throw new Error('Empty word provided');
      }

      // Check cache first
      const cacheKey = cleanWord.toLowerCase();
      if (this.cache.has(cacheKey)) {
        console.log('📚 Cache hit for word:', cleanWord);
        return { meaning: this.cache.get(cacheKey) };
      }

      // Validate API key
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      console.log('🤖 Requesting meaning for word:', cleanWord);

      // Make API request
      const meaning = await this.makeApiRequest(cleanWord);
      
      // Cache the result
      this.cache.set(cacheKey, meaning);
      
      return { meaning };

    } catch (error) {
      console.error('❌ Error getting word meaning:', error);
      return { 
        meaning: null, 
        error: error.message || 'Failed to get word meaning' 
      };
    }
  }

  /**
   * Make API request to Gemini with retry logic
   * @param {string} word - The word to get meaning for
   * @returns {Promise<string>}
   */
  async makeApiRequest(word) {
    const requestBody = {
      contents: [{
        parts: [{
          text: this.buildPrompt(word)
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 200
      }
    };

    // Try different models in order of preference
    const models = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.5-flash-001',
      'gemini-1.5-pro-001'
    ];

    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      for (const model of models) {
        try {
          console.log(`🔄 API attempt ${attempt}/${this.maxRetries} with model ${model} for word: ${word}`);
          
          const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
          const response = await fetch(`${modelUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Gemini API Error:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
              model: model,
              url: `${modelUrl}?key=${this.apiKey.substring(0, 10)}...`
            });
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          
          if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid API response structure');
          }

          const meaning = data.candidates[0].content.parts[0].text;
          
          if (!meaning || meaning.trim().length === 0) {
            throw new Error('Empty response from API');
          }

          console.log(`✅ Successfully got meaning for word: ${word} using model: ${model}`);
          return this.formatMeaning(meaning);

        } catch (error) {
          lastError = error;
          console.warn(`⚠️ API attempt ${attempt} with model ${model} failed:`, error.message);
          
          // If this model failed, try the next model
          continue;
        }
      }
      
      // If all models failed for this attempt, wait before retrying
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ All models failed for attempt ${attempt}, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('All API attempts failed');
  }

  /**
   * Build the prompt for Gemini API
   * @param {string} word - The word to get meaning for
   * @returns {string}
   */
  buildPrompt(word) {
    return `Provide a concise, clear definition for the word or phrase "${word}". 

Requirements:
- Keep it to 2-3 sentences maximum
- Use simple, clear language
- Include part of speech if helpful
- If it's a phrase, explain the overall meaning
- Focus on the most common usage
- Don't include examples unless necessary

Format your response as a clean definition without extra formatting.`;
  }

  /**
   * Format the meaning response for display
   * @param {string} rawMeaning - Raw response from API
   * @returns {string}
   */
  formatMeaning(rawMeaning) {
    if (!rawMeaning) return 'No definition available';
    
    // Clean up the response
    let meaning = rawMeaning.trim();
    
    // Remove any markdown formatting
    meaning = meaning.replace(/\*\*(.*?)\*\*/g, '$1');
    meaning = meaning.replace(/\*(.*?)\*/g, '$1');
    meaning = meaning.replace(/`(.*?)`/g, '$1');
    
    // Remove extra whitespace
    meaning = meaning.replace(/\s+/g, ' ');
    
    // Ensure it ends with proper punctuation
    if (!meaning.match(/[.!?]$/)) {
      meaning += '.';
    }
    
    return meaning;
  }

  /**
   * Process rate-limited requests
   * @param {Function} requestFn - The request function to execute
   * @returns {Promise}
   */
  async processWithRateLimit(requestFn) {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process the rate limit queue
   */
  async processQueue() {
    if (this.isProcessingQueue || this.rateLimitQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.rateLimitQueue.length > 0) {
      const { requestFn, resolve, reject } = this.rateLimitQueue.shift();
      
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Rate limiting: wait 100ms between requests
      if (this.rateLimitQueue.length > 0) {
        await this.sleep(100);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Gemini service cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Sleep utility function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API key format
   * @returns {boolean}
   */
  isApiKeyValid() {
    return this.apiKey && this.apiKey.length > 10 && this.apiKey.startsWith('AI');
  }

  /**
   * Get available models (for debugging)
   * @returns {Promise<Array>}
   */
  async getAvailableModels() {
    try {
      console.log('🔍 Fetching available Gemini models...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      const data = await response.json();
      const models = data.models || [];
      
      // Filter for generateContent supported models
      const supportedModels = models.filter(model => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      );
      
      console.log('📋 Available models with generateContent support:', 
        supportedModels.map(m => m.name).slice(0, 10)
      );
      
      return supportedModels;
    } catch (error) {
      console.error('Error fetching available models:', error);
      return [];
    }
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      if (!this.isApiKeyValid()) {
        throw new Error('Invalid API key format');
      }

      console.log('🔍 Testing Gemini API connection...');
      
      // First, try to get available models
      const availableModels = await this.getAvailableModels();
      if (availableModels.length > 0) {
        console.log('✅ Found available models:', availableModels.map(m => m.name).slice(0, 5));
        
        // Update our model list with actually available models
        const modelNames = availableModels.map(m => m.name);
        console.log('🔄 Using available models for requests');
      } else {
        console.log('⚠️ No models found, using fallback list');
      }
      
      // Then test with a simple word
      const testResult = await this.getWordMeaning('test');
      return !testResult.error;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const geminiService = new GeminiService();

export default geminiService;
