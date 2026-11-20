// Tipos do objeto de configuração do admin.
// Cada empresa que usa o software tem a sua configuração (depois: GET/PUT /api/admin/configuracoes).

export type Unidade = 'horas' | 'dias';
export interface Duracao { valor: number; unidade: Unidade }

// Prazos em horas contam sempre corridos. Dias úteis = segunda a sexta (feriados depois).
export type Contagem = 'corridos' | 'uteis';
export type AoVencerDefesa = 'decidir_sem_defesa' | 'escalar' | 'arquivar';

export interface NivelCriticidade {
  id: string;
  nome: string;
  cor: string;          // hexadecimal, ex.: #FF5252
  ordem: number;        // 1 = mais grave
  prazoDefesa: Duracao; // para o denunciado apresentar defesa/provas
  prazoDecisao: Duracao; // SLA do admin para decidir
  lembreteAntes: Duracao;
  aoVencerDefesa: AoVencerDefesa;
}

export interface CategoriaDenuncia { id: string; nome: string; nivelId: string; ativa: boolean }

export type TipoSancao = 'advertencia' | 'suspensao' | 'bloqueio_permanente' | 'reembolso';
export interface Sancao { id: string; nome: string; tipo: TipoSancao; duracaoDias?: number; ativa: boolean }

// N decisões procedentes (qualquer decisão diferente de arquivar) em X dias → sanção sugerida.
export interface RegraReincidencia { procedentes: number; janelaDias: number; sancaoId: string }

export type Sentido = 'maior_melhor' | 'menor_melhor';
export type UnidadeMeta = '%' | 'h' | 'casos';
export interface MetaIndicador {
  id: string;
  nome: string;
  unidade: UnidadeMeta;
  sentido: Sentido;
  limiteVerde: number;    // a partir daqui é verde
  limiteVermelho: number; // além daqui é vermelho; entre os dois, amarelo
}

export interface ConfiguracoesAdmin {
  moderacao: { contagem: Contagem; niveis: NivelCriticidade[] };
  categorias: CategoriaDenuncia[];
  sancoes: {
    catalogo: Sancao[];
    reincidencia: RegraReincidencia[];
    justificativaMin: number;
    segundoAdminBloqueio: boolean;
    prazoRecurso: Duracao;
  };
  provas: { tiposAceitos: string[]; tamanhoMaxMB: number; maxPorDenuncia: number; guardaDias: number };
  metas: MetaIndicador[];
  retencao: { diasSemUsoParaSaida: number; motivosSaida: string[] };
  // alerta ≤ insatisfeito < satisfeito. Entre insatisfeito e satisfeito = neutro.
  avaliacoes: { notaAlertaRevisao: number; notaInsatisfeito: number; notaSatisfeito: number };
  organizacao: { nomeEmpresa: string; fusoHorario: string; formatoData: string };
  versao: number;
  atualizadoEm: string;
  atualizadoPor: string;
}

export interface AlteracaoConfig {
  id: string;
  quando: string;
  quem: string;
  versao: number;
  campo: string;
  anterior: string;
  novo: string;
}

// caminho do campo (ex.: "moderacao.niveis.0.nome") → mensagem
export type ErrosConfig = Record<string, string>;
