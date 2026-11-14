import { Routes, Route, Link as RouterLink, useLocation } from 'react-router';
import { Box, Container, Typography, Stack, Button, BottomNavigation, BottomNavigationAction, Paper, Alert } from '@mui/material';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import HelpOutline from '@mui/icons-material/HelpOutline';
import CatalogoPage from './features/catalogo/CatalogoPage.jsx';

export default function App() {
  const location = useLocation();
  const inicio = <Stack spacing={3}><Box sx={{ p: 3, borderRadius: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}><Typography variant="overline">SOS TRÂNSITO · ADMIN</Typography><Typography component="h1" variant="h4" sx={{ my: 2 }}>Catálogo da operação</Typography><Button component={RouterLink} to="/servicos" variant="contained" sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#EAEAEA' } }}>Consultar serviços</Button></Box><Typography component="h2" variant="h6">Serviços automotivos</Typography><CatalogoPage /></Stack>;
  return <Container maxWidth="md" sx={{ pt: 3, pb: 14 }}>
    <Routes>
      <Route path="/" element={inicio} />
      <Route path="/servicos" element={<Stack spacing={3}><Typography component="h1" variant="h4">Serviços disponíveis</Typography><CatalogoPage /></Stack>} />
      <Route path="/ajuda" element={<Stack spacing={3}><Typography component="h1" variant="h4">Sobre o SOS Trânsito</Typography><Typography>Uma plataforma para conectar motoristas a profissionais de socorro automotivo.</Typography><Alert severity="warning">Versão inicial de demonstração. Solicitações e pagamentos ainda não estão disponíveis.</Alert></Stack>} />
      <Route path="*" element={<Stack spacing={2}><Typography variant="h4">Página não encontrada</Typography><Button component={RouterLink} to="/">Voltar ao início</Button></Stack>} />
    </Routes>
    <Paper component="nav" aria-label="Navegação principal" elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, pb: 'env(safe-area-inset-bottom)' }}>
      <BottomNavigation showLabels value={location.pathname}>
        <BottomNavigationAction component={RouterLink} to="/" value="/" label="Início" icon={<HomeOutlined />} />
        <BottomNavigationAction component={RouterLink} to="/servicos" value="/servicos" label="Serviços" icon={<BuildOutlined />} />
        <BottomNavigationAction component={RouterLink} to="/ajuda" value="/ajuda" label="Ajuda" icon={<HelpOutline />} />
      </BottomNavigation>
    </Paper>
  </Container>;
}
