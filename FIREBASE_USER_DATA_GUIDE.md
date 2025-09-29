# Firebase User Data Management Guide

This guide explains how to use the comprehensive user data system that automatically creates and manages user data in Firebase when users sign up.

## Overview

The system automatically:
- ✅ Creates user data in Firebase when users sign up
- ✅ Tracks reading progress for each book
- ✅ Manages bookmarks persistently in the database
- ✅ Maintains continue reading list (top 3 books)
- ✅ Syncs data across devices and survives app reinstalls

## User Data Structure

```typescript
interface UserData {
  id: string;                    // Firebase document ID
  clerkId: string;               // Clerk user ID
  name: string;                  // User's name from Clerk
  email: string;                 // User's email from Clerk
  profileImage?: string;         // User's profile image URL
  currentBooks: string[];        // Array of book IDs currently reading
  continueReading: ContinueReadingBook[]; // Top 3 books sorted by last read
  readingProgress: { [bookId: string]: ReadingProgress }; // Progress for each book
  bookmarks: { [bookId: string]: Bookmark[] }; // Bookmarks for each book
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Services

### 1. UserService (`services/userService.ts`)

Main service for managing user data in Firebase.

```typescript
import { userService } from '../services/userService';

// Create or update user (called automatically on sign up)
const userId = await userService.createOrUpdateUser(clerkUser);

// Get user data
const user = await userService.getUser(userId);

// Add book to current reading
await userService.addToCurrentBooks(userId, bookId, {
  title: 'Book Title',
  author: 'Author Name',
  cover: 'cover-url',
  totalPages: 200
});

// Update reading progress
await userService.updateReadingProgress(userId, bookId, {
  currentPage: 50,
  totalPages: 200,
  currentChapter: 'Chapter 3',
  readingTime: 30
});
```

### 2. BookmarkService (`services/bookmarkService.ts`)

Manages bookmarks persistently in Firebase.

```typescript
import { bookmarkService } from '../services/bookmarkService';

// Initialize with user ID
bookmarkService.setUserId(userId);

// Add bookmark
const bookmarkId = await bookmarkService.addBookmark({
  bookId: 'book-123',
  chapter: 'Chapter 1',
  page: 25,
  word: 'important concept',
  note: 'This is important'
});

// Get bookmarks for a book
const bookmarks = await bookmarkService.getBookmarks('book-123');

// Remove bookmark
await bookmarkService.removeBookmark('book-123', bookmarkId);

// Search bookmarks
const searchResults = await bookmarkService.searchBookmarks('important');
```

### 3. ReadingProgressService (`services/readingProgressService.ts`)

Tracks reading progress and continue reading.

```typescript
import { readingProgressService } from '../services/readingProgressService';

// Initialize with user ID
readingProgressService.setUserId(userId);

// Start reading a book
await readingProgressService.startReading({
  bookId: 'book-123',
  title: 'Book Title',
  author: 'Author Name',
  cover: 'cover-url',
  totalPages: 200
});

// Update progress
await readingProgressService.updateProgress('book-123', {
  currentPage: 50,
  totalPages: 200,
  currentChapter: 'Chapter 3',
  readingTime: 30
});

// Get continue reading (top 3 books)
const continueReading = await readingProgressService.getContinueReading();

// Get reading statistics
const stats = await readingProgressService.getReadingStats();
```

## Automatic User Creation

The system automatically creates user data when users sign up through the `UserSync` component:

```typescript
// In your AuthGuard component
import UserSync from './user-sync';

export const AuthGuard = ({ children }) => {
  // ... authentication checks ...
  
  return (
    <UserSync>
      {children}
    </UserSync>
  );
};
```

## Integration Examples

### 1. Basic Usage in Components

```typescript
import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { userService } from '../services/userService';
import { bookmarkService } from '../services/bookmarkService';
import { readingProgressService } from '../services/readingProgressService';

