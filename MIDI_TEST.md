# MIDI Integration Test Guide

## Testing MIDI Controls

### Prerequisites
- Chrome/Edge browser (Web MIDI API support)
- MIDI controller (hardware or virtual)
- LumiaFix running locally

### Virtual MIDI Setup (No Hardware Required)

#### macOS
```bash
# Use built-in IAC Driver
# 1. Open Audio MIDI Setup
# 2. Window > Show MIDI Studio
# 3. Double-click "IAC Driver"
# 4. Check "Device is online"
```

#### Windows
```bash
# Install loopMIDI (free)
# Download: https://www.tobias-erichsen.de/software/loopmidi.html
```

#### Linux
```bash
sudo modprobe snd-virmidi
```

### Testing with Virtual Controller

1. **Install MIDI Monitor** (to verify messages)
   - macOS: MIDI Monitor app
   - Windows: MIDI-OX
   - Linux: `aseqdump -p <port>`

2. **Send Test Messages**
   ```javascript
   // Open browser console on LumiaFix page
   // This simulates CC#1 (Exposure) at 50% (value 64)
   
   navigator.requestMIDIAccess().then(access => {
     const output = access.outputs.values().next().value;
     output.send([176, 1, 64]); // CC#1 = Exposure to 0.0
     output.send([176, 1, 127]); // CC#1 = Exposure to +2.0
     output.send([176, 1, 0]);   // CC#1 = Exposure to -2.0
   });
   ```

### Expected Behavior

1. **Connection**
   - "🎹 MIDI" appears in stats overlay (top-left)
   - No console errors

2. **Control Response**
   - Moving CC#1 adjusts Exposure slider in real-time
   - Moving CC#2 adjusts Contrast slider
   - No lag or frame drops

3. **Performance**
   - FPS remains at 60
   - CPU usage unchanged (<5% increase)

### Troubleshooting

**"🎹 MIDI" doesn't appear**
- Check browser console for errors
- Verify MIDI device is connected before launching app
- Try refreshing page after connecting device

**Controls don't respond**
- Verify CC numbers match (use MIDI monitor)
- Check device is sending CC messages (not notes)
- Some controllers need "MIDI mode" enabled

**Frame drops when using MIDI**
- This shouldn't happen (MIDI is event-driven)
- Check for other CPU-intensive processes
- Verify you're not sending thousands of messages/second

### Hardware Controller Recommendations

**Budget ($50-100)**
- Korg nanoKONTROL2 (8 faders, 8 knobs)
- Behringer X-Touch Mini (8 knobs, 16 buttons)

**Pro ($200-500)**
- Tangent Ripple (3 trackballs, 12 knobs)
- Loupedeck Live (15 knobs, 12 buttons, touchscreen)

**DIY**
- Arduino + MIDI library
- Raspberry Pi Pico + CircuitPython
