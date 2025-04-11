// Global theme configuration for the MedConnect app

export const COLORS = {
  // Primary colors
  primary: {
    main: '#4E73DF',
    light: '#6B8AE5',
    dark: '#3A5FD1',
    contrast: '#FFFFFF'
  },
  
  // Secondary colors
  secondary: {
    main: '#1CC88A',
    light: '#36D49B',
    dark: '#16A673',
    contrast: '#FFFFFF'
  },
  
  // Accent colors
  accent: {
    main: '#F6C23E',
    light: '#F8CD5C',
    dark: '#E5B02D',
    contrast: '#000000'
  },
  
  // Status colors
  status: {
    success: '#1CC88A',
    warning: '#F6C23E',
    error: '#E74A3B',
    info: '#36B9CC'
  },
  
  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    background: '#F8F9FC',
    card: '#FFFFFF',
    border: '#E3E6F0',
    divider: '#EAECF4'
  },
  
  // Text colors
  text: {
    primary: '#2D3748',
    secondary: '#718096',
    disabled: '#A0AEC0',
    hint: '#A0AEC0'
  },
  
  // Gradient combinations
  gradients: {
    primary: ['#4E73DF', '#3A5FD1'],
    success: ['#1CC88A', '#16A673'],
    warning: ['#F6C23E', '#E5B02D'],
    error: ['#E74A3B', '#D32F2F'],
    card: ['#FFFFFF', '#F8F9FC']
  }
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.25
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0
  },
  subtitle1: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.15
  },
  subtitle2: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.1
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.5
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.25
  },
  button: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.4
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  }
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999
};

export const ANIMATIONS = {
  button: {
    scale: {
      pressed: 0.96,
      normal: 1
    },
    duration: {
      press: 100,
      release: 200
    }
  },
  transition: {
    fast: 200,
    normal: 300,
    slow: 500
  },
  spring: {
    gentle: {
      friction: 7,
      tension: 40
    },
    bouncy: {
      friction: 4,
      tension: 50
    }
  }
};

export const LAYOUT = {
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md
  },
  card: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.neutral.card,
    ...SHADOWS.md
  },
  input: {
    height: 56,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.neutral.background,
    borderWidth: 1,
    borderColor: COLORS.neutral.border
  }
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
  ANIMATIONS,
  LAYOUT
};