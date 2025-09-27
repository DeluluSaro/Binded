# Supabase Setup Guide for User Reading Progress

This guide will help you set up the Supabase database schema for tracking user reading progress in your app.

## 📋 Prerequisites

1. A Supabase project set up
2. Your Supabase URL and anon key configured in your app
3. Access to the Supabase SQL Editor

## 🗄️ Database Schema Setup

### Step 1: Run the SQL Schema

1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor** tab
3. Copy the contents of `supabase-schema.sql` and paste it into the SQL Editor
4. Click **Run** to execute the schema

**Note**: If you encounter a permission error about `app.jwt_secret`, that's normal - this parameter is managed by Supabase automatically and doesn't need to be set manually.

### Step 2: Verify Tables Created

After running the SQL, you should see these tables in your **Table Editor**:

- `user_profiles` - Stores user information (email, name)
- `reading_progress` - Tracks individual book reading progress

### Step 3: Verify Functions Created

In the **Database Functions** section, you should see:

- `handle_new_user()` - Automatically creates user profile on signup
- `get_currently_reading_books()` - Gets user's currently reading books
- `update_reading_progress()` - Updates reading progress for a book
- `get_user_reading_stats()` - Gets user reading statistics

## 🔧 Features Included

### User Profile Management
- **Automatic Profile Creation**: When a user signs up, a profile is automatically created
- **User Information**: Stores email, name, and timestamps
- **Row Level Security**: Users can only access their own data

### Reading Progress Tracking
- **Book Progress**: Tracks current page, total pages, and progress percentage
- **Reading Time**: Records time spent reading each book
- **Last Read Position**: Stores specific reading position data
- **Completion Status**: Tracks if a book is completed
- **Timestamps**: Records when reading started, last read, and completed

### Data Retrieval
- **Currently Reading**: Get the 3 most recently read books (sorted by last_read_at DESC)
- **Reading Statistics**: Total books read, reading time, completion rates
- **Progress History**: Full reading history for a user

## 📊 Database Schema Details

### user_profiles Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, References auth.users)
- email (TEXT, Not Null)
- name (TEXT, Not Null)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### reading_progress Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, References auth.users)
- book_id (TEXT, Book identifier)
- book_name (TEXT, Book title)
- current_page (INTEGER, Current page number)
- total_pages (INTEGER, Total pages in book)
- progress_percentage (DECIMAL, 0.00 to 100.00)
- last_read_position (TEXT, JSON position data)
- started_at (TIMESTAMP, When reading started)
- last_read_at (TIMESTAMP, Last reading session)
- completed_at (TIMESTAMP, When book was completed)
- is_completed (BOOLEAN, Completion status)
- reading_time_minutes (INTEGER, Total reading time)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User Isolation**: Users can only access their own data
- **Automatic Triggers**: User profiles created automatically on signup
- **Secure Functions**: All database functions use SECURITY DEFINER

## 🚀 Usage in Your App

### 1. User Profile Creation
The user profile is automatically created when a user signs up for the first time. This happens in `components/app-wrapper.tsx`.

### 2. Reading Progress Tracking
Use the `useReadingProgress` hook to manage reading data:

```typescript
import { useReadingProgress } from '@/hooks/use-reading-progress';

const {
  currentlyReading,
  updateBookProgress,
  getBookProgressPercentage,
  isBookCurrentlyReading
} = useReadingProgress();
```

### 3. Update Progress
When a user reads a book, update the progress:

```typescript
await updateBookProgress(
  userId,
  bookId,
  bookName,
  currentPage,
  totalPages,
  lastReadPosition,
  readingTimeMinutes
);
```

### 4. Display Currently Reading
The `CurrentlyReadingSection` component displays the user's currently reading books with progress indicators.

## 🔍 Testing the Setup

1. **Sign up a new user** - Check that a profile is created in `user_profiles`
2. **Open a book** - Check that reading progress is recorded in `reading_progress`
3. **View the index page** - Verify that currently reading books appear in the "Continue Reading" section

## 📝 Notes

- The schema includes indexes for optimal performance
- All functions are optimized for common queries
- The system automatically handles book completion when progress reaches 100%
- Reading time is cumulative across all reading sessions

## 🛠️ Troubleshooting

### Common Issues

1. **Permission denied to set parameter "app.jwt_secret"**
   - This error is normal and can be ignored
   - The JWT secret is managed automatically by Supabase
   - Continue with the rest of the schema execution

2. **Profile not created on signup**
   - Check that the trigger is properly installed
   - Verify RLS policies are correct

3. **Reading progress not updating**
   - Ensure the user is authenticated
   - Check that the function parameters are correct

4. **Currently reading books not showing**
   - Verify the `get_currently_reading_books` function exists
   - Check that books have `is_completed = false`

### Debug Queries

```sql
-- Check if user profile exists
SELECT * FROM user_profiles WHERE user_id = 'your-user-id';

-- Check reading progress
SELECT * FROM reading_progress WHERE user_id = 'your-user-id';

-- Test currently reading function
SELECT * FROM get_currently_reading_books('your-user-id', 3);
```

## 📈 Performance Considerations

- Indexes are created for optimal query performance
- Functions use efficient SQL queries
- RLS policies are optimized for user-specific data access
- Consider adding more indexes if you have specific query patterns

---

**Next Steps**: After setting up the schema, your app will automatically track user reading progress and display it in the "Continue Reading" section on the index page!
