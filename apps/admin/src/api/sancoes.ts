// API FICTÍCIA de bloqueios e suspensões (sanções aplicadas).
// Back-end: GET /api/admin/sancoes?aba=, POST /api/admin/sancoes/{id}/reverter|aprovar|recusar|recurso.
import { db, persistir } from './armazenamento';
import {
  aprovadorDe, configAtual, decidirPendente, exigirJustificativa, processarVencimentos, rede, registrar, reverter, USUARIO_ATUAL,
} from './nucleo';
import type { AbaSancoes, SancaoAplicada } from './tipos';

export { aprovadorDe };

const ativavel = (s: SancaoAplicada) => s.tipo === 'suspensao' || s.tipo === 'bloqueio_permanente';

export async function listarSancoes(aba: AbaSancoes): Promise<SancaoAplicada[]> {
  await rede();
  processarVencimentos();
  const l = db().sancoes;
  const r =
    aba === 'ativas' ? l.filter((s) => s.status === 'ativa' && ativavel(s))
      : aba === 'pendentes' ? l.filter((s) => s.status === 'pendente_2a')
        : l.filter((s) => s.status !== 'ativa' && s.status !== 'pendente_2a');
  const data = (s: SancaoAplicada) => s.revertidaEm ?? s.encerradaEm ?? s.aplicadaEm ?? s.solicitadoEm;
  return [...r].sort((a, b) => data(b).localeCompare(data(a)));
}

export async function resumoSancoes() {
  await rede(200);
  processarVencimentos();
  const l = db().sancoes;
  const trinta = Date.now() - 30 * 86_400_000;
  return {
    bloqueios: l.filter((s) => s.status === 'ativa' && s.tipo === 'bloqueio_permanente').length,
    suspensoes: l.filter((s) => s.status === 'ativa' && s.tipo === 'suspensao').length,
    pendentes: l.filter((s) => s.status === 'pendente_2a').length,
    recursos: l.filter((s) => s.status === 'ativa' && s.recurso && !s.recursoDecisao).length,
    revertidas30d: l.filter((s) => s.status === 'revertida' && s.revertidaEm && new Date(s.revertidaEm).getTime() >= trinta).length,
  };
}

function achar(id: string) {
  const s = db().sancoes.find((x) => x.id === id);
  if (!s) throw new Error('Sanção não encontrada.');
  return s;
}

export async function reverterSancao(id: string, justificativa: string) {
  await rede();
  reverter(achar(id), exigirJustificativa(justificativa, configAtual()));
  persistir();
}

export async function decidirBloqueioPendente(id: string, aprovar: boolean, justificativa: string) {
  await rede();
  const cfg = configAtual();
  decidirPendente(achar(id), aprovar, exigirJustificativa(justificativa, cfg), cfg);
  persistir();
}

// Recurso do usuário: manter (nega) ou reverter (aceita) a sanção.
export async function decidirRecurso(id: string, aceitar: boolean, justificativa: string) {
  await rede();
  const s = achar(id);
  const just = exigirJustificativa(justificativa, configAtual());
  if (!s.recurso || s.recursoDecisao) throw new Error('Não há recurso pendente nesta sanção.');
  if (aceitar) {
    reverter(s, just, true);
  } else {
    s.recursoDecisao = 'mantida';
    registrar('bloqueio', USUARIO_ATUAL, 'Negou recurso (sanção mantida)', s.usuario, just, s.id);
  }
  persistir();
}
