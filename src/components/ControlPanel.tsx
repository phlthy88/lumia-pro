import React, { useRef, useState, useEffect, useId } from 'react';
import { Preset, GridType, AspectRatio, OverlayConfig, RecorderConfig } from '../types';

// --- Shared Components ---

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  unit?: string;
  defaultValue?: number;
  formatValue?: (val: number) => string;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange, unit, defaultValue, formatValue }) => {
  const id = useId();
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1 text-xs text-studio-muted">
        <label htmlFor={id} className="uppercase tracking-wider font-semibold">{label}</label>
        <span className="font-mono text-indigo-400">
          {formatValue ? formatValue(value) : `${value.toFixed(2)}${unit || ''}`}
        </span>
      </div>
      <div className="relative group h-6 flex items-center">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-studio-border rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
        {defaultValue !== undefined && (
             <div 
                className="absolute w-0.5 h-3 bg-studio-muted top-1.5 pointer-events-none opacity-50" 
                style={{ left: `${((defaultValue - min) / (max - min)) * 100}%` }}
             />
        )}
      </div>
    </div>
  );
};

interface ToggleProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

export const ToggleButton: React.FC<ToggleProps> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border transition-all ${
            active 
            ? 'bg-indigo-900/50 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
            : 'bg-transparent border-studio-border text-studio-muted hover:border-studio-text'
        }`}
    >
        {label}
    </button>
)

interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'secondary', disabled = false, fullWidth = false, icon }) => {
    let baseClasses = "px-4 py-2 text-xs font-bold rounded transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
        secondary: "bg-studio-border hover:bg-studio-muted/20 text-studio-text border border-white/5 hover:border-white/10",
        danger: "bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50"
    };

    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
        >
            {icon && <span className="text-sm">{icon}</span>}
            {children}
        </button>
    );
}

export const PanelSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="mb-1 border-b border-studio-border/50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-xs font-bold text-white py-3 px-2 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className={`w-1 h-3 rounded-full inline-block transition-colors ${isOpen ? 'bg-indigo-500' : 'bg-studio-muted'}`}></span>
                    {title}
                </div>
                <span className="text-studio-muted">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="p-2 pb-6">{children}</div>}
        </div>
    );
};

// --- Complex Components ---

interface PresetSelectorProps {
    presets: Preset[];
    onLoad: (id: string) => void;
    onSave: (name: string) => void;
    onDelete: (id: string) => void;
    onImport: (json: string) => void;
    onExport: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ presets, onLoad, onSave, onDelete: _onDelete, onImport, onExport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveClick = () => {
        const name = prompt("Enter preset name:");
        if (name) onSave(name);
    };

    const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) onImport(ev.target.result as string);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="mb-4">
            <div className="flex gap-2 mb-2">
                <label htmlFor="preset-select" className="sr-only">Load Profile</label>
                <select 
                    id="preset-select"
                    className="flex-1 bg-black border border-studio-border rounded p-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    onChange={(e) => {
                        if (e.target.value) onLoad(e.target.value);
                    }}
                    defaultValue=""
                >
                    <option value="" disabled>Load Profile...</option>
                    {presets.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <button 
                    onClick={handleSaveClick}
                    className="px-2 bg-indigo-900/40 border border-indigo-500/50 text-indigo-300 rounded hover:bg-indigo-900 text-xs"
                    title="Save Current Settings"
                >
                    💾
                </button>
            </div>
            <div className="flex justify-between items-center text-[10px] text-studio-muted">
                <div className="flex gap-2">
                    <button onClick={onExport} className="hover:text-indigo-400 underline decoration-indigo-500/50">Export</button>
                    <button onClick={() => fileInputRef.current?.click()} className="hover:text-indigo-400 underline decoration-indigo-500/50">Import</button>
                    <input 
                        id="preset-import"
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".json" 
                        onChange={handleImportClick}
                        aria-label="Import preset file"
                    />
                </div>
            </div>
        </div>
    );
}

export const LutControl: React.FC<{
    luts: { name: string }[];
    activeIndex: number;
    strength: number;
    onSelect: (index: number) => void;
    onUpload: (file: File) => void;
    onChangeStrength: (val: number) => void;
}> = ({ luts, activeIndex, strength, onSelect, onUpload, onChangeStrength }) => {
    const fileRef = useRef<HTMLInputElement>(null);

    return (
        <PanelSection title="Color Profiles (LUTs)">
            <div className="mb-4">
                <label htmlFor="lut-select" className="sr-only">Select LUT</label>
                <select 
                    id="lut-select"
                    className="w-full bg-black border border-studio-border rounded p-2 text-xs text-white focus:border-indigo-500 outline-none mb-2"
                    value={activeIndex}
                    onChange={(e) => onSelect(Number(e.target.value))}
                >
                    {luts.map((lut, i) => (
                        <option key={i} value={i}>{lut.name}</option>
                    ))}
                </select>
                
                <button 
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-1.5 border border-dashed border-studio-muted/50 rounded text-[10px] text-studio-muted hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                    + IMPORT .CUBE FILE
                </button>
                <input 
                    id="lut-upload"
                    type="file" 
                    ref={fileRef} 
                    className="hidden" 
                    accept=".cube"
                    aria-label="Import LUT file"
                    onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} 
                />
            </div>

            <Slider 
                label="Intensity" 
                value={strength} 
                min={0} 
                max={1} 
                step={0.01} 
                onChange={onChangeStrength} 
                formatValue={(v) => `${Math.round(v * 100)}%`}
            />
        </PanelSection>
    );
};

interface RecorderProps {
    isRecording: boolean;
    recordingTime: number;
    onRecord: () => void;
    onStop: () => void;
    onSnapshot: () => void;
}

export const RecorderControls: React.FC<RecorderProps> = ({ isRecording, recordingTime, onRecord, onStop, onSnapshot }) => (
    <div className="flex items-center justify-between bg-studio-panel border border-studio-border p-3 rounded-lg mb-6 shadow-lg">
        <div className="flex items-center gap-3">
             <button
                onClick={isRecording ? onStop : onRecord}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isRecording 
                    ? 'border-red-500 bg-red-500/20' 
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
             >
                <div className={`${isRecording ? 'w-3 h-3 rounded-sm bg-white' : 'w-4 h-4 rounded-full bg-white'}`} />
             </button>
             <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-studio-muted">REC</span>
                 <span className={`text-sm font-mono ${isRecording ? 'text-white' : 'text-studio-muted'}`}>
                     {new Date(recordingTime * 1000).toISOString().substr(14, 5)}
                 </span>
             </div>
        </div>
        <button
            onClick={onSnapshot}
            className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/5 hover:bg-indigo-900/20 hover:border-indigo-400 text-indigo-400 flex items-center justify-center transition-all"
            title="Take Screenshot"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
    </div>
);

interface RecorderSettingsProps {
    config: RecorderConfig;
    setConfig: React.Dispatch<React.SetStateAction<RecorderConfig>>;
}

export const RecorderSettings: React.FC<RecorderSettingsProps> = ({ config, setConfig }) => {
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
        });
    }, []);

    return (
        <PanelSection title="Recording Setup">
            <div className="space-y-3">
                <div>
                    <label htmlFor="rec-format" className="text-xs text-studio-muted block mb-1">Format</label>
                    <select 
                        id="rec-format"
                        className="w-full bg-black border border-studio-border rounded p-1.5 text-xs text-white"
                        value={config.mimeType}
                        onChange={(e) => setConfig(p => ({ ...p, mimeType: e.target.value }))}
                    >
                        <option value="video/webm;codecs=vp9">WebM (VP9) - Efficient</option>
                        <option value="video/webm;codecs=h264">WebM (H.264) - Compatible</option>
                        <option value="video/mp4">MP4 - Universal</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="rec-bitrate" className="text-xs text-studio-muted block mb-1">Bitrate</label>
                    <select 
                        id="rec-bitrate"
                        className="w-full bg-black border border-studio-border rounded p-1.5 text-xs text-white"
                        value={config.bitrate}
                        onChange={(e) => setConfig(p => ({ ...p, bitrate: Number(e.target.value) }))}
                    >
                        <option value={1000000}>1 Mbps (Low)</option>
                        <option value={2500000}>2.5 Mbps (Medium)</option>
                        <option value={5000000}>5 Mbps (High)</option>
                        <option value={10000000}>10 Mbps (Ultra)</option>
                    </select>
                </div>
                <div>
                     <label htmlFor="rec-audio" className="text-xs text-studio-muted block mb-1">Audio Source</label>
                     <select 
                        id="rec-audio"
                        className="w-full bg-black border border-studio-border rounded p-1.5 text-xs text-white"
                        value={config.audioSource}
                        onChange={(e) => setConfig(p => ({ ...p, audioSource: e.target.value }))}
                    >
                        <option value="none">No Audio</option>
                        {audioDevices.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,4)}...`}</option>
                        ))}
                    </select>
                </div>
                 <div>
                     <label htmlFor="rec-countdown" className="text-xs text-studio-muted block mb-1">Countdown</label>
                     <select 
                        id="rec-countdown"
                        className="w-full bg-black border border-studio-border rounded p-1.5 text-xs text-white"
                        value={config.countdown}
                        onChange={(e) => setConfig(p => ({ ...p, countdown: Number(e.target.value) }))}
                    >
                        <option value={0}>None</option>
                        <option value={3}>3 Seconds</option>
                        <option value={5}>5 Seconds</option>
                        <option value={10}>10 Seconds</option>
                    </select>
                </div>
            </div>
        </PanelSection>
    );
};

