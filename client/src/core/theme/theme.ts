import { createTheme } from '@mui/material';
import { colors, fonts, gradients, shadows, radii } from './tokens';

const displayHeading = {
  fontFamily: fonts.display,
  letterSpacing: '-0.01em',
};

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.green,
      light: colors.greenBright,
      dark: colors.greenDeep,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.orange,
      light: colors.orangeWarm,
      dark: colors.orangeBurnt,
      contrastText: '#ffffff',
    },
    success: {
      main: colors.greenBright,
      light: colors.mint,
      dark: colors.green,
      contrastText: '#ffffff',
    },
    warning: {
      main: colors.amberBright,
      dark: colors.amber,
      contrastText: '#16211c',
    },
    error: {
      main: colors.danger,
      contrastText: '#ffffff',
    },
    background: {
      default: colors.surface,
      paper: colors.card,
    },
    text: {
      primary: colors.ink,
      secondary: colors.textMuted,
    },
    divider: colors.divider,
  },
  typography: {
    fontFamily: fonts.body,
    h1: { ...displayHeading, fontSize: '2.4rem', fontWeight: 700, lineHeight: 1.05 },
    h2: { ...displayHeading, fontSize: '1.65rem', fontWeight: 700, lineHeight: 1.1 },
    h3: { ...displayHeading, fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2 },
    h4: { ...displayHeading, fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.25 },
    h5: { ...displayHeading, fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 },
    h6: { fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1.4 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.4 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.55 },
    button: { fontSize: '0.875rem', fontWeight: 700, textTransform: 'none' },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.surface,
          WebkitFontSmoothing: 'antialiased',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radii.button,
          padding: '0.65rem 1.25rem',
          fontWeight: 700,
        },
        sizeLarge: { height: '3rem', fontSize: '0.9375rem', borderRadius: radii.button },
        containedPrimary: {
          background: gradients.cta,
          boxShadow: shadows.cta,
          '&:hover': {
            background: gradients.cta,
            boxShadow: shadows.cta,
            transform: 'translateY(-0.125rem)',
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg,${colors.orange},${colors.orangeBurnt})`,
          boxShadow: shadows.orange,
          '&:hover': { transform: 'translateY(-0.125rem)' },
        },
        outlined: {
          borderColor: colors.divider,
          color: colors.green,
          '&:hover': { borderColor: colors.greenBright, background: colors.mintTint },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: radii.card },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radii.card,
          boxShadow: shadows.card,
          border: `1px solid ${colors.cardBorder}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: radii.field,
            backgroundColor: '#fff',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9, fontWeight: 600 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 6, height: 8, backgroundColor: '#eef0ea' },
        bar: { borderRadius: 6 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.ink,
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '0.375rem 0.625rem',
        },
      },
    },
  },
});
