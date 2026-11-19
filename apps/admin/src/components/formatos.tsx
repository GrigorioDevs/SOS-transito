// Formatação e selos reutilizados pelas telas (datas relativas, estrelas, status).
import { Chip, Tooltip, type ChipProps } from '@mui/material';
import { useConfiguracoes } from '../config/hooks';
import { formatarData } from '../config/regras';
import type { StatusCaso, StatusSancao, StatusUsuario } from '../api/tipos';

// "há 3 dias", "em 5h", "agora"
export function relativo(iso: string, agora = Date.now()) {
  const ms = new Date(iso).getTime() - agora;
  const min = Math.round(Math.abs(ms) / 60_000);
  if (min < 1) return 'agora';
  let t: string;
  if (min < 60) t = `${min} min`;
  else if (min < 60 * 24) t = `${Math.round(min / 60)}h`;
  else if (min < 60 * 24 * 30) { const d = Math.round(min / 1440); t = `${d} dia${d > 1 ? 's' : ''}`; }
  else if (min < 60 * 24 * 365) { const m = Math.round(min / 43_200); t = `${m} ${m > 1 ? 'meses' : 'mês'}`; }
  else { const a = Math.round(min / 525_600); t = `${a} ano${a > 1 ? 's' : ''}`; }
  return ms > 0 ? `em ${t}` : `há ${t}`;
}

// Data relativa com a data completa (fuso e formato da organização) no title.
export function Quando({ iso, absoluta = false }: { iso?: string; absoluta?: boolean }) {
  const { data: cfg } = useConfiguracoes();
  if (!iso) return <>—</>;
  const completa = cfg ? formatarData(iso, cfg) : new Date(iso).toLocaleString('pt-BR');
  return <time dateTime={iso} title={completa}>{absoluta ? completa : relativo(iso)}</time>;
}

// Busca sem diferenciar acentos e maiúsculas.
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const numero = (n: number, casas = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: casas });

export function Estrelas({ nota }: { nota: number }) {
  return (
    <span role="img" aria-label={`${nota} de 5 estrelas`} style={{ color: '#FFC928', letterSpacing: 1, whiteSpace: 'nowrap' }}>
      {'★'.repeat(nota)}<span style={{ color: '#3B5472' }}>{'★'.repeat(5 - nota)}</span>
    </span>
  );
}

type Cor = ChipProps['color'];
const selo = (rotulo: string, cor: Cor, dica?: string) => {
  const c = <Chip size="small" label={rotulo} color={cor} variant={cor === 'default' ? 'outlined' : 'filled'} sx={{ fontWeight: 700, height: 22 }} />;
  return dica ? <Tooltip title={dica}>{c}</Tooltip> : c;
};

export const ROTULO_CASO: Record<StatusCaso, string> = {
  novo: 'Novo', em_analise: 'Em análise', aguardando: 'Aguardando defesa', aguardando_2a: 'Aguardando 2ª aprovação', resolvido: 'Resolvido',
};
const COR_CASO: Record<StatusCaso, Cor> = { novo: 'error', em_analise: 'secondary', aguardando: 'warning', aguardando_2a: 'warning', resolvido: 'success' };
export const SeloCaso = ({ s }: { s: StatusCaso }) => selo(ROTULO_CASO[s], COR_CASO[s]);

export const ROTULO_USUARIO: Record<StatusUsuario, string> = { ativo: 'Ativo', suspenso: 'Suspenso', bloqueado: 'Bloqueado', inativo: 'Saiu (inativo)' };
const COR_USUARIO: Record<StatusUsuario, Cor> = { ativo: 'success', suspenso: 'warning', bloqueado: 'error', inativo: 'default' };
export const SeloUsuario = ({ s }: { s: StatusUsuario }) => selo(ROTULO_USUARIO[s], COR_USUARIO[s]);

export const ROTULO_SANCAO: Record<StatusSancao, string> = {
  pendente_2a: 'Aguardando 2ª aprovação', ativa: 'Ativa', encerrada: 'Encerrada', revertida: 'Revertida', recusada: 'Recusada',
};
const COR_SANCAO: Record<StatusSancao, Cor> = { pendente_2a: 'warning', ativa: 'error', encerrada: 'default', revertida: 'secondary', recusada: 'default' };
export const SeloSancao = ({ s }: { s: StatusSancao }) => selo(ROTULO_SANCAO[s], COR_SANCAO[s]);

export const tipoUsuario = (t: 'cliente' | 'prestador', servico?: string) => (t === 'prestador' ? `Prestador${servico ? ` · ${servico}` : ''}` : 'Cliente');
