// Casca do painel: menu lateral + topo + <Outlet /> + barra inferior no celular.
// Montada uma vez; só o conteúdo do <Outlet /> troca entre as telas.
import '../layouts/PainelPage.css';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatches } from 'react-router';
import { Divider, ListItemText, Menu, MenuItem } from '@mui/material';
import logo from '../../assets/logo-sos-transito.png';
import { Ic } from '../layouts/components/graficos';
import { USUARIO_ATUAL, usePendencias, useRestaurarDemonstracao } from '../../api/hooks';
import { useConfiguracoes } from '../../config/hooks';
import { useConfirmacao } from '../../components/ConfirmarAcao';
import { MENU, type ChaveBadge } from './menu';

export interface HandleRota { titulo: string; subtitulo?: string }

const classe = ({ isActive }: { isActive: boolean }) => `nav${isActive ? ' on' : ''}`;
const ROTULO_BADGE: Record<ChaveBadge, string> = { denuncias: 'abertas', bloqueios: 'para decidir', avaliacoes: 'para revisar' };

export default function AdminLayout() {
  const matches = useMatches();
  const { pathname } = useLocation();
  const handle = [...matches].reverse().find((m) => (m.handle as HandleRota | undefined)?.titulo)?.handle as HandleRota | undefined;
  const { data: pend } = usePendencias();
  const { data: cfg } = useConfiguracoes();
  const restaurar = useRestaurarDemonstracao();
  const confirmar = useConfirmacao();
  const [mais, setMais] = useState<HTMLElement | null>(null);
  const [conta, setConta] = useState<HTMLElement | null>(null);

  const badges: Record<ChaveBadge, number> = { denuncias: pend?.denuncias ?? 0, bloqueios: pend?.bloqueios ?? 0, avaliacoes: pend?.avaliacoes ?? 0 };
  const empresa = cfg?.organizacao.nomeEmpresa ?? '';

  useEffect(() => {
    document.title = [handle?.titulo, empresa ? `${empresa} Admin` : 'Admin'].filter(Boolean).join(' · ');
  }, [handle?.titulo, empresa]);
  useEffect(() => { document.querySelector('main')?.scrollTo?.(0, 0); window.scrollTo(0, 0); }, [pathname]);

  const extras = MENU.filter((m) => !m.noCelular);
  const maisAtivo = extras.some((m) => pathname.startsWith(m.rota));
  const nMais = extras.reduce((s, m) => s + (m.badge ? badges[m.badge] : 0), 0);

  const avatar = (
    <button type="button" className="av" aria-label={`Conta de ${USUARIO_ATUAL}`} aria-haspopup="menu" aria-expanded={Boolean(conta)} onClick={(e) => setConta(e.currentTarget)}>
      {USUARIO_ATUAL[0]}
    </button>
  );

  const pedirRestauracao = () => {
    setConta(null);
    confirmar.pedir({
      titulo: 'Restaurar os dados de demonstração?', rotulo: 'Restaurar', semJustificativa: true, perigo: true,
      sucesso: 'Dados de demonstração restaurados.',
      descricao: 'Denúncias, usuários, bloqueios e avaliações voltam ao estado inicial, com datas relativas a agora. As configurações e os registros de auditoria gravados no servidor não mudam.',
      executar: () => restaurar.mutateAsync(undefined),
    });
  };

  return (
    <div className="ly-g2">
      <a href="#conteudo" className="pular">Pular para o conteúdo</a>
      <div className="app">
        <aside>
          <div className="logo"><img src={logo} alt="SOS Trânsito" /><span>Admin</span></div>
          <nav aria-label="Menu principal" className="side">
            {MENU.map((m) => {
              const n = m.badge ? badges[m.badge] : 0;
              return (
                <NavLink key={m.rota} to={m.rota} className={classe} title={m.rotulo}>
                  <Ic n={m.icone} /><span>{m.rotulo}</span>
                  {n > 0 && <b className="b" aria-label={`${n} ${ROTULO_BADGE[m.badge!]}`}>{n}</b>}
                </NavLink>
              );
            })}
          </nav>
          {empresa && <div className="org">{empresa}</div>}
        </aside>
        <div className="mtop"><div className="logo"><img src={logo} alt="SOS Trânsito" /><span>Admin</span></div>{avatar}</div>
        <main id="conteudo" tabIndex={-1}>
          <header>
            <div><h1>{handle?.titulo}</h1>{handle?.subtitulo && <div className="s">{handle.subtitulo}</div>}</div>
            {avatar}
          </header>
          <Outlet />
        </main>
        <nav className="bnav" aria-label="Navegação inferior">
          {MENU.filter((m) => m.noCelular).map((m) => {
            const n = m.badge ? badges[m.badge] : 0;
            return (
              <NavLink key={m.rota} to={m.rota} className={({ isActive }) => (isActive ? 'on' : '')}>
                <Ic n={m.icone} />{n > 0 && <span className="bd" aria-label={`${n} ${ROTULO_BADGE[m.badge!]}`}>{n}</span>}{m.rotulo}
              </NavLink>
            );
          })}
          <button type="button" className={maisAtivo ? 'on' : ''} aria-haspopup="menu" aria-expanded={Boolean(mais)} onClick={(e) => setMais(e.currentTarget)}>
            <Ic n="menu" />{nMais > 0 && <span className="bd" aria-label={`${nMais} pendências`}>{nMais}</span>}Mais
          </button>
        </nav>
        <Menu anchorEl={mais} open={Boolean(mais)} onClose={() => setMais(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          {extras.map((m) => {
            const n = m.badge ? badges[m.badge] : 0;
            return (
              <MenuItem key={m.rota} component={NavLink} to={m.rota} onClick={() => setMais(null)} selected={pathname.startsWith(m.rota)}>
                <ListItemText>{m.rotulo}</ListItemText>{n > 0 && <b style={{ marginLeft: 16, color: '#FFC928' }}>{n}</b>}
              </MenuItem>
            );
          })}
        </Menu>
        <Menu anchorEl={conta} open={Boolean(conta)} onClose={() => setConta(null)}>
          <MenuItem disabled><ListItemText primary={USUARIO_ATUAL} secondary="Administrador" /></MenuItem>
          <Divider />
          <MenuItem onClick={pedirRestauracao}>Restaurar dados de demonstração</MenuItem>
        </Menu>
        {confirmar.dialogo}
      </div>
    </div>
  );
}
