<div align="center">

<img src="newlogo.png" alt="Lumia Pro Lens" width="120" />

# Lumia Pro Lens

### Transform your webcam into a professional broadcast studio

**Real-time color grading • AI scene analysis • Virtual camera output**

<br />

[![Live Demo](https://img.shields.io/badge/Try_It_Live-6750A4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://phlthy88.github.io/lumia-pro)
[![MIT License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

<br />

<img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Lumia Pro Screenshot" width="100%" />

</div>

<br />

## Why Lumia Pro?

Most webcam software gives you basic filters. Lumia Pro gives you a **full color grading suite** with the same tools used in Hollywood post-production—running entirely in your browser.

| Feature | Lumia Pro | Basic Webcam Apps |
|---------|-----------|-------------------|
| Professional LUTs | ✅ 70+ cinematic looks | ❌ Basic filters |
| Real-time GPU rendering | ✅ WebGL 2.0 | ❌ CPU-based |
| AI scene optimization | ✅ Gemini-powered | ❌ None |
| Virtual camera output | ✅ Works with Zoom, OBS | ❌ Limited |
| MIDI controller support | ✅ Full mapping | ❌ None |
| Offline PWA | ✅ Install & use anywhere | ❌ Online only |

<br />

## ⚡ Quick Start

```bash
git clone https://github.com/phlthy88/lumia-pro.git
cd lumia-pro
npm install
npm run dev
```

Open **http://localhost:5173** → Allow camera → Start creating.

<br />

## 🎨 Features

<table>
<tr>
<td width="50%">

### Color Grading
- **70+ Professional LUTs** — Film stocks, cinematic looks, log conversions
- Lift / Gamma / Gain color wheels
- Exposure, contrast, saturation, temperature
- Real-time GPU-accelerated processing

</td>
<td width="50%">

### AI Assistant
- One-click scene analysis
- Auto white balance correction
- Face detection & beauty smoothing
- Intelligent exposure suggestions

</td>
</tr>
<tr>
<td width="50%">

### Studio Tools
- Focus peaking & zebra overlays
- Rule-of-thirds grid
- Audio level meters
- Recording with media library

</td>
<td width="50%">

### Connectivity
- Virtual camera for Zoom, Meet, OBS
- MIDI controller mapping
- Keyboard shortcuts
- Mobile gyroscope support

</td>
</tr>
</table>

<br />

## 🎬 LUT Library

<table>
<tr>
<td align="center"><strong>Film Emulation</strong><br/><sub>Kodak Portra • Fuji Provia • Polaroid</sub></td>
<td align="center"><strong>Creative Looks</strong><br/><sub>Teal & Orange • Matrix • Stranger Things</sub></td>
<td align="center"><strong>Log Conversion</strong><br/><sub>S-Log3 • C-Log • V-Log • ARRI LogC</sub></td>
<td align="center"><strong>Black & White</strong><br/><sub>Tri-X 400 • HP5 Plus • Classic Noir</sub></td>
</tr>
</table>

<br />

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start/Stop recording |
| `C` | Capture photo |
| `L` | Toggle LUT panel |
| `F` | Fullscreen |
| `B` | Bypass processing |

<br />

## 🛠 Tech Stack

```
React 18        →  UI Framework
TypeScript      →  Type Safety
WebGL 2.0       →  GPU Rendering
MediaPipe       →  Face Detection
Material UI 3   →  Design System
Vite            →  Build Tool
```

<br />

## 📁 Project Structure

```
src/
├── components/    UI components & layouts
├── engine/        WebGL renderer & shaders
├── hooks/         Camera, recording, AI hooks
├── services/      LUT loading, AI analysis
└── theme/         Material Design 3 theming

public/
├── luts/          70+ .cube LUT files
├── models/        MediaPipe face model
└── wasm/          Vision WASM binaries
```

<br />

## 🤝 Contributing

Contributions welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest features  
- 🎨 Submit custom LUTs
- 🔧 Open pull requests

<br />

## 📄 License

MIT License — use freely for personal or commercial projects.

<br />

<div align="center">

---

**Built with ❤️ using React, WebGL & AI**

[⬆ Back to top](#lumia-pro-lens)

</div>
