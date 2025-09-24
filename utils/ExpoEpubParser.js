import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';

class ExpoEpubParser {
  constructor() {
    this.tempDir = FileSystem.documentDirectory + 'epub_temp/';
  }

  // Generate cache key for a book
  getCacheKey(bookUrl) {
    return `epub_meta_${bookUrl.split('/').pop()}`;
  }

  // Get book cache directory
  getBookCacheDir(bookUrl) {
    const bookName = bookUrl.split('/').pop().replace('.epub', '');
    return FileSystem.documentDirectory + `epub_cache/${bookName}/`;
  }

  // Check if book is cached
  async isBookCached(bookUrl) {
    try {
      const cacheDir = this.getBookCacheDir(bookUrl);
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      return dirInfo.exists && dirInfo.isDirectory;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }

  // Get cached book metadata
  async getCachedBookMetadata(bookUrl) {
    try {
      const cacheKey = this.getCacheKey(bookUrl);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.error('Error getting cached book metadata:', error);
      return null;
    }
  }

  // Cache book metadata only (not the actual files)
  async cacheBookMetadata(bookUrl, metadata) {
    try {
      const cacheKey = this.getCacheKey(bookUrl);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error caching book metadata:', error);
    }
  }

  // Clear corrupted cache and force fresh download
  async clearCorruptedCache(bookUrl) {
    try {
      console.log('Clearing corrupted cache...');
      
      // Clear AsyncStorage metadata
      const cacheKey = this.getCacheKey(bookUrl);
      await AsyncStorage.removeItem(cacheKey);
      
      // Clear file system cache
      const cacheDir = this.getBookCacheDir(bookUrl);
      const cacheExists = await FileSystem.getInfoAsync(cacheDir);
      if (cacheExists.exists) {
        await FileSystem.deleteAsync(cacheDir);
        console.log('Cleared corrupted cache directory');
      }
      
      // Clear temp directory
      const tempExists = await FileSystem.getInfoAsync(this.tempDir);
      if (tempExists.exists) {
        await FileSystem.deleteAsync(this.tempDir);
        console.log('Cleared temp directory');
      }
      
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Clear all EPUB cache (for debugging)
  async clearAllCache() {
    try {
      console.log('Clearing all EPUB cache...');
      
      // Clear all AsyncStorage keys that start with epub_
      const keys = await AsyncStorage.getAllKeys();
      const epubKeys = keys.filter(key => key.startsWith('epub_'));
      if (epubKeys.length > 0) {
        await AsyncStorage.multiRemove(epubKeys);
        console.log('Cleared AsyncStorage cache keys:', epubKeys);
      }
      
      // Clear all epub cache directories
      const cacheBaseDir = FileSystem.documentDirectory + 'epub_cache/';
      const cacheExists = await FileSystem.getInfoAsync(cacheBaseDir);
      if (cacheExists.exists) {
        await FileSystem.deleteAsync(cacheBaseDir);
        console.log('Cleared all cache directories');
      }
      
      // Clear temp directory
      const tempExists = await FileSystem.getInfoAsync(this.tempDir);
      if (tempExists.exists) {
        await FileSystem.deleteAsync(this.tempDir);
        console.log('Cleared temp directory');
      }
      
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  // Simple XML parser for React Native
  parseXML(xmlString) {
    try {
      // Remove XML declaration and comments
      let cleanXML = xmlString.replace(/<\?xml[^>]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
      
      // Parse container.xml to get OPF path
      if (cleanXML.includes('container')) {
        const rootfileMatch = cleanXML.match(/<rootfile[^>]*full-path="([^"]*)"[^>]*>/);
        if (rootfileMatch) {
          return { container: { rootfiles: [{ rootfile: [{ '$': { 'full-path': rootfileMatch[1] } }] }] } };
        }
      }
      
      // Parse OPF file
      if (cleanXML.includes('package')) {
        const titleMatch = cleanXML.match(/<dc:title[^>]*>([^<]*)<\/dc:title>/);
        const creatorMatch = cleanXML.match(/<dc:creator[^>]*>([^<]*)<\/dc:creator>/);
        
        // Extract manifest items
        const manifestItems = [];
        const manifestRegex = /<item[^>]*id="([^"]*)"[^>]*href="([^"]*)"[^>]*\/>/g;
        let manifestMatch;
        while ((manifestMatch = manifestRegex.exec(cleanXML)) !== null) {
          manifestItems.push({
            '$': {
              id: manifestMatch[1],
              href: manifestMatch[2]
            }
          });
        }
        
        // Extract spine items
        const spineItems = [];
        const spineRegex = /<itemref[^>]*idref="([^"]*)"[^>]*\/>/g;
        let spineMatch;
        while ((spineMatch = spineRegex.exec(cleanXML)) !== null) {
          spineItems.push({
            '$': {
              idref: spineMatch[1]
            }
          });
        }
        
        return {
          package: {
            metadata: [{
              'dc:title': titleMatch ? [titleMatch[1]] : ['Unknown Title'],
              'dc:creator': creatorMatch ? [creatorMatch[1]] : ['Unknown Author']
            }],
            manifest: [{ item: manifestItems }],
            spine: [{ itemref: spineItems }]
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('XML parsing error:', error);
      return null;
    }
  }

  async extractEpub(epubUrl) {
    try {
      // Check if book is already cached
      const isCached = await this.isBookCached(epubUrl);
      if (isCached) {
        console.log('Using cached EPUB files');
        const cacheDir = this.getBookCacheDir(epubUrl);
        
        // Clean temp directory first
        try {
          await FileSystem.deleteAsync(this.tempDir);
        } catch (error) {
          // Ignore if directory doesn't exist
        }
        
        // Create temp directory
        await FileSystem.makeDirectoryAsync(this.tempDir, { intermediates: true });
        
        // Copy all files from cache to temp directory recursively
        await this.copyDirectory(cacheDir, this.tempDir);
        
        // Debug: List what was copied
        const tempFiles = await FileSystem.readDirectoryAsync(this.tempDir);
        console.log('Files in temp directory after copy:', tempFiles);
        
        // Verify that container.xml exists
        const containerPath = this.tempDir + 'META-INF/container.xml';
        const containerExists = await FileSystem.getInfoAsync(containerPath);
        console.log('Container.xml exists:', containerExists.exists);
        
        if (!containerExists.exists) {
          console.log('Cached EPUB is corrupted - container.xml not found');
          console.log('Clearing corrupted cache and forcing fresh download...');
          
          // Clear corrupted cache
          await this.clearCorruptedCache(epubUrl);
          
          // Force fresh download by falling through to the download section
          console.log('Proceeding with fresh download...');
        } else {
          return this.tempDir;
        }
      }

      // If not cached, download and extract
      console.log('Downloading and extracting EPUB...');
      
      // Create temp directory
      await FileSystem.makeDirectoryAsync(this.tempDir, { intermediates: true });
      
      // Download EPUB file directly from URL
      const downloadResult = await FileSystem.downloadAsync(epubUrl, this.tempDir + 'book.epub');
      
      if (downloadResult.status !== 200) {
        throw new Error('Failed to download EPUB file');
      }
      
      // Read the downloaded file as base64
      const epubBase64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Load ZIP with JSZip
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(epubBase64, { base64: true });
      
      // Extract all files
      const files = Object.keys(zipContent.files);
      
      for (const fileName of files) {
        const file = zipContent.files[fileName];
        if (!file.dir) {
          const content = await file.async('string');
          const filePath = this.tempDir + fileName;
          
          // Create directory if needed
          const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
          if (dirPath !== filePath) {
            await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
          }
          
          // Write file
          await FileSystem.writeAsStringAsync(filePath, content);
        }
      }
      
      // Cache the extracted files to permanent cache directory
      await this.cacheExtractedFiles(epubUrl);
      console.log('EPUB cached successfully');
      
      return this.tempDir;
    } catch (error) {
      console.error('Error extracting EPUB:', error);
      throw error;
    }
  }

  // Helper method to copy directory recursively
  async copyDirectory(sourceDir, destDir) {
    try {
      const files = await FileSystem.readDirectoryAsync(sourceDir);
      for (const fileName of files) {
        const sourcePath = sourceDir + fileName;
        const destPath = destDir + fileName;
        
        const fileInfo = await FileSystem.getInfoAsync(sourcePath);
        if (fileInfo.isDirectory) {
          await FileSystem.makeDirectoryAsync(destPath, { intermediates: true });
          await this.copyDirectory(sourcePath, destPath);
        } else {
          // Ensure destination directory exists
          const destDirPath = destPath.substring(0, destPath.lastIndexOf('/'));
          await FileSystem.makeDirectoryAsync(destDirPath, { intermediates: true });
          await FileSystem.copyAsync({ from: sourcePath, to: destPath });
        }
      }
    } catch (error) {
      console.error('Error copying directory:', error);
      throw error;
    }
  }

  // Cache extracted files to permanent cache directory
  async cacheExtractedFiles(epubUrl) {
    try {
      const cacheDir = this.getBookCacheDir(epubUrl);
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      
      // Copy all files from temp to cache directory
      const tempFiles = await FileSystem.readDirectoryAsync(this.tempDir);
      for (const fileName of tempFiles) {
        const sourcePath = this.tempDir + fileName;
        const destPath = cacheDir + fileName;
        
        const fileInfo = await FileSystem.getInfoAsync(sourcePath);
        if (fileInfo.isDirectory) {
          await FileSystem.makeDirectoryAsync(destPath, { intermediates: true });
          await this.copyDirectory(sourcePath, destPath);
        } else {
          await FileSystem.copyAsync({ from: sourcePath, to: destPath });
        }
      }
    } catch (error) {
      console.error('Error caching extracted files:', error);
    }
  }

  async parseContainer() {
    const containerPath = this.tempDir + 'META-INF/container.xml';
    const containerContent = await FileSystem.readAsStringAsync(containerPath);
    
    const result = this.parseXML(containerContent);
    if (result && result.container) {
      return result.container.rootfiles[0].rootfile[0]['$']['full-path'];
    }
    throw new Error('Failed to parse container.xml');
  }

  async parseOPF(opfPath, epubUrl = null) {
    const opfContent = await FileSystem.readAsStringAsync(this.tempDir + opfPath);
    
    const result = this.parseXML(opfContent);
    if (result && result.package) {
      const pkg = result.package;
      const manifest = pkg.manifest[0].item;
      const spine = pkg.spine[0].itemref;
      
      // Extract chapter order
      const chapters = spine.map(item => {
        const idref = item['$'].idref;
        const manifestItem = manifest.find(m => m['$'].id === idref);
        return manifestItem ? manifestItem['$'].href : null;
      }).filter(Boolean);
      
      const bookInfo = {
        title: pkg.metadata[0]['dc:title'] ? pkg.metadata[0]['dc:title'][0] : 'Unknown Title',
        author: pkg.metadata[0]['dc:creator'] ? pkg.metadata[0]['dc:creator'][0] : 'Unknown Author',
        chapters: chapters,
        basePath: opfPath.substring(0, opfPath.lastIndexOf('/') + 1)
      };

      // Cache book metadata if epubUrl is provided
      if (epubUrl) {
        await this.cacheBookMetadata(epubUrl, bookInfo);
      }

      return bookInfo;
    }
    throw new Error('Failed to parse OPF file');
  }

  async getChapterContent(chapterPath) {
    const fullPath = this.tempDir + chapterPath;
    return await FileSystem.readAsStringAsync(fullPath);
  }

  async cleanup() {
    try {
      await FileSystem.deleteAsync(this.tempDir);
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  }
}

export default ExpoEpubParser;
