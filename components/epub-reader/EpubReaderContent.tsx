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
  return (
    <View style={styles.contentContainer}>
      <WebView
        ref={webViewRef}
        source={{ html: chapterContent }}
        style={styles.webView}
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
          <View style={styles.webViewLoading}>
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
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
