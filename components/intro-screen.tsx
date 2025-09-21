import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video>(null);

  const handleVideoError = (error: any) => {
    console.error('Video error:', error);
    setVideoError(true);
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setVideoLoaded(true);
    // Start playing immediately when loaded
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  };

  const handleVideoEnd = () => {
    console.log('Video ended, proceeding to main app');
    onComplete();
  };

  // Auto-start video loading immediately
  useEffect(() => {
    // Video will start playing when loaded via handleVideoLoad
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={require('@/public/log_video.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping={false}
          isMuted={true}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.didJustFinish) {
              handleVideoEnd();
            }
          }}
          onError={handleVideoError}
          onLoad={handleVideoLoad}
        />
        
        {/* Show logo while video is loading */}
        {!videoLoaded && !videoError && (
          <View style={styles.logoOverlay}>
            <Image 
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
        )}
        
        {videoError && (
          <View style={styles.errorOverlay}>
            <Image 
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <ThemedText type="subtitle" style={styles.tapText}>
              Proceeding to app...
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  touchArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  video: {
    width: screenWidth,
    height: screenHeight,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: screenWidth * 0.6,
    height: screenHeight * 0.4,
    maxWidth: 300,
    maxHeight: 200,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tapText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    marginTop: 20,
  },
});
