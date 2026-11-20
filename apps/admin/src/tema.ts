// Tema MUI do painel admin (escuro, com a paleta oficial do SOS Trânsito).
// Só o admin usa este tema; o @sos/ui continua igual para os outros apps.
import { createTheme } from '@mui/material/styles';

export const temaAdmin = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FFC928', light: '#FFE078', dark: '#FFB300', contrastText: '#111111' },
    secondary: { main: '#5AA8FF' },
    error: { main: '#FF5252', dark: '#D62828' },
    warning: { main: '#FFA940' },
    success: { main: '#25C78A' },
    background: { default: '#081525', paper: '#10243B' },
    text: { primary: '#F5F7FA', secondary: '#8494A7' },
    divider: '#29435E',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiMenu: { styleOverrides: { paper: { backgroundColor: '#193653' } } },
  },
});
