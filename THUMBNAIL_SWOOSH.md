# Thumbnail Swoosh Animation

## Overview
Added a visual feedback animation that shows a thumbnail preview swooshing from the capture button towards the media library when a photo is taken or video is recorded.

## Implementation

### New Component: `ThumbnailSwoosh.tsx`
- Displays a small thumbnail (80x80px) that animates from the bottom center towards the top right
- Uses MUI keyframes for smooth cubic-bezier easing
- Animation duration: 600ms
- Automatically cleans up after animation completes

### Changes to `App.tsx`
1. Added `swooshThumbnail` state to track the current thumbnail URL
2. Modified `handleSnapshot` to trigger swoosh animation when photo is taken
3. Added `useEffect` to watch `mediaItems` array and trigger swoosh when new video is recorded
4. Rendered `ThumbnailSwoosh` component alongside existing `CaptureAnimation`

## Animation Details
- **Start position**: Bottom center of viewport (bottom: 100px)
- **End position**: Top right (towards media library icon)
- **Transform**: Scales from 1.0 to 0.3 while moving
- **Opacity**: Fades from 1 to 0
- **Easing**: cubic-bezier(0.4, 0.0, 0.2, 1) - Material Design emphasized decelerate
- **Z-index**: 9999 to appear above all other UI elements

## User Experience
- Provides immediate visual feedback that media was captured
- Helps users understand where captured media is stored
- Non-intrusive animation that doesn't block interaction
- Works for both photos and videos

## Technical Notes
- Uses `prevMediaCountRef` to detect when new media items are added
- Only triggers swoosh for video type (photos trigger via `handleSnapshot`)
- Thumbnail uses the actual captured image/video URL for accurate preview
- Animation is pointer-events: none to avoid blocking clicks
