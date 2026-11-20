// API FICTÍCIA da Visão geral e das pendências do menu.
// Back-end: GET /api/admin/painel?segmento=, GET /api/admin/pendencias.
import { db } from './armazenamento';
import { calcularResumo, precisaRevisao } from './avaliacoes';
import { DIA, HORA } from './dominio';
import { configAtual, processarVencimentos, rede } from './nucleo';
import { calcularRetencao } from './retencao';
import type { Caso, PainelGovernanca, Pendencias, Segmento } from './tipos';

const doSegmento = (c: Caso, s: Segmento) =>
  s === 'todos' || (s === 'clientes' ? c.denuncianteTipo === 'Cliente' : c.denuncianteTipo === 'Prestador');

export async function buscarPainelGovernanca(segmento: Segmento): Promise<PainelGovernanca> {
  await rede();
  processarVencimentos();
  const b = db();
  const cfg = configAtual();
  const agora = Date.now();
  const ret = calcularRetencao(b.usuarios, cfg, segmento, agora);
  const aval = calcularResumo(b.avaliacoes, cfg, segmento, 30, agora);
  const casos = b.casos.filter((c) => doSegmento(c, segmento));
  const resolvidos = casos.filter((c) => c.resolvidoEm && new Date(c.resolvidoEm).getTime() >= agora - 30 * DIA);
  const tempo = resolvidos.length
    ? Math.round(resolvidos.reduce((s, c) => s + (new Date(c.resolvidoEm!).getTime() - new Date(c.criadoEm).getTime()) / HORA, 0) / resolvidos.length)
    : null;
  const semana = b.chamadosSemana[b.chamadosSemana.length - 1];
  const pct = (a: number, t: number) => (t ? Math.round((a / t) * 1000) / 10 : 0);
  const contar = (f: (s: (typeof b.sancoes)[number]) => boolean) => b.sancoes.filter(f).length;
  return {
    segmento,
    semanas: ret.semanas,
    entradas: ret.entradas,
    saidas: ret.saidas,
    motivos: ret.motivos,
    notas: aval.notas.map(({ estrelas, pct: p }) => ({ estrelas, pct: p })),
    satisfacao: aval.satisfacao,
    insatisfacao: aval.insatisfacao,
    avaliacoesEmRevisao: aval.emRevisao,
    bloqueios: {
      ativos: contar((s) => s.status === 'ativa' && s.tipo === 'bloqueio_permanente'),
      suspensos: contar((s) => s.status === 'ativa' && s.tipo === 'suspensao'),
      revertidos: contar((s) => s.status === 'revertida'),
      pendentes: contar((s) => s.status === 'pendente_2a'),
    },
    reclamacoesAbertas: casos.filter((c) => c.status !== 'resolvido').length,
    reclamacoesHoje: casos.filter((c) => new Date(c.criadoEm).getTime() >= agora - DIA).length,
    finalizacao: pct(semana.concluidos, semana.total),
    cancelamento: pct(semana.cancelados, semana.total),
    churn: ret.churn,
    churnClientes: ret.churnClientes,
    churnPrestadores: ret.churnPrestadores,
    tempoResolucaoH: tempo,
    novos7d: ret.novos7d,
    saidas7d: ret.saidas7d,
    novosVariacao: ret.novosVariacao,
  };
}

// Números dos selos do menu.
export async function buscarPendencias(): Promise<Pendencias> {
  await rede(150);
  processarVencimentos();
  const b = db();
  const cfg = configAtual();
  return {
    denuncias: b.casos.filter((c) => c.status !== 'resolvido').length,
    bloqueios: b.sancoes.filter((s) => s.status === 'pendente_2a' || (s.status === 'ativa' && s.recurso && !s.recursoDecisao)).length,
    avaliacoes: b.avaliacoes.filter((a) => precisaRevisao(a, cfg)).length,
  };
}
