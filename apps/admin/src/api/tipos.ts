// Contrato dos dados do painel admin. Quando a API existir, estes tipos devem
// sair do OpenAPI (@sos/api-client); as telas continuam iguais.
import type { AoVencerDefesa, Contagem, Duracao, TipoSancao } from '../config/tipos';

export type Saude = 'r' | 'y' | 'g'; // r = crítico, y = atenção, g = saudável
export type Segmento = 'todos' | 'clientes' | 'prestadores';
export type TipoUsuario = 'cliente' | 'prestador';
export type TipoProva = 'foto' | 'chat' | 'gps';

export interface Kpi {
  id: string;
  label: string;
  value: string;
  sub: string;
  saude?: Saude;
  metaId?: string;
  spark?: number[];
}

export interface Pagina<T> { itens: T[]; total: number }

/* -------------------------------- Usuários -------------------------------- */

export interface Usuario {
  id: string;
  nome: string;
  tipo: TipoUsuario;
  servico?: string; // só prestadores
  cidade: string;
  email: string;
  telefone: string;
  criadoEm: string;
  ultimoUsoEm: string;
  chamados: number;
  notaMedia: number | null;
  motivoSaida?: string; // resposta da pesquisa de saída, quando houver
}

export type StatusUsuario = 'ativo' | 'suspenso' | 'bloqueado' | 'inativo';

export interface UsuarioResumo extends Usuario {
  status: StatusUsuario;
  saiuEm?: string; // último uso + dias sem uso (configuração)
  suspensoAte?: string;
}

export interface PerfilUsuario {
  usuario: UsuarioResumo;
  sancoes: SancaoAplicada[];
  casosRecebidos: Caso[];
  casosFeitos: Caso[];
  avaliacoesRecebidas: Avaliacao[];
  procedentes: string[];
}

export interface FiltroUsuarios {
  busca?: string;
  segmento?: Segmento;
  status?: StatusUsuario | 'todos';
  pagina?: number;
  porPagina?: number;
}

/* -------------------------------- Denúncias -------------------------------- */

export type StatusCaso = 'novo' | 'em_analise' | 'aguardando' | 'aguardando_2a' | 'resolvido';

// Prazos copiados da configuração quando o caso é aberto (snapshot, não retroativo).
export interface PrazosCaso {
  contagem: Contagem;
  defesa: Duracao;
  decisao: Duracao;
  lembrete: Duracao;
  aoVencerDefesa: AoVencerDefesa;
}

export interface BloqueioPendente {
  sancaoId: string;
  sancaoNome: string;
  solicitadoPor: string;
  solicitadoEm: string;
  justificativa: string;
}

export interface Caso {
  id: string;
  categoriaId: string;
  categoria: string; // nome da categoria quando o caso foi aberto
  denuncianteId?: string;
  denunciante: string;
  denuncianteTipo: string;
  denunciadoId: string;
  denunciado: string;
  denunciadoTipo: string;
  chamado: string;
  provas: TipoProva[];
  status: StatusCaso;
  relato: string;
  criadoEm: string;
  nivelId: string;
  versaoConfig: number;
  prazos: PrazosCaso;
  decisaoAte: string;
  defesaSolicitadaEm?: string;
  defesaAte?: string;
  defesa?: { texto: string; em: string };
  escaladoPara?: string;
  bloqueioPendente?: BloqueioPendente;
  procedentes: string[]; // preenchido na leitura: decisões procedentes contra o denunciado
  decisao?: string;
  decididoPor?: string;
  justificativaDecisao?: string;
  resolvidoEm?: string;
}

/* -------------------------- Sanções (bloqueios) -------------------------- */

// pendente_2a: bloqueio permanente esperando o 2º admin.
// ativa: suspensão/bloqueio valendo. encerrada: cumprida (ou advertência/reembolso).
export type StatusSancao = 'pendente_2a' | 'ativa' | 'encerrada' | 'revertida' | 'recusada';

