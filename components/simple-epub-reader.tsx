import React from 'react';
import { StyleSheet } from 'react-native';
import EpubReaderMain from './epub-reader/EpubReaderMain';
import { ThemedView } from './themed-view';

interface SimpleEpubReaderProps {
  epubUrl: string;
  onClose: () => void;
}

const SimpleEpubReader: React.FC<SimpleEpubReaderProps> = ({ epubUrl, onClose }) => {
  return (
    <ThemedView style={styles.container}>
      <EpubReaderMain epubUrl={epubUrl} onClose={onClose} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    },
  });

export default SimpleEpubReader;