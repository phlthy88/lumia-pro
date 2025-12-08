import React, { useRef, memo } from 'react';
import { Button, Stack, Box } from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import { MuiSelect } from './MuiSelect';
import { MuiSlider } from './MuiSlider';
import { ControlCard } from './ControlCard';
import { LutData } from '../../types';

interface LutControlProps {
    luts: LutData[];
    activeIndex: number;
    strength: number;
    onSelect: (index: number) => void;
    onUpload: (file: File) => void;
    onChangeStrength: (val: number) => void;
}

export const MuiLutControl: React.FC<LutControlProps> = memo(({
    luts, activeIndex, strength, onSelect, onUpload, onChangeStrength 
}) => {
    const fileRef = useRef<HTMLInputElement>(null);

    const options = luts.map((lut, i) => ({ value: i, label: lut.name || `LUT ${i}` }));

    return (
        <ControlCard title="Color Profiles (LUTs)">
            {options.length > 0 && (
                <MuiSelect 
                    label="Select Profile"
                    value={activeIndex}
                    options={options}
                    onChange={(val) => onSelect(Number(val))}
                />
            )}
            
            <Button 
                variant="outlined" 
                startIcon={<UploadFile />} 
                fullWidth 
                onClick={() => fileRef.current?.click()}
                sx={{ mb: 2 }}
                aria-label="Import LUT file"
            >
                Import .CUBE File
            </Button>
            <input 
                id="mui-lut-upload"
                type="file" 
                ref={fileRef} 
                className="hidden" 
                accept=".cube"
                style={{ display: 'none' }}
                aria-label="Import LUT cube file"
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} 
            />

            <MuiSlider 
                label="Intensity" 
                value={strength} 
                min={0} 
                max={1} 
                step={0.01} 
                onChange={onChangeStrength} 
                formatValue={(v) => `${Math.round(v * 100)}%`}
            />
        </ControlCard>
    );
});
