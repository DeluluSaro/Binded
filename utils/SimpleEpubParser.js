import JSZip from 'jszip';

class SimpleEpubParser {
  constructor() {
    this.epubData = null;
  }

  // Getter for epubData to check if it's loaded
  get isLoaded() {
    return this.epubData !== null;
  }

  // Download and parse EPUB directly from URL
  async loadEpubFromUrl(epubUrl) {
    try {
      console.log('Loading EPUB directly from URL:', epubUrl);
      
      // Fetch the EPUB file
      const response = await fetch(epubUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch EPUB: ${response.status}`);
      }
      
      // Get the file as array buffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Load with JSZip
      const zip = new JSZip();
      this.epubData = await zip.loadAsync(arrayBuffer);
      
      console.log('EPUB loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading EPUB from URL:', error);
      throw error;
    }
  }

  // Parse container.xml to get OPF path
  async getOPFPath() {
    try {
      const containerFile = this.epubData.file('META-INF/container.xml');
      if (!containerFile) {
        throw new Error('container.xml not found');
      }
      
      const containerContent = await containerFile.async('string');
      
      // Simple regex to extract OPF path
      const opfMatch = containerContent.match(/<rootfile[^>]*full-path="([^"]*)"[^>]*>/);
      if (!opfMatch) {
        throw new Error('OPF path not found in container.xml');
      }
      
      return opfMatch[1];
    } catch (error) {
      console.error('Error parsing container.xml:', error);
      throw error;
    }
  }

  // Parse OPF file to get book metadata and chapters
  async getBookInfo() {
    try {
      const opfPath = await this.getOPFPath();
      const opfFile = this.epubData.file(opfPath);
      
      if (!opfFile) {
        throw new Error('OPF file not found');
      }
      
      const opfContent = await opfFile.async('string');
      
      // Extract title
      const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]*)<\/dc:title>/);
      const title = titleMatch ? titleMatch[1] : 'Unknown Title';
      
      // Extract author
      const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]*)<\/dc:creator>/);
      const author = authorMatch ? authorMatch[1] : 'Unknown Author';
      
      // Extract manifest items
      const manifestItems = {};
      const manifestRegex = /<item[^>]*id="([^"]*)"[^>]*href="([^"]*)"[^>]*\/>/g;
      let manifestMatch;
      while ((manifestMatch = manifestRegex.exec(opfContent)) !== null) {
        manifestItems[manifestMatch[1]] = manifestMatch[2];
      }
      
      // Extract spine (chapter order)
      const chapters = [];
      const spineRegex = /<itemref[^>]*idref="([^"]*)"[^>]*\/>/g;
      let spineMatch;
      while ((spineMatch = spineRegex.exec(opfContent)) !== null) {
        const idref = spineMatch[1];
        const href = manifestItems[idref];
        if (href) {
          chapters.push(href);
        }
      }
      
      // Get base path (directory of OPF file)
      const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
      
      return {
        title,
        author,
        chapters,
        basePath
      };
    } catch (error) {
      console.error('Error parsing OPF:', error);
      throw error;
    }
  }

  // Get chapter content directly from ZIP
  async getChapterContent(chapterPath) {
    try {
      if (!this.epubData) {
        throw new Error('EPUB data not loaded. Please load the EPUB first.');
      }
      
      const chapterFile = this.epubData.file(chapterPath);
      if (!chapterFile) {
        throw new Error(`Chapter file not found: ${chapterPath}`);
      }
      
      return await chapterFile.async('string');
    } catch (error) {
      console.error('Error reading chapter:', error);
      throw error;
    }
  }

  // Cleanup
  cleanup() {
    this.epubData = null;
  }
}

export default SimpleEpubParser;
