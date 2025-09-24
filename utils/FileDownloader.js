import * as FileSystem from 'expo-file-system';

class FileDownloader {
  constructor() {
    this.downloadsDir = FileSystem.documentDirectory + 'downloads/';
  }

  async ensureDownloadsDir() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.downloadsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.downloadsDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Error creating downloads directory:', error);
      throw error;
    }
  }

  async downloadFile(url, filename) {
    try {
      await this.ensureDownloadsDir();
      
      const localPath = this.downloadsDir + filename;
      
      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log('File already exists:', localPath);
        return localPath;
      }

      console.log('Downloading file from:', url);
      console.log('Saving to:', localPath);

      const downloadResult = await FileSystem.downloadAsync(url, localPath);

      if (downloadResult.status === 200) {
        console.log('File downloaded successfully:', localPath);
        return localPath;
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async getLocalFilePath(url, filename) {
    try {
      await this.ensureDownloadsDir();
      const localPath = this.downloadsDir + filename;
      
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        return localPath;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking local file:', error);
      return null;
    }
  }

  async cleanupOldFiles() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.downloadsDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const filename of files) {
        const filePath = this.downloadsDir + filename;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.isDirectory === false) {
          const fileAge = now - fileInfo.modificationTime * 1000;
          if (fileAge > maxAge) {
            await FileSystem.deleteAsync(filePath);
            console.log('Cleaned up old file:', filename);
          }
        }
      }
    } catch (error) {
      console.log('Error cleaning up files:', error);
    }
  }
}

export default FileDownloader;
