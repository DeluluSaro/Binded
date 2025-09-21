# App Intro Video Feature

This app now includes an intro video feature that plays when the user first opens the app.

## Features

- **Touch to Start**: Users see a welcome screen and must tap anywhere to start the intro video
- **Aspect Ratio Conversion**: The 16:9 video is automatically converted to 9:16 format for mobile viewing
- **Smooth Transition**: After the video ends, users are automatically taken to the main app
- **Error Handling**: If the video fails to load, users are taken to the main app automatically

## Files Added/Modified

### New Components
- `components/intro-screen.tsx` - Main intro screen component with video playback
- `components/app-wrapper.tsx` - Wrapper component that manages intro state
- `scripts/convert-video.js` - Script with instructions for video conversion

### Modified Files
- `app/_layout.tsx` - Added AppWrapper to manage intro flow
- `package.json` - Added expo-av dependency for video playback

## Video Conversion (Optional)

The app is already configured to handle the 16:9 to 9:16 conversion using CSS styling. However, for optimal performance, you can convert the video using FFmpeg:

```bash
ffmpeg -i "public/Logo_Animation_With_Glitch_Effect.mp4" \
  -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black" \
  -c:v libx264 -c:a aac \
  "public/Logo_Animation_With_Glitch_Effect_9_16.mp4"
```

Then update the video source in `components/intro-screen.tsx` to use the converted file.

## How It Works

1. When the app starts, the `AppWrapper` component shows the intro screen
2. Users see a welcome message and must tap to start the video
3. The video plays in 9:16 format (cropped from 16:9)
4. After the video ends, users are taken to the main app
5. The intro only shows once per app session

## Customization

You can customize the intro screen by modifying:
- Welcome text in `components/intro-screen.tsx`
- Video source path
- Styling and colors
- Video playback behavior

## Dependencies

- `expo-av` - For video playback functionality
- `react-native` - Core React Native components
- `expo-router` - For navigation
