/**
 * Color utilities for generating accent color palettes
 */

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 59, g: 130, b: 246 }; // Default blue
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb({ h, s, l }: HSL): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Generate a color palette from a base color
 * Returns an object with shades from 50 to 950
 */
export function generatePalette(hex: string): Record<string, string> {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  // Define lightness values for each shade
  // These are calibrated to match Tailwind's color system
  const shades: Record<string, number> = {
    '50': 97,
    '100': 94,
    '200': 86,
    '300': 74,
    '400': 62,
    '500': 50,
    '600': 42,
    '700': 34,
    '800': 26,
    '900': 20,
    '950': 12,
  };

  // Adjust saturation based on lightness to maintain vibrancy
  const adjustSaturation = (l: number, baseSat: number): number => {
    if (l > 80) {
      // Lighter colors need less saturation
      return Math.max(baseSat * 0.7, 10);
    } else if (l < 30) {
      // Darker colors can have slightly reduced saturation
      return Math.max(baseSat * 0.85, 20);
    }
    return baseSat;
  };

  const palette: Record<string, string> = {};

  for (const [shade, lightness] of Object.entries(shades)) {
    const adjustedSat = adjustSaturation(lightness, hsl.s);
    const { r, g, b } = hslToRgb({
      h: hsl.h,
      s: adjustedSat,
      l: lightness,
    });
    // Return as space-separated RGB values for Tailwind CSS
    palette[shade] = `${r} ${g} ${b}`;
  }

  return palette;
}

/**
 * Apply accent color palette to CSS custom properties
 */
export function applyAccentPalette(hex: string): void {
  const palette = generatePalette(hex);
  const root = document.documentElement;

  for (const [shade, rgb] of Object.entries(palette)) {
    root.style.setProperty(`--accent-${shade}`, rgb);
  }
}

/**
 * Preset accent colors
 */
export const presetColors = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Indigo', hex: '#6366f1' },
] as const;

/**
 * Check if a color is valid hex
 */
export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

/**
 * Get contrasting text color (black or white) for a given background
 */
export function getContrastColor(hex: string): 'black' | 'white' {
  const rgb = hexToRgb(hex);
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
}
