// API FICTÍCIA de avaliações (notas e comentários).
// Back-end: GET /api/admin/avaliacoes, GET /api/admin/avaliacoes/resumo, POST /api/admin/avaliacoes/{id}/moderacao.
import { db, persistir } from './armazenamento';
import { DIA, normalizar } from './dominio';
import { USUARIO_ATUAL, configAtual, exigirJustificativa, rede, registrar } from './nucleo';
import type { ConfiguracoesAdmin } from '../config/tipos';
import type { Avaliacao, FiltroAvaliacoes, Pagina, ResumoAvaliacoes, Segmento } from './tipos';

const doSegmento = (a: Avaliacao, s?: Segmento) =>
  !s || s === 'todos' || (s === 'clientes' ? a.autorTipo === 'cliente' : a.autorTipo === 'prestador');

// Precisa de revisão: nota até o limite de alerta da configuração e ainda não revisada.
export const precisaRevisao = (a: Avaliacao, cfg: ConfiguracoesAdmin) => a.nota <= cfg.avaliacoes.notaAlertaRevisao && !a.revisadaEm;

// Cálculo puro (também usado pela Visão geral).
export function calcularResumo(lista: Avaliacao[], cfg: ConfiguracoesAdmin, segmento: Segmento, dias: number, agora = Date.now()): ResumoAvaliacoes {
  const desde = agora - dias * DIA;
  const periodo = lista.filter((a) => doSegmento(a, segmento) && new Date(a.criadoEm).getTime() >= desde);
  const total = periodo.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
  const notas = [5, 4, 3, 2, 1].map((e) => {
    const qtd = periodo.filter((a) => a.nota === e).length;
    return { estrelas: e, qtd, pct: pct(qtd) };
  });
  return {
    total,
    media: total ? Math.round((periodo.reduce((s, a) => s + a.nota, 0) / total) * 10) / 10 : 0,
    notas,
    satisfacao: pct(periodo.filter((a) => a.nota >= cfg.avaliacoes.notaSatisfeito).length),
    insatisfacao: pct(periodo.filter((a) => a.nota <= cfg.avaliacoes.notaInsatisfeito).length),
    emRevisao: lista.filter((a) => doSegmento(a, segmento) && precisaRevisao(a, cfg)).length,
    janelaDias: dias,
  };
}

export async function resumoAvaliacoes(segmento: Segmento, dias: number): Promise<ResumoAvaliacoes> {
  await rede(250);
  return calcularResumo(db().avaliacoes, configAtual(), segmento, dias);
}

export async function listarAvaliacoes(f: FiltroAvaliacoes = {}): Promise<Pagina<Avaliacao>> {
  await rede();
  const cfg = configAtual();
  const termo = normalizar(f.busca?.trim() ?? '');
  const lista = db().avaliacoes
    .filter((a) => doSegmento(a, f.segmento))
    .filter((a) => f.nota === undefined || f.nota === 'todas' || a.nota === f.nota)
    .filter((a) => {
      switch (f.situacao) {
        case 'revisao': return precisaRevisao(a, cfg);
        case 'publicada': return a.status === 'publicada';
        case 'oculta': return a.status === 'oculta';
        default: return true;
      }
    })
    .filter((a) => !termo || normalizar(`${a.autor} ${a.avaliado} ${a.comentario} ${a.chamado}`).includes(termo))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const porPagina = f.porPagina ?? 20;
  const pagina = f.pagina ?? 0;
  return { total: lista.length, itens: lista.slice(pagina * porPagina, (pagina + 1) * porPagina) };
}

export type AcaoAvaliacao = 'manter' | 'ocultar' | 'republicar';

export async function moderarAvaliacao(id: string, acao: AcaoAvaliacao, justificativa: string) {
  await rede();
  const just = exigirJustificativa(justificativa, configAtual());
  const a = db().avaliacoes.find((x) => x.id === id);
  if (!a) throw new Error('Avaliação não encontrada.');
  if (acao === 'ocultar' && a.status === 'oculta') throw new Error('Esta avaliação já está oculta.');
  if (acao === 'republicar' && a.status === 'publicada') throw new Error('Esta avaliação já está publicada.');
  a.status = acao === 'ocultar' ? 'oculta' : 'publicada';
  Object.assign(a, { revisadaEm: new Date().toISOString(), revisadaPor: USUARIO_ATUAL, motivoRevisao: just });
  const rotulo = { manter: 'Manteve avaliação publicada', ocultar: 'Ocultou avaliação', republicar: 'Republicou avaliação' }[acao];
  registrar('avaliacao', USUARIO_ATUAL, `${rotulo} (${a.nota}★)`, `${a.autor} → ${a.avaliado}`, just, a.id);
  persistir();
}
