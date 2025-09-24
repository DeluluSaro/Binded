import { ResizeMode, Video } from 'expo-av';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const videoRef = useRef<Video>(null);

  const handleVideoError = (error: any) => {
    console.error('Video error:', error);
    setVideoError(true);
    setIsVideoLoading(false);
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setIsVideoLoading(false);
    // Don't start playing immediately - wait for logo timer
  };

  const handleVideoEnd = () => {
    console.log('Video ended, proceeding to main app');
    onComplete();
  };

  // Show logo for 1.3 seconds, then start video
  useEffect(() => {
    const logoTimer = setTimeout(() => {
      setShowLogo(false);
      // Start playing video after logo is hidden
      if (videoRef.current) {
        videoRef.current.playAsync();
      }
    }, 1300);

    return () => clearTimeout(logoTimer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={require('@/public/log1.mp4')}
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
        
        {/* Show logo for 1.3 seconds */}
        {showLogo && (
          <View style={styles.logoOverlay}>
            <ExpoImage
              source={require('@/public/logo.svg')}
              style={styles.loadingLogo}
              contentFit="contain"
            />
          </View>
        )}
        
        {videoError && (
          <View style={styles.errorOverlay}>
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
    backgroundColor: '#f9f5e9',
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
    right: 0,
    bottom: 0,
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f5e9',
  },
  loadingLogo: {
    width: 400,
    height: 400,
  },
  logo: {
    width: 500,
    height: 500,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f5e9',
  },
  tapText: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
    color: '#333',
    marginTop: 20,
  },
});
