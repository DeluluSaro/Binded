export declare class BookmarkManager {
  static STORAGE_PREFIX: string;
  static BOOK_LIST_KEY: string;
  
  static saveBookmark(bookTitle: string, chapterIndex: number, bookmarkData: any): Promise<boolean>;
  static loadBookmark(bookTitle: string, chapterIndex: number): Promise<any>;
  static getBookBookmarks(bookTitle: string): Promise<any[]>;
  static updateBookmarkList(bookKey: string, chapterIndex: number, bookmarkData: any): Promise<void>;
  static updateGlobalBookList(bookKey: string, bookTitle: string): Promise<void>;
  static getAllBookmarkedBooks(): Promise<any[]>;
  static removeBookmark(bookTitle: string, chapterIndex: number): Promise<boolean>;
  static removeFromGlobalBookList(bookKey: string): Promise<void>;
  static generateBookKey(bookTitle: string): string;
  static clearAllBookmarks(): Promise<boolean>;
  static getBookmarkStats(bookTitle: string): Promise<any>;
}
