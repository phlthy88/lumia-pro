# Browser Compatibility Matrix

This document outlines the officially supported browsers and platforms for **Lumia Pro Lens**, along with known limitations.

## 🌍 Supported Platforms

| Browser | Minimum Version | Notes |
| :--- | :--- | :--- |
| **Chrome** | 120+ | Recommended for best performance. |
| **Edge** | 120+ | Fully supported (Chromium based). |
| **Firefox** | 121+ | Supported with limitations (see below). |
| **Safari (macOS)** | 17+ | Supported. |
| **Safari (iOS)** | 17+ | Supported with limitations. |

## ⚠️ Known Limitations

### iOS Safari
*   **No Virtual Camera Support:** The `getDisplayMedia` API and Canvas Capture stream handling are restricted by Apple on iOS. The "Virtual Camera" feature will be unavailable.
*   **Strict Autoplay Policies:** The `AudioContext` requires an explicit user gesture (e.g., a touch or click) before it can resume. Users may need to interact with the page before audio metering works.

### Firefox
*   **No WebMIDI Support:** Native MIDI support is currently hidden behind flags or missing in standard Firefox builds. MIDI controller features will not function.
*   **WebGL Performance:** Some users may experience reduced WebGL performance depending on their graphics driver and OS combination compared to Chromium browsers.

### Safari (Desktop)
*   **WebM Support:** The native `MediaRecorder` API in Safari has inconsistent support for `video/webm`. The application falls back to `video/mp4` where necessary, which may affect file sizes or transparency support.
