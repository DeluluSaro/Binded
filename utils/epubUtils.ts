import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EpubChapter {
  id: string;
  title: string;
  content: string;
  index: number;
}

export interface EpubBookInfo {
  title: string;
  author: string;
  chapters: EpubChapter[];
  totalChapters: number;
}

export interface BookmarkData {
  wordIndex: number;
  chapterIndex: number;
  wordText: string;
  totalWords: number;
  position: {
    x: number;
    y: number;
    scrollY: number;
  };
  timestamp: string;
}

export class EpubUtils {
  static async saveReadingPosition(epubUrl: string, chapterIndex: number): Promise<void> {
    try {
      await AsyncStorage.setItem(`reading_position_${epubUrl}`, chapterIndex.toString());
      console.log(`📖 Reading position saved: chapter ${chapterIndex}`);
    } catch (error) {
      console.error('Error saving reading position:', error);
    }
  }

  static async loadReadingPosition(epubUrl: string): Promise<number | null> {
    try {
      const savedPosition = await AsyncStorage.getItem(`reading_position_${epubUrl}`);
      return savedPosition ? parseInt(savedPosition) : null;
    } catch (error) {
      console.error('Error loading reading position:', error);
      return null;
    }
  }

  static async saveFontSize(fontSize: number): Promise<void> {
    try {
      await AsyncStorage.setItem('epub_font_size', fontSize.toString());
      console.log(`📝 Font size saved: ${fontSize}px`);
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  }

  static async loadFontSize(): Promise<number> {
    try {
      const savedFontSize = await AsyncStorage.getItem('epub_font_size');
      return savedFontSize ? parseInt(savedFontSize) : 18; // Default font size
    } catch (error) {
      console.error('Error loading font size:', error);
      return 18;
    }
  }

  static generateChapterHTML(content: string, fontSize: number, bookmarkWordIndex: number = -1): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <meta charset="UTF-8">
          <style>
            html {
              height: 100%;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
            }
            body {
              font-family: Georgia, 'Times New Roman', serif;
              font-size: ${fontSize}px;
              line-height: 1.6;
              margin: 20px;
              padding: 20px;
              color: #2c3e50;
              background-color: #fff8f0;
              text-align: justify;
              user-select: none;
              -webkit-user-select: none;
              -webkit-touch-callout: none;
              min-height: 100vh;
            }
            p { 
              margin-bottom: 1.2em; 
              text-indent: 1.5em;
            }
            h1, h2, h3, h4, h5, h6 { 
              color: #34495e;
              margin-top: 2em;
              margin-bottom: 1em;
              text-align: left;
              line-height: 1.3;
            }
            h1 { font-size: 1.8em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.3em; }
            
            img { 
              max-width: 100%; 
              height: auto; 
              display: block;
              margin: 1em auto;
            }
            
            blockquote {
              border-left: 4px solid #bdc3c7;
              margin: 1.5em 0;
              padding-left: 1em;
              font-style: italic;
              color: #7f8c8d;
            }
            
            .chapter-title {
              font-size: 1.5em;
              font-weight: bold;
              margin-bottom: 1em;
              text-align: center;
              color: #2980b9;
            }
            
            body > *:first-child { margin-top: 0; }
            body > *:last-child { margin-bottom: 0; }
            
            .word-highlight {
              background-color: #ff9800;
              color: #000000;
              padding: 2px 4px;
              border-radius: 3px;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }

  static calculateProgress(currentChapter: number, totalChapters: number): number {
    if (totalChapters === 0) return 0;
    return Math.min(1, Math.max(0, currentChapter / (totalChapters - 1)));
  }

  static formatChapterTitle(chapterIndex: number, totalChapters: number): string {
    return `Chapter ${chapterIndex + 1} of ${totalChapters}`;
  }

  static validateChapterIndex(chapterIndex: number, totalChapters: number): boolean {
    return chapterIndex >= 0 && chapterIndex < totalChapters;
  }

  static getChapterRange(currentChapter: number, totalChapters: number, rangeSize: number = 5): number[] {
    const start = Math.max(0, currentChapter - Math.floor(rangeSize / 2));
    const end = Math.min(totalChapters, start + rangeSize);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
