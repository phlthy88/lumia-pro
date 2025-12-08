<div align="center">
<img width="1200" height="475" alt="Lumia Studio Pro Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🎥 Lumia Studio Pro

**Professional-grade camera studio in your browser**

Transform your webcam into a cinematic powerhouse with real-time color grading, AI-powered enhancements, and studio-quality effects.

[![Live Demo](https://img.shields.io/badge/🚀-Live_Demo-blue?style=for-the-badge)](https://ai.studio/apps/drive/10JkiP_8H6pyn5vaxgZmyOlv5bTtvAXfV)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Usage](#-usage) • [Tech Stack](#-tech-stack)

</div>

---

## ✨ Features

### 🎨 **Cinematic Color Grading**
- **70+ Professional LUTs** - Film emulation, creative looks, and log conversion
- Real-time GPU-accelerated processing
- Custom LUT import support
- Presets: Film Noir, Vintage, Cyberpunk, and more

### 🤖 **AI-Powered Intelligence**
- Smart scene analysis and optimization
- Automatic lighting adjustments
- Face detection and tracking
- Intelligent framing suggestions

### 🎬 **Studio Controls**
- Professional color correction (exposure, contrast, saturation, temperature)
- Real-time effects and filters
- Customizable overlays and graphics
- Audio level monitoring with visual feedback

### 🎮 **Hardware Integration**
- MIDI controller support for hands-free operation
- Keyboard shortcuts for quick access
- Gyroscope support for mobile devices
- Virtual camera output for streaming

### 📱 **Platform Optimizations**
- YouTube, Twitch, TikTok, Instagram presets
- Optimal encoding settings per platform
- Aspect ratio and resolution presets
- One-click platform-specific enhancements

### 🎯 **Professional Recording**
- High-quality video capture
- Audio synchronization
- Media library with thumbnail previews
- Export in multiple formats

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Modern browser (Chrome, Edge, or Firefox recommended)
- Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

```bash
# Clone the repository
git clone https://github.com/phlthy88/lumia-pro.git
cd lumia-pro

# Install dependencies
npm install

# Configure your API key
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# Start the development server
npm run dev
```

Visit `http://localhost:5173` and grant camera permissions to start creating!

---

## 🎯 Usage

### Basic Workflow
1. **Launch** - Open the app and allow camera access
2. **Select LUT** - Choose from 70+ professional color grades
3. **Adjust** - Fine-tune exposure, contrast, and color temperature
4. **Enhance** - Enable AI analysis for smart optimizations
5. **Record** - Capture your masterpiece or stream live

### Keyboard Shortcuts
- `Space` - Start/Stop recording
- `C` - Capture photo
- `L` - Toggle LUT panel
- `A` - Toggle AI analysis
- `F` - Toggle fullscreen

### MIDI Control
Connect any MIDI controller for tactile control over:
- Color grading parameters
- LUT selection
- Recording controls
- Effect toggles

---

## 🛠 Tech Stack

- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **WebGL** - GPU-accelerated rendering
- **Material Design 3** - Beautiful, accessible UI
- **Gemini AI** - Intelligent scene analysis
- **MediaRecorder API** - High-quality capture
- **Web MIDI API** - Hardware integration
- **Vite** - Lightning-fast build tool

---

## 📦 Project Structure

```
lumia-pro/
├── src/
│   ├── components/     # React components
│   ├── engine/         # WebGL rendering engine
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Business logic
│   └── theme/          # Material Design 3 theming
├── public/
│   ├── luts/           # Color grading LUTs
│   └── models/         # AI models
└── package.json
```

---

## 🎨 LUT Categories

- **Film Emulation** - Kodak Portra, Fuji Provia, Polaroid, and more
- **Creative Looks** - Cinematic styles inspired by iconic films
- **Log Conversion** - Sony S-Log, Canon C-Log, RED, Blackmagic
- **Black & White** - Classic monochrome film stocks

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Share your custom LUTs

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🙏 Acknowledgments

- LUT collection curated from professional color grading resources
- Built with [Google AI Studio](https://ai.studio)
- Powered by Gemini AI

---

<div align="center">

**Made with ❤️ by [phlthy88](https://github.com/phlthy88)**

⭐ Star this repo if you find it useful!

</div>
