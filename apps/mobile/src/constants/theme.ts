// Chairly Design Tokens
// Brand colors and spacing used consistently across all mobile screens

export const Colors = {
  // Backgrounds
  bg: '#FBF9F5',
  surface: '#FFFFFF',
  panel: '#F5F2EB',
  border: '#EAE5DB',

  // Text
  dark: '#1A1A1A',
  charcoal: '#262626',
  body: '#3D3D3D',
  muted: '#6B665E',
  subtle: '#8C867E',
  placeholder: '#B8B0A2',

  // Brand accent — warm terracotta
  accent: '#C25E3E',
  accentLight: '#F8ECE6',
  accentHover: '#AD4D2F',

  // Status colors
  success: '#15803d',
  successLight: '#F0FDF4',
  warning: '#B45309',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  info: '#1D4ED8',
  infoLight: '#EFF6FF',

  // Misc
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
