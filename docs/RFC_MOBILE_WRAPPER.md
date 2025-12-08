# RFC: Mobile Wrapper Strategy (React Native / Expo)

## 1. Executive Summary
This RFC proposes a strategy to port **Lumia Pro Lens** to mobile platforms (iOS/Android) by wrapping the existing React application in a **React Native (Expo)** shell. This "Hybrid App" approach leverages our existing WebGL/React logic for the core camera experience while using Native Modules for hardware access where the browser sandbox is too restrictive.

## 2. Architecture

### Core Rendering: `react-native-webview`
*   **Strategy:** The heavy lifting (React UI, MediaPipe processing, WebGL rendering) will remain in the web view.
*   **Justification:** Rewriting the complex shader pipeline and MediaPipe integration in native code is prohibitive. The web view allows us to reuse 95% of the codebase.

### Native Bridge
We will use Expo's native modules to inject capabilities into the WebView or handle them natively and pass data via the bridge.

| Feature | Web Limitation | Native Solution |
| :--- | :--- | :--- |
| **Video Source** | Mobile Safari/Chrome often throttles camera access or UI overlay performance. | **`expo-camera`**: Capture the stream natively and inject it (or render natively and overlay the WebView). *Note: Investigating passing texture pointers vs. stream injection.* |
| **Microphone** | Audio Context auto-play restrictions; limited level access. | **`expo-av`**: Reliable access to microphone audio levels for the UI meters. |
| **Sensors** | Device orientation/motion permissions are flaky on web. | **`expo-sensors`**: High-frequency Gyroscope/Accelerometer data for the "Virtual Gimbal" and Horizon Level features. |
| **File System** | "Download" saves to Files app, not Photos/Gallery. | **`expo-file-system` & `expo-media-library`**: Save recorded videos and snapshots directly to the user's Gallery. |
| **Power Mgmt** | Screen dims/sleeps during recording. | **`expo-keep-awake`**: Prevent screen lock during active sessions. |

## 3. Implementation Plan (Draft)

1.  **Initialize Expo Project:** Create a new repo `lumia-mobile`.
2.  **WebView Setup:** Point `react-native-webview` to the local bundled assets or hosted URL.
3.  **Bridge Implementation:**
    *   Create a message passing protocol (JSON-RPC style) between React (Web) and React Native.
    *   *Example:* Web sends `{ type: 'SAVE_VIDEO', payload: base64Data }` -> Native handles saving.
4.  **Native Module Integration:**
    *   Hook up `expo-sensors` and stream data into the WebView via `injectedJavaScript` to update the horizon level in real-time.

## 4. Risk Assessment
*   **Performance:** Passing high-res video frames or textures between Native and WebView is the biggest bottleneck.
*   **Mitigation:** If WebView performance is poor, we may need to implement the camera viewfinder in Native (`expo-camera`) and only use the WebView for the UI controls overlay (H264 recording would then happen natively).