export const MyComponent = () => {
  const { user: clerkUser } = useUser();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (clerkUser) {
      loadUserData();
    }
  }, [clerkUser]);

  const loadUserData = async () => {
    const user = await userService.getUserByClerkId(clerkUser.id);
    setUserData(user);
  };

  const addBookmark = async () => {
    if (!userData) return;
    
    bookmarkService.setUserId(userData.id);
    await bookmarkService.addBookmark({
      bookId: 'current-book',
      chapter: 'Chapter 1',
      page: 25,
      note: 'Important note'
    });
  };

  return (
    <View>
      <Text>User: {userData?.name}</Text>
      <TouchableOpacity onPress={addBookmark}>
        <Text>Add Bookmark</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2. Reading Progress Tracking

```typescript
// When user opens a book
const startReading = async (bookData) => {
  if (!userData) return;
  
  readingProgressService.setUserId(userData.id);
  await readingProgressService.startReading(bookData);
};

// When user changes page
const updatePage = async (bookId, currentPage, totalPages) => {
  if (!userData) return;
  
  readingProgressService.setUserId(userData.id);
  await readingProgressService.updateProgress(bookId, {
    currentPage,
    totalPages,
    currentChapter: getCurrentChapter(currentPage),
    readingTime: getReadingTime()
  });
};

// When user closes book
const saveProgress = async (bookId) => {
  if (!userData) return;
  
  readingProgressService.setUserId(userData.id);
  await readingProgressService.resumeReading(bookId);
};
```

### 3. Bookmark Management

```typescript
// Add bookmark when user bookmarks a word
const addBookmark = async (bookId, chapter, page, word, note) => {
  if (!userData) return;
  
  bookmarkService.setUserId(userData.id);
  const bookmarkId = await bookmarkService.addBookmark({
    bookId,
    chapter,
    page,
    word,
    note
  });
  
  console.log('Bookmark added:', bookmarkId);
};

// Load bookmarks when opening a book
const loadBookmarks = async (bookId) => {
  if (!userData) return;
  
  bookmarkService.setUserId(userData.id);
  const bookmarks = await bookmarkService.getBookmarks(bookId);
  
  return bookmarks;
};
```

## Data Persistence

### Bookmarks
- ✅ Stored in Firebase, not just cache
- ✅ Survives app reinstalls
- ✅ Syncs across devices
- ✅ Searchable and filterable

### Reading Progress
- ✅ Tracks current page for each book
- ✅ Maintains reading time
- ✅ Saves chapter information
- ✅ Calculates progress percentage

### Continue Reading
- ✅ Automatically sorted by last read time
- ✅ Shows top 3 books
- ✅ Updates when user reads

## Migration from Cache

If you have existing bookmarks or progress in cache, you can migrate them:

```typescript
// Migrate bookmarks from cache
const migrateBookmarks = async (cachedBookmarks, bookId) => {
  if (!userData) return;
  
  bookmarkService.setUserId(userData.id);
  await bookmarkService.syncBookmarksFromCache(cachedBookmarks, bookId);
};

// Migrate reading progress from cache
const migrateProgress = async (cachedProgress, bookId) => {
  if (!userData) return;
  
  readingProgressService.setUserId(userData.id);
  await readingProgressService.syncProgressFromCache(cachedProgress, bookId);
};
```

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  await bookmarkService.addBookmark(bookmarkData);
  console.log('✅ Bookmark added successfully');
} catch (error) {
  console.error('❌ Error adding bookmark:', error);
  // Handle error (show alert, retry, etc.)
}
```

## Best Practices

### 1. Initialize Services
Always set the user ID before using services:

```typescript
// Set user ID once when component mounts
useEffect(() => {
  if (userData) {
    bookmarkService.setUserId(userData.id);
    readingProgressService.setUserId(userData.id);
  }
}, [userData]);
```

### 2. Handle Loading States
Show loading indicators while syncing data:

```typescript
const [loading, setLoading] = useState(false);

const addBookmark = async () => {
  setLoading(true);
  try {
    await bookmarkService.addBookmark(bookmarkData);
  } finally {
    setLoading(false);
  }
};
```

### 3. Sync Data Regularly
Update data when user makes changes:

```typescript
const updateProgress = async (newPage) => {
  await readingProgressService.updateProgress(bookId, {
    currentPage: newPage,
    totalPages: totalPages,
    currentChapter: getCurrentChapter(newPage)
  });
  
  // Reload user data to get updated continue reading
  loadUserData();
};
```

## Testing

Use the `UserDataExample` component to test all functionality:

```typescript
import UserDataExample from '../components/user-data-example';

// Add to your app for testing
<UserDataExample />
```

## Security

- ✅ User data is protected by Firestore security rules
- ✅ Users can only access their own data
- ✅ All operations require authentication
- ✅ Data is validated before saving

## Performance

- ✅ Efficient queries with proper indexing
- ✅ Minimal data transfer with targeted updates
- ✅ Caching for frequently accessed data
- ✅ Batch operations for multiple updates

This system ensures that user data is always available, even after app reinstalls, and provides a seamless reading experience across all devices.
