# Troubleshooting

## Camera Issues

### "Camera permission denied"
- Check browser permissions (click lock icon in address bar)
- Ensure no other app is using the camera
- Try refreshing the page

### "Camera not found"
- Verify camera is connected
- Check Device Manager (Windows) or System Preferences (Mac)
- Try a different USB port

### Camera shows black screen
- Some cameras need a moment to warm up
- Try switching resolution
- Check if camera works in other apps

## Performance Issues

### Low FPS / Stuttering
- Switch to "Low" quality mode in settings
- Disable beauty effects
- Close other browser tabs
- Check if hardware acceleration is enabled in browser

### High memory usage
- Enable "Low Memory Mode" in settings
- Reduce number of LUTs loaded
- Restart the app periodically during long sessions

### WebGL context lost
- Usually caused by GPU driver issues
- App will attempt auto-recovery
- If persistent, try updating GPU drivers

## Virtual Camera Issues

### Popup blocked
- Allow popups for this site in browser settings
- Look for popup blocker icon in address bar

### Virtual cam not showing in Zoom/Meet
- Use "Share Screen" > "Window" > Select Lumia Pro window
- This is window sharing, not a system virtual camera

### OBS integration
- Use "Window Capture" source
- Select the Lumia Pro virtual camera window

## Recording Issues

### Recording fails to start
- Check available disk space
- Try a lower bitrate setting
- Ensure microphone permissions if recording audio

### Recording file corrupted
- Don't close browser during recording
- Avoid switching tabs during long recordings
- Try shorter recording segments

## Getting Help

1. Check browser console for errors (F12 > Console)
2. Note your browser version and OS
3. Open an issue on GitHub with reproduction steps
