import {
  argbFromHex,
  themeFromSourceColor,
  Hct,
  hexFromArgb,
  SchemeExpressive,
} from "@material/material-color-utilities";

export const DEFAULT_SEED_COLOR = "#D0BCFF";

export function createM3Theme(sourceHex: string, isDark: boolean = true) {
  const sourceArgb = argbFromHex(sourceHex);
  const hct = Hct.fromInt(sourceArgb);

  const lightScheme = new SchemeExpressive(hct, false, 0.0);
  const darkScheme = new SchemeExpressive(hct, true, 0.0);
  const standardTheme = themeFromSourceColor(sourceArgb);

  return {
    schemes: { light: lightScheme, dark: darkScheme },
    palettes: standardTheme.palettes
  };
}

export function applyM3ToRoot(theme: ReturnType<typeof createM3Theme>, isDark: boolean) {
  const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
  const root = document.documentElement;

  const set = (name: string, argb: number) => {
    root.style.setProperty(name, hexFromArgb(argb));
  };

  const setRgb = (name: string, argb: number) => {
    const hex = hexFromArgb(argb);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    root.style.setProperty(`${name}-rgb`, `${r} ${g} ${b}`);
  };

  const colors: Record<string, number> = {
    "--md-sys-color-primary": scheme.primary,
    "--md-sys-color-on-primary": scheme.onPrimary,
    "--md-sys-color-primary-container": scheme.primaryContainer,
    "--md-sys-color-on-primary-container": scheme.onPrimaryContainer,
    "--md-sys-color-secondary": scheme.secondary,
    "--md-sys-color-on-secondary": scheme.onSecondary,
    "--md-sys-color-secondary-container": scheme.secondaryContainer,
    "--md-sys-color-on-secondary-container": scheme.onSecondaryContainer,
    "--md-sys-color-tertiary": scheme.tertiary,
    "--md-sys-color-on-tertiary": scheme.onTertiary,
    "--md-sys-color-tertiary-container": scheme.tertiaryContainer,
    "--md-sys-color-on-tertiary-container": scheme.onTertiaryContainer,
    "--md-sys-color-error": scheme.error,
    "--md-sys-color-on-error": scheme.onError,
    "--md-sys-color-error-container": scheme.errorContainer,
    "--md-sys-color-on-error-container": scheme.onErrorContainer,
    "--md-sys-color-background": scheme.background,
    "--md-sys-color-on-background": scheme.onBackground,
    "--md-sys-color-surface": scheme.surface,
    "--md-sys-color-on-surface": scheme.onSurface,
    "--md-sys-color-surface-variant": scheme.surfaceVariant,
    "--md-sys-color-on-surface-variant": scheme.onSurfaceVariant,
    "--md-sys-color-outline": scheme.outline,
    "--md-sys-color-outline-variant": scheme.outlineVariant,
    "--md-sys-color-shadow": scheme.shadow,
    "--md-sys-color-scrim": scheme.scrim,
    "--md-sys-color-inverse-surface": scheme.inverseSurface,
    "--md-sys-color-inverse-on-surface": scheme.inverseOnSurface,
    "--md-sys-color-inverse-primary": scheme.inversePrimary,
  };

  const neutral = theme.palettes.neutral;

  if (isDark) {
    colors["--md-sys-color-surface-dim"] = neutral.tone(6);
    colors["--md-sys-color-surface-bright"] = neutral.tone(24);
    colors["--md-sys-color-surface-container-lowest"] = neutral.tone(4);
    colors["--md-sys-color-surface-container-low"] = neutral.tone(10);
    colors["--md-sys-color-surface-container"] = neutral.tone(12);
    colors["--md-sys-color-surface-container-high"] = neutral.tone(17);
    colors["--md-sys-color-surface-container-highest"] = neutral.tone(22);
  } else {
    colors["--md-sys-color-surface"] = neutral.tone(99);
    colors["--md-sys-color-surface-dim"] = neutral.tone(90);
    colors["--md-sys-color-surface-bright"] = neutral.tone(99);
    colors["--md-sys-color-surface-container-lowest"] = neutral.tone(100);
    colors["--md-sys-color-surface-container-low"] = neutral.tone(96);
    colors["--md-sys-color-surface-container"] = neutral.tone(94);
    colors["--md-sys-color-surface-container-high"] = neutral.tone(92);
    colors["--md-sys-color-surface-container-highest"] = neutral.tone(90);
  }

  Object.entries(colors).forEach(([key, value]) => {
    set(key, value);
    setRgb(key, value);
  });
}
