import { createTheme } from '@mui/material/styles';

// A cor tem significado: preto = acao; amarelo = atencao;
// vermelho = falha critica; verde = confirmacao.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#171717', contrastText: '#FFFFFF' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
    text: { primary: '#171717', secondary: '#595959' },
    warning: { main: '#F5C400', dark: '#806600', contrastText: '#171717' },
    error: { main: '#B42318', contrastText: '#FFFFFF' },
    success: { main: '#18794E', contrastText: '#FFFFFF' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Arial, sans-serif',
    h4: { fontWeight: 700, fontSize: '2rem' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 48 } } },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderColor: '#E3E3E3' } } },
  },
});
