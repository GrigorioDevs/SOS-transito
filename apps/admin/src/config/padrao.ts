// ARQUIVO ÚNICO com os valores padrão da configuração.
// Uma empresa nova começa com estes valores e pode mudar tudo na tela de Configurações.
import type { ConfiguracoesAdmin } from './tipos';

// Versão do formato salvo. Suba quando mudar a estrutura de forma incompatível.
export const ESQUEMA_CONFIG = 1;

export const CONFIG_PADRAO: ConfiguracoesAdmin = {
  moderacao: {
    contagem: 'corridos',
    niveis: [
      { id: 'critico', nome: 'Crítico', cor: '#FF5252', ordem: 1, prazoDefesa: { valor: 10, unidade: 'dias' }, prazoDecisao: { valor: 2, unidade: 'dias' }, lembreteAntes: { valor: 1, unidade: 'dias' }, aoVencerDefesa: 'decidir_sem_defesa' },
      { id: 'medio', nome: 'Médio', cor: '#FFA940', ordem: 2, prazoDefesa: { valor: 7, unidade: 'dias' }, prazoDecisao: { valor: 5, unidade: 'dias' }, lembreteAntes: { valor: 1, unidade: 'dias' }, aoVencerDefesa: 'decidir_sem_defesa' },
      { id: 'baixo', nome: 'Baixo', cor: '#25C78A', ordem: 3, prazoDefesa: { valor: 5, unidade: 'dias' }, prazoDecisao: { valor: 10, unidade: 'dias' }, lembreteAntes: { valor: 1, unidade: 'dias' }, aoVencerDefesa: 'decidir_sem_defesa' },
    ],
  },
  categorias: [
    { id: 'ameaca', nome: 'Ameaça / agressividade', nivelId: 'critico', ativa: true },
    { id: 'assedio', nome: 'Assédio', nivelId: 'critico', ativa: true },
    { id: 'fraude', nome: 'Suspeita de fraude', nivelId: 'critico', ativa: true },
    { id: 'cobranca_indevida', nome: 'Cobrança indevida', nivelId: 'medio', ativa: true },
    { id: 'dano_veiculo', nome: 'Dano ao veículo', nivelId: 'medio', ativa: true },
    { id: 'nao_pagou', nome: 'Não pagou o serviço', nivelId: 'medio', ativa: true },
    { id: 'nao_compareceu', nome: 'Não compareceu', nivelId: 'baixo', ativa: true },
    { id: 'conduta', nome: 'Conduta inadequada', nivelId: 'baixo', ativa: true },
    { id: 'outros', nome: 'Outros', nivelId: 'baixo', ativa: true },
  ],
  sancoes: {
    catalogo: [
      { id: 'advertencia', nome: 'Advertência', tipo: 'advertencia', ativa: true },
      { id: 'susp3', nome: 'Suspensão 3 dias', tipo: 'suspensao', duracaoDias: 3, ativa: true },
      { id: 'susp7', nome: 'Suspensão 7 dias', tipo: 'suspensao', duracaoDias: 7, ativa: true },
      { id: 'susp30', nome: 'Suspensão 30 dias', tipo: 'suspensao', duracaoDias: 30, ativa: true },
      { id: 'bloqueio', nome: 'Bloqueio permanente', tipo: 'bloqueio_permanente', ativa: true },
      { id: 'reembolso', nome: 'Reembolso', tipo: 'reembolso', ativa: true },
    ],
    reincidencia: [
      { procedentes: 2, janelaDias: 90, sancaoId: 'susp7' },
      { procedentes: 3, janelaDias: 180, sancaoId: 'susp30' },
      { procedentes: 4, janelaDias: 365, sancaoId: 'bloqueio' },
    ],
    justificativaMin: 30,
    segundoAdminBloqueio: true,
    prazoRecurso: { valor: 7, unidade: 'dias' },
  },
  provas: {
    tiposAceitos: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    tamanhoMaxMB: 10,
    maxPorDenuncia: 10,
    guardaDias: 365,
  },
  metas: [
    { id: 'satisfacao', nome: 'Satisfação', unidade: '%', sentido: 'maior_melhor', limiteVerde: 80, limiteVermelho: 70 },
    { id: 'finalizacao', nome: 'Taxa de finalização', unidade: '%', sentido: 'maior_melhor', limiteVerde: 90, limiteVermelho: 80 },
    { id: 'insatisfacao', nome: 'Insatisfação', unidade: '%', sentido: 'menor_melhor', limiteVerde: 10, limiteVermelho: 15 },
    { id: 'cancelamento', nome: 'Cancelamentos', unidade: '%', sentido: 'menor_melhor', limiteVerde: 5, limiteVermelho: 8 },
    { id: 'churn_clientes', nome: 'Churn de clientes', unidade: '%', sentido: 'menor_melhor', limiteVerde: 5, limiteVermelho: 8 },
    { id: 'churn_prestadores', nome: 'Churn de prestadores', unidade: '%', sentido: 'menor_melhor', limiteVerde: 5, limiteVermelho: 10 },
    { id: 'casos_vencidos', nome: 'Casos vencidos', unidade: 'casos', sentido: 'menor_melhor', limiteVerde: 0, limiteVermelho: 5 },
    { id: 'tempo_resolucao', nome: 'Tempo médio de resolução', unidade: 'h', sentido: 'menor_melhor', limiteVerde: 24, limiteVermelho: 48 },
  ],
  retencao: {
    diasSemUsoParaSaida: 60,
    motivosSaida: [
      'Demora no atendimento', 'Preço alto', 'Problema com prestador', 'Não precisa mais',
      'Poucos pedidos', 'Taxa da plataforma', 'Clientes problemáticos', 'Demora no repasse', 'Outros',
    ],
  },
  avaliacoes: { notaAlertaRevisao: 1, notaInsatisfeito: 2, notaSatisfeito: 4 },
  organizacao: { nomeEmpresa: 'SOS Trânsito', fusoHorario: 'America/Sao_Paulo', formatoData: 'dd/MM/yyyy' },
  versao: 1,
  atualizadoEm: '',
  atualizadoPor: 'Padrão do sistema',
};

// Opções exibidas na tela (não são regras de negócio).
export const TIPOS_ARQUIVO = [
  { mime: 'image/jpeg', rotulo: 'JPG' },
  { mime: 'image/png', rotulo: 'PNG' },
  { mime: 'image/webp', rotulo: 'WEBP' },
  { mime: 'image/heic', rotulo: 'HEIC' },
  { mime: 'application/pdf', rotulo: 'PDF' },
  { mime: 'video/mp4', rotulo: 'MP4' },
];

export const FUSOS = [
  'America/Sao_Paulo', 'America/Manaus', 'America/Belem', 'America/Fortaleza', 'America/Recife',
  'America/Cuiaba', 'America/Porto_Velho', 'America/Rio_Branco', 'America/Noronha', 'UTC',
];

export const FORMATOS_DATA = ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];

export const ROTULO_AO_VENCER: Record<string, string> = {
  decidir_sem_defesa: 'Seguir para decisão sem defesa',
  escalar: 'Escalar para outro admin',
  arquivar: 'Arquivar',
};

export const ROTULO_TIPO_SANCAO: Record<string, string> = {
  advertencia: 'Advertência',
  suspensao: 'Suspensão',
  bloqueio_permanente: 'Bloqueio permanente',
  reembolso: 'Reembolso',
};
