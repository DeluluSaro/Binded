#!/usr/bin/env node

/**
 * 🤖 Gemini API Setup Script
 * This script helps you set up your Gemini API key for the EPUB reader
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 Gemini API Setup for EPUB Reader');
console.log('=====================================\n');

console.log('This script will help you set up your Gemini API key.');
console.log('You can get your API key from: https://makersuite.google.com/app/apikey\n');

rl.question('Enter your Gemini API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Setup cancelled.');
    rl.close();
    return;
  }

  const envContent = `# Gemini API Configuration
# Get your API key from: https://makersuite.google.com/app/apikey
EXPO_PUBLIC_GEMINI_API_KEY=${apiKey.trim()}
`;

  const envPath = path.join(process.cwd(), '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📁 Location:', envPath);
    console.log('\n🔒 Security note: The .env file is already in .gitignore, so your API key is safe.');
    console.log('\n🚀 Next steps:');
    console.log('1. Restart your development server (npm start or expo start)');
    console.log('2. Test the word meaning feature in the EPUB reader');
    console.log('3. Click the 🤖 robot button and select text to get meanings');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }

  rl.close();
});

rl.on('close', () => {
  console.log('\n📚 Happy reading!');
});
