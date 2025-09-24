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
  file_path: string;
  created_at: string;
  updated_at: string;
}

export const fetchBooks = async (): Promise<Book[]> => {
  try {
    console.log('🚀 Starting to fetch books from Supabase...');
    console.log('📡 Supabase URL:', supabaseUrl);
    console.log('🔑 Key present:', !!supabaseAnonKey);
    
    const { data, error } = await supabase.storage
      .from('Books')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('❌ Supabase Storage Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
    }

    console.log('✅ Books fetched successfully!');
    console.log('📚 Number of books found:', data?.length || 0);
    console.log('📖 Book files:', data?.map(file => file.name) || []);

    if (!data || data.length === 0) {
      console.log('⚠️ No books found in the Books bucket');
      return [];
    }

    const books = data.map((file) => ({
      id: file.id,
      name: file.name,
      file_path: file.name,
      created_at: file.created_at,
      updated_at: file.updated_at
    }));

    console.log('📋 Processed books:', books);
    return books;
  } catch (error) {
    console.error('💥 Exception in fetchBooks:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return [];
  }
};

export const getBookUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('Books')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};
