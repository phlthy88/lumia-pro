import React, { createContext, useContext, useMemo, useState } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, PaletteMode, alpha, PaletteColorOptions } from '@mui/material';
import { 
  argbFromHex, 
  sourceColorFromImage, 
  hexFromArgb,
  Hct,
  SchemeExpressive,
  TonalPalette
} from '@material/material-color-utilities';

// ============================================================================
// EXTENDED MUI TYPE DECLARATIONS FOR M3 TOKENS
// ============================================================================
declare module '@mui/material/styles' {
  interface PaletteColor {
    container: string;
    onContainer: string;
  }
  interface SimplePaletteColorOptions {
    container?: string;
    onContainer?: string;
  }
  interface TypeBackground {
    surfaceDim: string;
    surfaceBright: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    onSurface: string;
    onSurfaceVariant: string;
    surfaceVariant: string;
    inverseSurface: string;
    inverseOnSurface: string;
  }
  interface Palette {
    tertiary: PaletteColor;
    outline: string;
    outlineVariant: string;
  }
  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
    outline?: string;
    outlineVariant?: string;
  }
}

// ============================================================================
// THEME CONTEXT
// ============================================================================
type ThemeContextType = {
  mode: PaletteMode;
  toggleMode: () => void;
  seedColor: string;
  setSeedColor: (color: string) => void;
  extractThemeFromImage: (file: File) => Promise<void>;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// COLOR UTILITY FUNCTIONS
// ============================================================================

/**
 * Attempt to lighten a color by adjusting its HCT tone
 * Used for MUI's "light" variant (should be lighter than main)
 */
function lightenArgb(argb: number, amount: number = 15): number {
  const hct = Hct.fromInt(argb);
  const newTone = Math.min(100, hct.tone + amount);
  return Hct.from(hct.hue, hct.chroma, newTone).toInt();
}

/**
 * Attempt to darken a color by adjusting its HCT tone
 * Used for MUI's "dark" variant (should be darker than main)
 */
function darkenArgb(argb: number, amount: number = 15): number {
  const hct = Hct.fromInt(argb);
  const newTone = Math.max(0, hct.tone - amount);
  return Hct.from(hct.hue, hct.chroma, newTone).toInt();
}

/**
 * Boost chroma (saturation) for more vibrant container colors in dark mode
 */
function boostChroma(argb: number, multiplier: number = 1.3): number {
  const hct = Hct.fromInt(argb);
  const newChroma = Math.min(120, hct.chroma * multiplier);
  return Hct.from(hct.hue, newChroma, hct.tone).toInt();
}

/**
 * Get surface container tones from neutral palette
 * M3 spec: https://m3.material.io/styles/color/static/baseline
 */
function getSurfaceContainerTones(neutralPalette: TonalPalette, isDark: boolean) {
  if (isDark) {
    return {
      surfaceDim: neutralPalette.tone(6),
      surface: neutralPalette.tone(6),
      surfaceBright: neutralPalette.tone(24),
      surfaceContainerLowest: neutralPalette.tone(4),
      surfaceContainerLow: neutralPalette.tone(10),
      surfaceContainer: neutralPalette.tone(12),
      surfaceContainerHigh: neutralPalette.tone(17),
      surfaceContainerHighest: neutralPalette.tone(22),
    };
  } else {
    return {
      surfaceDim: neutralPalette.tone(87),
      surface: neutralPalette.tone(98),
      surfaceBright: neutralPalette.tone(98),
      surfaceContainerLowest: neutralPalette.tone(100),
      surfaceContainerLow: neutralPalette.tone(96),
      surfaceContainer: neutralPalette.tone(94),
      surfaceContainerHigh: neutralPalette.tone(92),
      surfaceContainerHighest: neutralPalette.tone(90),
    };
  }
}

// ============================================================================
// THEME PROVIDER COMPONENT
// ============================================================================
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>('dark'); 
  const [seedColor, setSeedColor] = useState<string>('#6750A4'); 

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const resetTheme = () => {
    setSeedColor('#6750A4');
    setMode('dark');
  };

  const extractThemeFromImage = async (file: File) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const sourceColor = await sourceColorFromImage(img);
      const hex = hexFromArgb(sourceColor);
      setSeedColor(hex);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to extract color from image:', error);
    }
  };

  // ============================================================================
  // GENERATE M3 EXPRESSIVE THEME
  // ============================================================================
  const theme = useMemo(() => {
    const sourceArgb = argbFromHex(seedColor);
    const hct = Hct.fromInt(sourceArgb);
    const isDark = mode === 'dark';
    
    // Use SchemeExpressive for more vibrant, distinctive colors
    // Contrast level 0.0 = standard, can go up to 1.0 for high contrast
    const scheme = new SchemeExpressive(hct, isDark, 0.0);
    
    // Create tonal palettes for surface containers
    // SchemeExpressive uses the neutral palette from the source color
    const neutralPalette = TonalPalette.fromHueAndChroma(hct.hue, 6); // Low chroma for neutrals
    const neutralVariantPalette = TonalPalette.fromHueAndChroma(hct.hue, 8);
    
    // Get surface container tokens
    const surfaceTokens = getSurfaceContainerTones(neutralPalette, isDark);
    
    // ========================================================================
    // FIX #1: Proper light/dark variants for MUI palette colors
    // MUI expects: light = lighter than main, dark = darker than main
    // NOT M3 containers (those are separate concepts)
    // ========================================================================
    
    // Primary color variants
    const primaryMain = scheme.primary;
    const primaryLight = isDark 
      ? lightenArgb(primaryMain, 20)  // Lighter variant for dark mode
      : lightenArgb(primaryMain, 15); // Lighter variant for light mode
    const primaryDark = isDark
      ? darkenArgb(primaryMain, 10)   // Darker variant for dark mode  
      : darkenArgb(primaryMain, 20);  // Darker variant for light mode

    // Secondary color variants
    const secondaryMain = scheme.secondary;
    const secondaryLight = isDark 
      ? lightenArgb(secondaryMain, 20)
      : lightenArgb(secondaryMain, 15);
    const secondaryDark = isDark
      ? darkenArgb(secondaryMain, 10)
      : darkenArgb(secondaryMain, 20);

    // Tertiary color variants  
    const tertiaryMain = scheme.tertiary;
    const tertiaryLight = isDark 
      ? lightenArgb(tertiaryMain, 20)
      : lightenArgb(tertiaryMain, 15);
    const tertiaryDark = isDark
      ? darkenArgb(tertiaryMain, 10)
      : darkenArgb(tertiaryMain, 20);

    // ========================================================================
    // FIX #2: Boost container chroma in dark mode for legibility
    // M3 dark containers can be too muted - increase saturation
    // ========================================================================
    const primaryContainer = isDark 
      ? boostChroma(scheme.primaryContainer, 1.4)
      : scheme.primaryContainer;
    const secondaryContainer = isDark
      ? boostChroma(scheme.secondaryContainer, 1.3)
      : scheme.secondaryContainer;
    const tertiaryContainer = isDark
      ? boostChroma(scheme.tertiaryContainer, 1.3)
      : scheme.tertiaryContainer;
    const errorContainer = isDark
      ? boostChroma(scheme.errorContainer, 1.2)
      : scheme.errorContainer;

    // ========================================================================
    // FIX #3: Ensure proper contrast for onContainer colors
    // In dark mode, onContainer should be light enough to read
    // ========================================================================
    const onPrimaryContainer = isDark
      ? lightenArgb(scheme.onPrimaryContainer, 10) // Boost lightness for readability
      : scheme.onPrimaryContainer;
    const onSecondaryContainer = isDark
      ? lightenArgb(scheme.onSecondaryContainer, 10)
      : scheme.onSecondaryContainer;
    const onTertiaryContainer = isDark
      ? lightenArgb(scheme.onTertiaryContainer, 10)
      : scheme.onTertiaryContainer;

    // Surface variant for card backgrounds, etc.
    const surfaceVariant = isDark
      ? neutralVariantPalette.tone(30)
      : neutralVariantPalette.tone(90);
    const onSurfaceVariant = isDark
      ? neutralVariantPalette.tone(80)
      : neutralVariantPalette.tone(30);

    // Outline colors
    const outline = isDark
      ? neutralVariantPalette.tone(60)
      : neutralVariantPalette.tone(50);
    const outlineVariant = isDark
      ? neutralVariantPalette.tone(30)
      : neutralVariantPalette.tone(80);

    // ========================================================================
    // BUILD MUI THEME
    // ========================================================================
    const muiTheme = createTheme({
      palette: {
        mode,
        primary: {
          main: hexFromArgb(primaryMain),
          light: hexFromArgb(primaryLight),
          dark: hexFromArgb(primaryDark),
          contrastText: hexFromArgb(scheme.onPrimary),
          container: hexFromArgb(primaryContainer),
          onContainer: hexFromArgb(onPrimaryContainer),
        },
        secondary: {
          main: hexFromArgb(secondaryMain),
          light: hexFromArgb(secondaryLight),
          dark: hexFromArgb(secondaryDark),
          contrastText: hexFromArgb(scheme.onSecondary),
          container: hexFromArgb(secondaryContainer),
          onContainer: hexFromArgb(onSecondaryContainer),
        },
        tertiary: {
          main: hexFromArgb(tertiaryMain),
          light: hexFromArgb(tertiaryLight),
          dark: hexFromArgb(tertiaryDark),
          contrastText: hexFromArgb(scheme.onTertiary),
          container: hexFromArgb(tertiaryContainer),
          onContainer: hexFromArgb(onTertiaryContainer),
        },
        error: {
          main: hexFromArgb(scheme.error),
          light: hexFromArgb(lightenArgb(scheme.error, 15)),
          dark: hexFromArgb(darkenArgb(scheme.error, 15)),
          contrastText: hexFromArgb(scheme.onError),
          container: hexFromArgb(errorContainer),
          onContainer: hexFromArgb(scheme.onErrorContainer),
        },
        background: {
          default: hexFromArgb(surfaceTokens.surface),
          paper: hexFromArgb(surfaceTokens.surfaceContainerLow),
          // Extended M3 surface tokens
          surfaceDim: hexFromArgb(surfaceTokens.surfaceDim),
          surfaceBright: hexFromArgb(surfaceTokens.surfaceBright),
          surfaceContainerLowest: hexFromArgb(surfaceTokens.surfaceContainerLowest),
          surfaceContainerLow: hexFromArgb(surfaceTokens.surfaceContainerLow),
          surfaceContainer: hexFromArgb(surfaceTokens.surfaceContainer),
          surfaceContainerHigh: hexFromArgb(surfaceTokens.surfaceContainerHigh),
          surfaceContainerHighest: hexFromArgb(surfaceTokens.surfaceContainerHighest),
          onSurface: hexFromArgb(scheme.onSurface),
          onSurfaceVariant: hexFromArgb(onSurfaceVariant),
          surfaceVariant: hexFromArgb(surfaceVariant),
          inverseSurface: hexFromArgb(scheme.inverseSurface),
          inverseOnSurface: hexFromArgb(scheme.inverseOnSurface),
        },
        text: {
          primary: hexFromArgb(scheme.onSurface),
          secondary: hexFromArgb(onSurfaceVariant),
          disabled: alpha(hexFromArgb(scheme.onSurface), 0.38),
        },
        divider: hexFromArgb(outlineVariant),
        outline: hexFromArgb(outline),
        outlineVariant: hexFromArgb(outlineVariant),
        action: {
          hover: alpha(hexFromArgb(scheme.onSurface), 0.08),
          selected: alpha(hexFromArgb(scheme.primary), 0.16),
          disabled: alpha(hexFromArgb(scheme.onSurface), 0.12),
          disabledBackground: alpha(hexFromArgb(scheme.onSurface), 0.12),
          focus: alpha(hexFromArgb(scheme.onSurface), 0.12),
        },
      },
      typography: {
        fontFamily: 'Roboto, sans-serif',
      },
      shape: {
        borderRadius: 16,
      },
      transitions: {
        duration: {
          shortest: 150,
          shorter: 200,
          short: 250,
          standard: 300,
          complex: 375,
          enteringScreen: 225,
          leavingScreen: 195,
        },
        easing: {
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
        },
      },
      components: {
        // ====================================================================
        // COMPONENT OVERRIDES WITH PROPER M3 TOKEN USAGE
        // ====================================================================
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: hexFromArgb(darkenArgb(tertiaryMain, 75)),
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              backgroundColor: hexFromArgb(surfaceTokens.surfaceContainerLow),
              backgroundImage: 'none',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              transition: 'background-color 0.3s ease, box-shadow 0.2s ease',
            },
            elevation0: {
              backgroundColor: hexFromArgb(surfaceTokens.surface),
            },
            elevation1: {
              backgroundColor: hexFromArgb(surfaceTokens.surfaceContainerLow),
            },
            elevation2: {
              backgroundColor: hexFromArgb(surfaceTokens.surfaceContainer),
            },
            elevation3: {
              backgroundColor: hexFromArgb(surfaceTokens.surfaceContainerHigh),
            },
            elevation4: {
              backgroundColor: hexFromArgb(surfaceTokens.surfaceContainerHighest),
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRight: 'none',
              backgroundColor: hexFromArgb(surfaceTokens.surfaceContainerLow),
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: hexFromArgb(surfaceTokens.surface),
              color: hexFromArgb(scheme.onSurface),
              backgroundImage: 'none',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 20,
              textTransform: 'none',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              '&:active': {
                transform: 'scale(0.97)',
              },
            },
            contained: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            },
            // Filled tonal button (M3 style)
            containedSecondary: {
              backgroundColor: hexFromArgb(secondaryContainer),
              color: hexFromArgb(onSecondaryContainer),
              '&:hover': {
                backgroundColor: alpha(hexFromArgb(secondaryContainer), 0.88),
              },
            },
            outlined: {
              borderColor: hexFromArgb(outline),
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              color: hexFromArgb(onSurfaceVariant),
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            },
          },
        },
        MuiSlider: {
          styleOverrides: {
            root: {
              color: hexFromArgb(primaryMain),
              transition: 'opacity 0.2s ease',
            },
            thumb: {
              transition: 'box-shadow 0.2s ease, transform 0.15s ease',
              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0 0 0 8px ${alpha(hexFromArgb(primaryMain), 0.16)}`,
              },
              '&:active': {
                transform: 'scale(1.2)',
              },
            },
            track: {
              backgroundColor: hexFromArgb(primaryMain),
            },
            rail: {
              backgroundColor: hexFromArgb(surfaceVariant),
              opacity: 1,
            },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            root: {
              padding: 8,
            },
            switchBase: {
              color: hexFromArgb(outline),
              transition: 'transform 0.2s ease, color 0.2s ease',
              '&.Mui-checked': {
                color: hexFromArgb(scheme.onPrimary),
                transform: 'translateX(16px)',
                '& + .MuiSwitch-track': {
                  backgroundColor: hexFromArgb(primaryMain),
                  opacity: 1,
                },
              },
            },
            thumb: {
              boxShadow: 'none',
              transition: 'transform 0.15s ease',
            },
            track: {
              backgroundColor: hexFromArgb(surfaceVariant),
              opacity: 1,
              borderRadius: 20,
              transition: 'background-color 0.2s ease',
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            },
            filled: {
              backgroundColor: hexFromArgb(secondaryContainer),
              color: hexFromArgb(onSecondaryContainer),
            },
            outlined: {
              borderColor: hexFromArgb(outline),
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: hexFromArgb(outline),
                },
                '&:hover fieldset': {
                  borderColor: hexFromArgb(scheme.onSurface),
                },
                '&.Mui-focused fieldset': {
                  borderColor: hexFromArgb(primaryMain),
                },
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            outlined: {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: hexFromArgb(outline),
              },
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundColor: hexFromArgb(surfaceTokens.surfaceContainerHigh),
              borderRadius: 28,
            },
          },
          defaultProps: {
            TransitionProps: {
              timeout: 300,
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              backgroundColor: hexFromArgb(surfaceTokens.surfaceContainer),
              borderRadius: 4,
            },
            list: {
              '& .MuiMenuItem-root': {
                transition: 'background-color 0.15s ease, transform 0.1s ease',
                '&:hover': {
                  transform: 'translateX(2px)',
                },
              },
            },
          },
          defaultProps: {
            TransitionProps: {
              timeout: 200,
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: hexFromArgb(scheme.inverseSurface),
              color: hexFromArgb(scheme.inverseOnSurface),
            },
          },
        },
        MuiDivider: {
          styleOverrides: {
            root: {
              borderColor: hexFromArgb(outlineVariant),
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 28,
              '&.Mui-selected': {
                backgroundColor: hexFromArgb(secondaryContainer),
                color: hexFromArgb(onSecondaryContainer),
                '&:hover': {
                  backgroundColor: alpha(hexFromArgb(secondaryContainer), 0.88),
                },
              },
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 500,
            },
          },
        },
        MuiFab: {
          styleOverrides: {
            root: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            },
            primary: {
              backgroundColor: hexFromArgb(primaryContainer),
              color: hexFromArgb(onPrimaryContainer),
              '&:hover': {
                backgroundColor: alpha(hexFromArgb(primaryContainer), 0.88),
              },
            },
          },
        },
      },
    });

    return muiTheme;
  }, [seedColor, mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, seedColor, setSeedColor, extractThemeFromImage, resetTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