// --- Layout & Tabs ---

export const ControlTabs: React.FC<{ 
    activeTab: string; 
    onChange: (tab: string) => void 
}> = ({ activeTab, onChange }) => (
    <div className="flex border-b border-studio-border bg-studio-panel sticky top-0 z-20">
        {['ADJUST', 'OVERLAYS', 'SYSTEM'].map(tab => (
            <button
                key={tab}
                onClick={() => onChange(tab)}
                className={`flex-1 py-3 text-[10px] font-bold tracking-widest transition-colors ${
                    activeTab === tab 
                    ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/5' 
                    : 'text-studio-muted hover:text-white hover:bg-white/5'
                }`}
            >
                {tab}
            </button>
        ))}
    </div>
);

// --- Overlay Controls ---

export const OverlaySettings: React.FC<{ config: OverlayConfig; setConfig: React.Dispatch<React.SetStateAction<OverlayConfig>> }> = ({ config, setConfig }) => {
    return (
        <div className="space-y-4">
            <PanelSection title="Guides & Grids">
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.values(GridType).map(type => (
                        <ToggleButton 
                            key={type} 
                            label={type.replace('Rule of ', '')} 
                            active={config.grid === type} 
                            onClick={() => setConfig(p => ({ ...p, grid: type }))} 
                        />
                    ))}
                </div>
            </PanelSection>

            <PanelSection title="Cinema Mask">
                <label htmlFor="aspect-ratio" className="sr-only">Aspect Ratio</label>
                <select 
                    id="aspect-ratio"
                    className="w-full bg-black border border-studio-border rounded p-2 text-xs text-white focus:border-indigo-500 outline-none mb-4"
                    value={config.aspectRatio}
                    onChange={(e) => setConfig(p => ({ ...p, aspectRatio: e.target.value as AspectRatio }))}
                >
                    {Object.values(AspectRatio).map(ar => (
                         <option key={ar} value={ar}>{ar}</option>
                    ))}
                </select>
            </PanelSection>

            <PanelSection title="Broadcast Tools">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-studio-muted">Safe Areas (90/80%)</span>
                        <ToggleButton label={config.safeArea ? 'ON' : 'OFF'} active={config.safeArea} onClick={() => setConfig(p => ({ ...p, safeArea: !p.safeArea }))} />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-studio-muted">SMPTE Timecode</span>
                        <ToggleButton label={config.timecode ? 'ON' : 'OFF'} active={config.timecode} onClick={() => setConfig(p => ({ ...p, timecode: !p.timecode }))} />
                    </div>
                </div>
            </PanelSection>
        </div>
    );
};