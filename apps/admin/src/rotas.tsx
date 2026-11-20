// Rotas do painel admin (React Router em modo de dados — necessário para o useBlocker).
import type { ReactElement } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import AdminLayout from './features/painel/AdminLayout';
import NaoEncontrada from './features/painel/NaoEncontrada';
import { tituloDa } from './features/painel/menu';
import PainelPage from './features/layouts/PainelPage';
import ConfiguracoesPage from './features/configuracoes/ConfiguracoesPage';
import DenunciasPage from './features/denuncias/DenunciasPage';
import UsuariosPage from './features/usuarios/UsuariosPage';
import BloqueiosPage from './features/bloqueios/BloqueiosPage';
import RetencaoPage from './features/retencao/RetencaoPage';
import AvaliacoesPage from './features/avaliacoes/AvaliacoesPage';
import AuditoriaPage from './features/auditoria/AuditoriaPage';

const tela = (rota: string, element: ReactElement, subtitulo: string) => ({ path: rota.slice(1), element, handle: { titulo: tituloDa(rota), subtitulo } });

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/visao-geral" replace /> },
      { path: 'visao-geral', element: <PainelPage />, handle: { titulo: tituloDa('/visao-geral'), subtitulo: 'Saúde do app e moderação' } },
      tela('/denuncias', <DenunciasPage />, 'Fila de moderação com prazos e decisões'),
      tela('/usuarios', <UsuariosPage />, 'Clientes e prestadores'),
      tela('/bloqueios', <BloqueiosPage />, 'Suspensões, bloqueios, 2ª aprovação e recursos'),
      tela('/retencao', <RetencaoPage />, 'Entradas, saídas e churn'),
      tela('/avaliacoes', <AvaliacoesPage />, 'Notas, satisfação e moderação de comentários'),
      tela('/auditoria', <AuditoriaPage />, 'Quem fez o quê, quando e por quê'),
      { path: 'configuracoes', element: <ConfiguracoesPage />, handle: { titulo: tituloDa('/configuracoes'), subtitulo: 'Regras e políticas desta empresa' } },
      // Endereços antigos
      { path: 'servicos', element: <Navigate to="/configuracoes?aba=servicos" replace /> },
      { path: 'layouts/*', element: <Navigate to="/visao-geral" replace /> },
      { path: '*', element: <NaoEncontrada />, handle: { titulo: 'Página não encontrada' } },
    ],
  },
]);
