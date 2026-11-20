// Fonte única dos itens de navegação (menu lateral, barra inferior e títulos das rotas).
import type { NomeIcone } from '../layouts/components/graficos';

export type ChaveBadge = 'denuncias' | 'bloqueios' | 'avaliacoes';

export interface ItemMenu {
  rota: string;
  rotulo: string;
  icone: NomeIcone;
  badge?: ChaveBadge;
  noCelular: boolean; // true = aparece direto na barra inferior; false = fica no "Mais"
}

export const MENU: ItemMenu[] = [
  { rota: '/visao-geral', rotulo: 'Visão geral', icone: 'dash', noCelular: true },
  { rota: '/denuncias', rotulo: 'Denúncias', icone: 'alert', badge: 'denuncias', noCelular: true },
  { rota: '/usuarios', rotulo: 'Usuários', icone: 'users', noCelular: true },
  { rota: '/bloqueios', rotulo: 'Bloqueios', icone: 'x', badge: 'bloqueios', noCelular: false },
  { rota: '/retencao', rotulo: 'Retenção', icone: 'wallet', noCelular: true },
  { rota: '/avaliacoes', rotulo: 'Avaliações', icone: 'check', badge: 'avaliacoes', noCelular: false },
  { rota: '/auditoria', rotulo: 'Auditoria', icone: 'history', noCelular: false },
  { rota: '/configuracoes', rotulo: 'Configurações', icone: 'cog', noCelular: false },
];

export const tituloDa = (rota: string) => MENU.find((m) => m.rota === rota)?.rotulo ?? '';
