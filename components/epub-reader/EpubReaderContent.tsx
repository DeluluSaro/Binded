import { useThemeColors } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import InPageLoader from '../in-page-loader';
import { ThemedText } from '../themed-text';

interface EpubReaderContentProps {
  webViewRef: React.RefObject<WebView>;
  chapterContent: string;
  contentLoading: boolean;
  onMessage: (event: any) => void;
}

export const EpubReaderContent: React.FC<EpubReaderContentProps> = ({
  webViewRef,
  chapterContent,
  contentLoading,
  onMessage
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.contentContainer, { backgroundColor: '#b7aa99' }]}>
      <WebView
        key={chapterContent} // Force re-render when content changes
        ref={webViewRef}
        source={{ html: chapterContent }}
        style={[styles.webView, { backgroundColor: '#b7aa99' }]}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scalesPageToFit={false}
        startInLoadingState={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={onMessage}
        renderLoading={() => (
          <View style={[styles.webViewLoading, { backgroundColor: '#b7aa99' }]}>
            <ThemedText>Loading chapter...</ThemedText>
          </View>
        )}
      />
      
      {/* In-page loader for content loading */}
      {contentLoading && (
        <InPageLoader message="Loading page..." />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    position: 'relative',
    paddingTop: 100, // Add space for the header
    paddingBottom: 120, // Add space for the footer
    paddingHorizontal: 24, // Match the image padding
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
