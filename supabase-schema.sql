-- Supabase Schema for User Reading Progress Tracking
-- Run this SQL in your Supabase SQL Editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create reading_progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL, -- References the book file name/path
  book_name TEXT NOT NULL,
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
  last_read_position TEXT, -- JSON string for specific position data
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  reading_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON reading_progress(last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_progress_progress ON reading_progress(progress_percentage DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for reading_progress
CREATE POLICY "Users can view own reading progress" ON reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading progress" ON reading_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading progress" ON reading_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading progress" ON reading_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user's currently reading books (sorted by last_read_at DESC)
CREATE OR REPLACE FUNCTION get_currently_reading_books(user_uuid UUID, limit_count INTEGER DEFAULT 3)
RETURNS TABLE (
  book_id TEXT,
  book_name TEXT,
  current_page INTEGER,
  total_pages INTEGER,
  progress_percentage DECIMAL(5,2),
  last_read_at TIMESTAMP WITH TIME ZONE,
  reading_time_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.book_id,
    rp.book_name,
    rp.current_page,
    rp.total_pages,
    rp.progress_percentage,
    rp.last_read_at,
    rp.reading_time_minutes
  FROM reading_progress rp
  WHERE rp.user_id = user_uuid 
    AND rp.is_completed = FALSE
  ORDER BY rp.last_read_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update reading progress
CREATE OR REPLACE FUNCTION update_reading_progress(
  user_uuid UUID,
  book_id_param TEXT,
  book_name_param TEXT,
  current_page_param INTEGER DEFAULT 0,
  total_pages_param INTEGER DEFAULT 0,
  last_read_position_param TEXT DEFAULT NULL,
  reading_time_minutes_param INTEGER DEFAULT 0
)
RETURNS reading_progress AS $$
DECLARE
  result reading_progress;
  progress_percent DECIMAL(5,2) := 0.00;
BEGIN
  -- Calculate progress percentage
  IF total_pages_param > 0 THEN
    progress_percent := (current_page_param::DECIMAL / total_pages_param::DECIMAL) * 100.00;
  END IF;
  
  -- Check if book is completed
  IF progress_percent >= 100.00 THEN
    -- Insert or update with completion
    INSERT INTO reading_progress (
      user_id, book_id, book_name, current_page, total_pages, 
      progress_percentage, last_read_position, last_read_at, 
      completed_at, is_completed, reading_time_minutes
    )
    VALUES (
      user_uuid, book_id_param, book_name_param, current_page_param, 
      total_pages_param, progress_percent, last_read_position_param, 
      NOW(), NOW(), TRUE, reading_time_minutes_param
    )
    ON CONFLICT (user_id, book_id) 
    DO UPDATE SET
      current_page = EXCLUDED.current_page,
      total_pages = EXCLUDED.total_pages,
      progress_percentage = EXCLUDED.progress_percentage,
      last_read_position = EXCLUDED.last_read_position,
      last_read_at = EXCLUDED.last_read_at,
      completed_at = EXCLUDED.completed_at,
      is_completed = EXCLUDED.is_completed,
      reading_time_minutes = reading_progress.reading_time_minutes + EXCLUDED.reading_time_minutes,
      updated_at = NOW()
    RETURNING * INTO result;
  ELSE
    -- Insert or update without completion
    INSERT INTO reading_progress (
      user_id, book_id, book_name, current_page, total_pages, 
      progress_percentage, last_read_position, last_read_at, 
      reading_time_minutes
    )
    VALUES (
      user_uuid, book_id_param, book_name_param, current_page_param, 
      total_pages_param, progress_percent, last_read_position_param, 
      NOW(), reading_time_minutes_param
    )
    ON CONFLICT (user_id, book_id) 
    DO UPDATE SET
      current_page = EXCLUDED.current_page,
      total_pages = EXCLUDED.total_pages,
      progress_percentage = EXCLUDED.progress_percentage,
      last_read_position = EXCLUDED.last_read_position,
      last_read_at = EXCLUDED.last_read_at,
      reading_time_minutes = reading_progress.reading_time_minutes + EXCLUDED.reading_time_minutes,
      updated_at = NOW()
    RETURNING * INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's reading statistics
CREATE OR REPLACE FUNCTION get_user_reading_stats(user_uuid UUID)
RETURNS TABLE (
  total_books_read INTEGER,
  total_reading_time_minutes INTEGER,
  currently_reading_count INTEGER,
  completed_books_count INTEGER,
  average_progress DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN rp.is_completed = TRUE THEN 1 END)::INTEGER as total_books_read,
    COALESCE(SUM(rp.reading_time_minutes), 0)::INTEGER as total_reading_time_minutes,
    COUNT(CASE WHEN rp.is_completed = FALSE THEN 1 END)::INTEGER as currently_reading_count,
    COUNT(CASE WHEN rp.is_completed = TRUE THEN 1 END)::INTEGER as completed_books_count,
    COALESCE(AVG(rp.progress_percentage), 0.00)::DECIMAL(5,2) as average_progress
  FROM reading_progress rp
  WHERE rp.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON reading_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_currently_reading_books(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_reading_progress(UUID, TEXT, TEXT, INTEGER, INTEGER, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_reading_stats(UUID) TO authenticated;
