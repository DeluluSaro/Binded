import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '';

console.log('🔍 Supabase Configuration Debug:');
console.log('Environment URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Constants URL:', Constants.expoConfig?.extra?.supabaseUrl);
console.log('Final URL:', supabaseUrl);
console.log('Environment Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('Constants Key:', Constants.expoConfig?.extra?.supabaseAnonKey ? 'Set' : 'Not set');
console.log('Final Key:', supabaseAnonKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('URL:', supabaseUrl || 'MISSING');
  console.error('Key:', supabaseAnonKey ? 'Set' : 'MISSING');
  throw new Error('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment or app.json');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Book {
  id: string;
  name: string;
  author: string;
  genre: string;
  file_path?: string;
  short_description: string;
  cover_image_path?: string;
  total_pages: number;
  rating: number;
  reviews: any[];
  created_at: string;
  updated_at: string;
}

export const fetchBooks = async (): Promise<Book[]> => {
  try {
    console.log('🚀 Starting to fetch books from Supabase...');
    console.log('📡 Supabase URL:', supabaseUrl);
    console.log('🔑 Key present:', !!supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Supabase Database Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
    }

    if (!data || data.length === 0) {
      console.log('📚 No books found in database');
      return [];
    }

    console.log('✅ Books fetched successfully!');
    console.log('📚 Number of books found:', data.length);
    console.log('📖 Books:', data.map(book => ({ name: book.name, author: book.author })));

    console.log('📚 Books loaded in component:', data.length, 'books');
    return data;

  } catch (error) {
    console.error('💥 Exception in fetchBooks:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return [];
  }
};

export const getBookUrl = (filePath: string): string => {
  // If filePath is a full URL, return it directly
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Otherwise, get the public URL from storage
  const { data } = supabase.storage
    .from('Books')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};