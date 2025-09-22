import { ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
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
        {isVideoLoading && (
          <View style={styles.logoOverlay}>
            <Image
              source={require('@/public/logo.png')}
              style={styles.logo}
              resizeMode="contain"
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
    backgroundColor: '#fff',
  },
  logo: {
    width: 400,
    height: 400,
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
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
    color: '#333',
    marginTop: 20,
  },
});