export interface SancaoAplicada {
  id: string;
  usuarioId: string;
  usuario: string;
  usuarioTipo: TipoUsuario;
  sancaoId: string;
  sancaoNome: string;
  tipo: TipoSancao;
  duracaoDias?: number;
  casoId?: string;
  status: StatusSancao;
  solicitadoPor: string;
  solicitadoEm: string;
  justificativa: string;
  aprovadoPor?: string;
  aplicadaEm?: string;
  ate?: string;        // fim da suspensão
  recursoAte?: string; // prazo de recurso gravado ao aplicar
  recurso?: { texto: string; em: string };
  recursoDecisao?: 'mantida' | 'revertida';
  encerradaEm?: string;
  revertidaPor?: string;
  revertidaEm?: string;
  motivoReversao?: string;
}

export type AbaSancoes = 'ativas' | 'pendentes' | 'historico';

/* -------------------------------- Avaliações -------------------------------- */

export type StatusAvaliacao = 'publicada' | 'oculta';

export interface Avaliacao {
  id: string;
  chamado: string;
  autorId: string;
  autor: string;
  autorTipo: TipoUsuario;
  avaliadoId: string;
  avaliado: string;
  avaliadoTipo: TipoUsuario;
  nota: number;
  comentario: string;
  criadoEm: string;
  status: StatusAvaliacao;
  revisadaEm?: string;
  revisadaPor?: string;
  motivoRevisao?: string;
}

export interface FiltroAvaliacoes {
  busca?: string;
  segmento?: Segmento; // por quem escreveu
  nota?: number | 'todas';
  situacao?: 'todas' | 'revisao' | 'publicada' | 'oculta';
  pagina?: number;
  porPagina?: number;
}

export interface ResumoAvaliacoes {
  total: number;
  media: number;
  notas: { estrelas: number; qtd: number; pct: number }[];
  satisfacao: number;
  insatisfacao: number;
  emRevisao: number;
  janelaDias: number;
}

/* -------------------------------- Retenção -------------------------------- */

export interface MotivoSaida { motivo: string; qtd: number; pct: number }

export interface Retencao {
  segmento: Segmento;
  semanas: string[];
  entradas: number[];
  saidas: number[];
  novos7d: number;
  saidas7d: number;
  novosVariacao: number | null; // % vs semana anterior
  churnClientes: number;
  churnPrestadores: number;
  churn: number;
  baseAtiva: number;
  diasSemUso: number;
  motivos: MotivoSaida[];
  semResposta: number;
  recentes: UsuarioResumo[];
}

/* -------------------------------- Operação -------------------------------- */

export interface ChamadosSemana { inicio: string; total: number; concluidos: number; cancelados: number }

/* -------------------------------- Auditoria -------------------------------- */

export type AreaAuditoria = 'denuncia' | 'usuario' | 'bloqueio' | 'avaliacao' | 'sistema' | 'configuracao';

export interface EventoAuditoria {
  id: string;
  quando: string;
  quem: string;
  area: AreaAuditoria;
  acao: string;    // o quê
  alvo?: string;   // sobre quem/o quê
  motivo?: string; // por quê (justificativa)
  ref?: string;    // caso, usuário ou sanção relacionado
}

export interface FiltroAuditoria { busca?: string; area?: AreaAuditoria | 'todas'; quem?: string; dias?: number }

/* ------------------------------ Visão geral ------------------------------ */

// Números brutos. A saúde (semáforo) é calculada na tela com as metas da configuração.
export interface PainelGovernanca {
  segmento: Segmento;
  semanas: string[];
  entradas: number[];
  saidas: number[];
  motivos: MotivoSaida[];
  notas: { estrelas: number; pct: number }[];
  satisfacao: number;
  insatisfacao: number;
  avaliacoesEmRevisao: number;
  bloqueios: { ativos: number; suspensos: number; revertidos: number; pendentes: number };
  reclamacoesAbertas: number;
  reclamacoesHoje: number;
  finalizacao: number;
  cancelamento: number;
  churn: number;
  churnClientes: number;
  churnPrestadores: number;
  tempoResolucaoH: number | null;
  novos7d: number;
  saidas7d: number;
  novosVariacao: number | null;
}

export interface Pendencias { denuncias: number; bloqueios: number; avaliacoes: number }
