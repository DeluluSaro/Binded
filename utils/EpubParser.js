import * as FileSystem from 'expo-file-system';

class EpubParser {
  constructor() {
    this.tempDir = FileSystem.documentDirectory + 'epub_temp/';
  }

  // Simple XML parser for EPUB files
  parseXML(xmlString) {
    // Remove XML declaration and comments
    xmlString = xmlString.replace(/<\?xml[^>]*\?>/g, '');
    xmlString = xmlString.replace(/<!--[\s\S]*?-->/g, '');
    
    // Simple regex-based parsing
    const parseElement = (xml) => {
      const result = {};
      const tagRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g;
      let match;
      
      while ((match = tagRegex.exec(xml)) !== null) {
        const tagName = match[1];
        const attributes = match[2];
        const content = match[3].trim();
        
        // Parse attributes
        const attrs = {};
        const attrRegex = /(\w+)="([^"]*)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
          attrs[attrMatch[1]] = attrMatch[2];
        }
        
        // Parse content
        if (content.includes('<')) {
          result[tagName] = parseElement(content);
        } else {
          result[tagName] = content;
        }
        
        // Add attributes
        if (Object.keys(attrs).length > 0) {
          result[tagName + '_attrs'] = attrs;
        }
      }
      
      return result;
    };
    
    return parseElement(xmlString);
  }

  async extractEpub(epubPath) {
    try {
      // Create temp directory
      await FileSystem.makeDirectoryAsync(this.tempDir, { intermediates: true });
      
      // For now, we'll create a simplified version that works with direct file access
      // EPUB extraction would require a ZIP library, but we'll handle this differently
      console.log('EPUB extraction not fully implemented yet - using direct file access');
      
      return this.tempDir;
    } catch (error) {
      console.error('Error extracting EPUB:', error);
      throw error;
    }
  }

  async parseContainer() {
    try {
      const containerPath = this.tempDir + 'META-INF/container.xml';
      const containerContent = await FileSystem.readAsStringAsync(containerPath);
      
      const parsed = this.parseXML(containerContent);
      const rootfilePath = parsed.container.rootfiles.rootfile.full_path;
      
      return rootfilePath;
    } catch (error) {
      console.error('Error parsing container:', error);
      throw error;
    }
  }

  async parseOPF(opfPath) {
    try {
      const opfContent = await FileSystem.readAsStringAsync(this.tempDir + opfPath);
      const parsed = this.parseXML(opfContent);
      
      // Extract metadata
      const metadata = parsed.package.metadata;
      const title = metadata['dc:title'] || 'Unknown Title';
      const author = metadata['dc:creator'] || 'Unknown Author';
      
      // Extract manifest items
      const manifest = parsed.package.manifest.item;
      const manifestItems = Array.isArray(manifest) ? manifest : [manifest];
      
      // Extract spine (reading order)
      const spine = parsed.package.spine.itemref;
      const spineItems = Array.isArray(spine) ? spine : [spine];
      
      // Map spine items to manifest items
      const chapters = spineItems.map(item => {
        const idref = item.idref;
        const manifestItem = manifestItems.find(m => m.id === idref);
        return manifestItem ? manifestItem.href : null;
      }).filter(Boolean);
      
      return {
        title: title,
        author: author,
        chapters: chapters,
        basePath: opfPath.substring(0, opfPath.lastIndexOf('/') + 1)
      };
    } catch (error) {
      console.error('Error parsing OPF:', error);
      throw error;
    }
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

export default EpubParser;
