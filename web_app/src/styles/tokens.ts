// Design Tokens based on ReadyRoad Style Guide
// Reference: Orange Primary #DF5830, Modern Radius 24px

export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#DF5830',
      50: '#FEF3F0',
      100: '#FCE7E1',
      200: '#F9CFC3',
      300: '#F5A185',
      400: '#F17347',
      500: '#DF5830',
      600: '#C74621',
      700: '#9A361A',
      800: '#6D2713',
      900: '#40170C',
    },
    secondary: {
      DEFAULT: '#2C3E50',
      50: '#F5F6F8',
      100: '#EBEEF1',
      200: '#D7DCE3',
      300: '#A8B4C4',
      400: '#798CA5',
      500: '#4A6486',
      600: '#2C3E50',
      700: '#23313E',
      800: '#1A242C',
      900: '#11171A',
    },
    success: {
      DEFAULT: '#27AE60',
      light: '#6FCF97',
      dark: '#1E8449',
    },
    warning: {
      DEFAULT: '#F39C12',
      light: '#F8C471',
      dark: '#D68910',
    },
    error: {
      DEFAULT: '#E74C3C',
      light: '#EC7063',
      dark: '#C0392B',
    },
    info: {
      DEFAULT: '#3498DB',
      light: '#5DADE2',
      dark: '#2874A6',
    },
    neutral: {
      50: '#F8F9FA',
      100: '#F1F3F5',
      200: '#E9ECEF',
      300: '#DEE2E6',
      400: '#CED4DA',
      500: '#ADB5BD',
      600: '#6C757D',
      700: '#495057',
      800: '#343A40',
      900: '#212529',
    },
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  radius: {
    none: '0',
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px (Style Guide standard)
    full: '9999px',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      arabic: ['Noto Sans Arabic', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
