# Supabase Setup Guide

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk Configuration (if not already set)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Supabase Storage Setup - Step by Step

### Step 1: Delete the Old Bucket (if exists)
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/giozeuciyzsqzdnhejlp/storage/buckets
2. Find the "Books" bucket in the list
3. Click the **3 dots menu** (⋮) next to the bucket
4. Select **"Delete bucket"**
5. Confirm the deletion

### Step 2: Create a New Public Bucket
1. **Navigate to Storage**:
   - Go to your Supabase dashboard
   - Click **"Storage"** in the left sidebar
   - Click **"New bucket"** button

2. **Configure the Bucket**:
   - **Name**: `Books` (exactly this, case-sensitive)
   - **Public bucket**: ✅ **CHECK THIS BOX** (very important!)
   - **File size limit**: Leave default or set to 50MB
   - **Allowed MIME types**: Leave empty (allows all file types)
   - Click **"Create bucket"**

3. **Verify Bucket Settings**:
   - The bucket should show as **"Public"** in the bucket list
   - Click on the bucket name to enter it

### Step 3: Disable Row Level Security (RLS)
1. **Go to Storage Policies**:
   - While in the Books bucket, click **"Configuration"** tab
   - Click **"Policies"** in the left sidebar

2. **Disable RLS**:
   - Look for **"Disable RLS"** or **"Make bucket public"** option
   - Click it to disable Row Level Security
   - This allows anonymous access to list and download files

3. **Alternative: Create Public Policy** (if RLS can't be disabled):
   - Click **"New policy"**
   - Choose **"For full customization"**
   - Use this SQL:
   ```sql
   CREATE POLICY "Public Access" ON storage.objects
   FOR ALL USING (bucket_id = 'Books');
   ```

### Step 4: Upload Your Books
1. **Upload Files**:
   - Click **"Upload files"** button
   - Select your PDF/ebook files
   - Drag and drop or browse to select files
   - Wait for upload to complete

2. **Verify Upload**:
   - You should see your files listed in the bucket
   - Files should be accessible without authentication

### Step 5: Test the Setup
1. **Get Your Credentials**:
   - Go to **Settings** → **API**
   - Copy your **Project URL** and **anon public** key
   - Update your `.env` file with these values

2. **Test the App**:
   - Restart your development server: `npm start`
   - Check the console logs for successful book fetching
   - Your books should appear in the Popular Books section

## How it works

- The app fetches all files from the `Books` bucket in Supabase storage
- When a user taps on a book, it opens the book URL in the default app (PDF viewer, etc.)
- Books are displayed with a book icon placeholder and the filename as the title

## File Structure

```
lib/
  supabase.ts          # Supabase client and book fetching functions
app/(tabs)/
  index.tsx            # Updated to fetch and display books from Supabase
```

## Features Added

- ✅ Fetch books from Supabase storage
- ✅ Display books in Popular Books section
- ✅ Tap to open books functionality
- ✅ Loading states and error handling
- ✅ Empty state when no books are available
