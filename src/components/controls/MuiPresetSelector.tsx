import React, { useRef, memo } from 'react';
import { Stack, Button, Box } from '@mui/material';
import { Save, FileUpload, FileDownload, Delete } from '@mui/icons-material';
import { MuiSelect } from './MuiSelect';
import { Preset } from '../../types';

interface PresetSelectorProps {
    presets: Preset[];
    onLoad: (id: string) => void;
    onSave: (name: string) => void;
    onDelete: (id: string) => void;
    onImport: (json: string) => void;
    onExport: () => void;
}

export const MuiPresetSelector: React.FC<PresetSelectorProps> = memo(({
    presets, onLoad, onSave, onDelete, onImport, onExport 
}) => {
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

    const options = presets.map(p => ({ value: p.id, label: p.name }));

    return (
        <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
                <Box sx={{ flexGrow: 1 }}>
                     <MuiSelect 
                        label="Load Preset" 
                        value="" 
                        options={options} 
                        onChange={onLoad} 
                    />
                </Box>
                <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={handleSaveClick}
                    sx={{ minWidth: 40, height: 40 }}
                    aria-label="Save Preset"
                >
                    <Save fontSize="small" />
                </Button>
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button 
                    size="small" 
                    startIcon={<FileUpload />} 
                    onClick={onExport}
                    aria-label="Export Presets"
                >
                    Export
                </Button>
                <Button 
                    size="small" 
                    startIcon={<FileDownload />} 
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Import Presets"
                >
                    Import
                </Button>
                <input 
                    id="mui-preset-import"
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    aria-label="Import preset file"
                    onChange={handleImportClick}
                    style={{ display: 'none' }}
                />
            </Stack>
        </Box>
    );
});
