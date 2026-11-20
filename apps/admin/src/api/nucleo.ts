// Operações compartilhadas da API fictícia (o que o back-end faria dentro de uma transação):
// auditoria, vencimentos automáticos e aplicação/aprovação de sanções.
import { USUARIO_ATUAL, obterConfigAtual } from '../config/api';
import { somarPrazo } from '../config/regras';
import type { ConfiguracoesAdmin, Sancao } from '../config/tipos';
import { db, persistir } from './armazenamento';
import { DIA, ehProcedente } from './dominio';
import { ErroHttp, pedir } from './http';
import type { AreaAuditoria, Caso, EventoAuditoria, SancaoAplicada, Usuario } from './tipos';

export { USUARIO_ATUAL };
// Segundo admin simulado: aprova/recusa bloqueios pedidos pelo usuário atual e recebe casos escalados.
export const SEGUNDO_ADMIN = 'Marina';

const CHAVE_FALHA = 'sos-admin:simular-falha';
const agoraISO = () => new Date().toISOString();

// Atraso de rede. Para ver os estados de erro: localStorage.setItem('sos-admin:simular-falha', '1').
export async function rede(ms = 300) {
  await new Promise((r) => setTimeout(r, ms));
  let falha = false;
  try { falha = localStorage.getItem(CHAVE_FALHA) === '1'; } catch { /* sem armazenamento */ }
  if (falha) throw new Error('Não foi possível falar com o servidor (falha simulada).');
}

export function novoId(prefixo: string) {
  const b = db();
  b.seq[prefixo] = (b.seq[prefixo] ?? 0) + 1;
  return `${prefixo}-${b.seq[prefixo]}`;
}

/* -------------------------------- Auditoria -------------------------------- */
// Os eventos vão para o servidor (POST /api/admin/auditoria), que grava data e hora.
// registrar() só enfileira; a fila é enviada em ordem. Se o servidor estiver fora do ar,
// os eventos ficam na fila e são reenviados no próximo envio.

type NovoEvento = Omit<EventoAuditoria, 'id' | 'quando'>;
const fila: NovoEvento[] = [];
let envio: Promise<void> | null = null;

// Respeita os limites das colunas no banco (evita um 400 que travaria a fila).
const corte = (v: string | undefined, max: number) => (v && v.length > max ? `${v.slice(0, max - 1)}…` : v);

export function registrar(area: AreaAuditoria, quem: string, acao: string, alvo?: string, motivo?: string, ref?: string) {
  fila.push({ area, quem: corte(quem, 80)!, acao: corte(acao, 200)!, alvo: corte(alvo, 200), motivo: corte(motivo, 2000), ref: corte(ref, 60) });
  void enviarAuditoria().catch(() => { /* fica na fila; quem precisa do resultado chama enviarAuditoria() */ });
}

// Envia tudo o que está na fila. Rejeita se algum evento não chegou ao servidor.
export function enviarAuditoria(): Promise<void> {
  envio ??= (async () => {
    try {
      while (fila.length) {
        try {
          await pedir('POST', '/api/admin/auditoria', fila[0]);
        } catch (e) {
          // 400 = evento recusado pela validação: reenviar não adianta, descarta para não travar a fila.
          if (!(e instanceof ErroHttp) || e.status !== 400) throw e;
          console.error('Evento de auditoria recusado pelo servidor:', fila[0], e.message);
        }
        fila.shift();
      }
    } finally {
      envio = null;
    }
  })();
  return envio;
}

export function exigirJustificativa(justificativa: string, cfg: ConfiguracoesAdmin) {
  const j = justificativa.trim();
  if (j.length < cfg.sancoes.justificativaMin) {
    throw new Error(`A justificativa precisa ter pelo menos ${cfg.sancoes.justificativaMin} caracteres.`);
  }
  return j;
}

export function acharUsuario(id: string): Usuario {
  const u = db().usuarios.find((x) => x.id === id);
  if (!u) throw new Error('Usuário não encontrado.');
  return u;
}

export const procedentesDe = (usuarioId: string) =>
  db().sancoes.filter((s) => s.usuarioId === usuarioId && ehProcedente(s)).map((s) => s.aplicadaEm!).sort().reverse();

/* ------------------------------- Vencimentos ------------------------------- */

// Roda antes de cada leitura: prazo de defesa vencido e suspensões cumpridas.
export function processarVencimentos() {
  const b = db();
  const agora = Date.now();
  let mudou = false;
  const rotulo = { arquivar: 'caso arquivado', escalar: `escalado para ${SEGUNDO_ADMIN}`, decidir_sem_defesa: 'segue para decisão sem defesa' };
  for (const c of b.casos) {
    if (c.status !== 'aguardando' || !c.defesaAte || new Date(c.defesaAte).getTime() > agora) continue;
    if (c.prazos.aoVencerDefesa === 'arquivar') {
      Object.assign(c, { status: 'resolvido', decisao: 'Arquivado (sem defesa no prazo)', resolvidoEm: c.defesaAte, decididoPor: 'Sistema' });
    } else {
      c.status = 'em_analise';
      if (c.prazos.aoVencerDefesa === 'escalar') c.escaladoPara = SEGUNDO_ADMIN;
    }
    registrar('sistema', 'Sistema', 'Prazo de defesa vencido', c.denunciado, rotulo[c.prazos.aoVencerDefesa], c.id);
    mudou = true;
  }
  for (const s of b.sancoes) {
    if (s.status === 'ativa' && s.tipo === 'suspensao' && s.ate && new Date(s.ate).getTime() <= agora) {
      s.status = 'encerrada';
      s.encerradaEm = s.ate;
      registrar('sistema', 'Sistema', 'Suspensão encerrada (prazo cumprido)', s.usuario, undefined, s.id);
      mudou = true;
    }
  }
  if (mudou) persistir();
}

/* --------------------------------- Sanções --------------------------------- */

function efetivar(reg: SancaoAplicada, cfg: ConfiguracoesAdmin) {
  const agora = new Date();
  reg.aplicadaEm = agora.toISOString();
  // Prazo de recurso gravado na sanção: mudanças na configuração não afetam sanções já aplicadas.
  reg.recursoAte = somarPrazo(agora, cfg.sancoes.prazoRecurso, cfg.moderacao.contagem).toISOString();
  if (reg.tipo === 'suspensao') {
    reg.status = 'ativa';
    reg.ate = new Date(agora.getTime() + (reg.duracaoDias ?? 0) * DIA).toISOString();
  } else if (reg.tipo === 'bloqueio_permanente') {
    reg.status = 'ativa';
  } else {
    reg.status = 'encerrada';
    reg.encerradaEm = reg.aplicadaEm;
  }
}

// Aplica uma sanção do catálogo. Bloqueio permanente com "2º admin" ligado fica pendente.
export function aplicarSancao(o: { usuario: Usuario; sancao: Sancao; caso?: Caso; justificativa: string; cfg: ConfiguracoesAdmin }) {
  const { usuario, sancao: s, caso, justificativa, cfg } = o;
  const reg: SancaoAplicada = {
    id: novoId('S'), usuarioId: usuario.id, usuario: usuario.nome, usuarioTipo: usuario.tipo, sancaoId: s.id, sancaoNome: s.nome,
    tipo: s.tipo, duracaoDias: s.duracaoDias, casoId: caso?.id, status: 'pendente_2a', solicitadoPor: USUARIO_ATUAL,
    solicitadoEm: agoraISO(), justificativa,
  };
  db().sancoes.unshift(reg);
  const pendente = s.tipo === 'bloqueio_permanente' && cfg.sancoes.segundoAdminBloqueio;
  if (pendente) {
    if (caso) {
      caso.status = 'aguardando_2a';
      caso.bloqueioPendente = { sancaoId: s.id, sancaoNome: s.nome, solicitadoPor: USUARIO_ATUAL, solicitadoEm: reg.solicitadoEm, justificativa };
    }
    registrar('bloqueio', USUARIO_ATUAL, `Solicitou ${s.nome} (aguarda 2ª aprovação)`, usuario.nome, justificativa, caso?.id ?? reg.id);
  } else {
    efetivar(reg, cfg);
    if (caso) resolverCaso(caso, s.nome, USUARIO_ATUAL, justificativa);
    registrar(caso ? 'denuncia' : 'usuario', USUARIO_ATUAL, caso ? `Decidiu: ${s.nome}` : `Aplicou ${s.nome}`, usuario.nome, justificativa, caso?.id ?? usuario.id);
  }
  return { reg, pendente };
}

export function resolverCaso(caso: Caso, decisao: string, quem: string, justificativa: string) {
  Object.assign(caso, { status: 'resolvido', decisao, decididoPor: quem, justificativaDecisao: justificativa, resolvidoEm: agoraISO() });
  delete caso.bloqueioPendente;
  delete caso.escaladoPara;
}

// Quem faz a 2ª aprovação: nunca quem pediu. Se o pedido foi do usuário atual, o 2º admin é simulado.
export const aprovadorDe = (reg: SancaoAplicada) => (reg.solicitadoPor === USUARIO_ATUAL ? SEGUNDO_ADMIN : USUARIO_ATUAL);

export function decidirPendente(reg: SancaoAplicada, aprovar: boolean, justificativa: string, cfg: ConfiguracoesAdmin) {
  if (reg.status !== 'pendente_2a') throw new Error('Este bloqueio não está aguardando aprovação.');
  const quem = aprovadorDe(reg);
  if (quem === reg.solicitadoPor) throw new Error('A 2ª aprovação precisa ser de outro admin.');
  const caso = reg.casoId ? db().casos.find((c) => c.id === reg.casoId) : undefined;
  if (aprovar) {
    reg.aprovadoPor = quem;
    efetivar(reg, cfg);
    if (caso) resolverCaso(caso, reg.sancaoNome, reg.solicitadoPor, reg.justificativa);
    registrar('bloqueio', quem, `Aprovou ${reg.sancaoNome} (2ª aprovação)`, reg.usuario, justificativa, reg.casoId ?? reg.id);
  } else {
    reg.status = 'recusada';
    reg.revertidaPor = quem;
    reg.revertidaEm = agoraISO();
    reg.motivoReversao = justificativa;
    if (caso) { caso.status = 'em_analise'; delete caso.bloqueioPendente; }
    registrar('bloqueio', quem, `Recusou ${reg.sancaoNome} pedido por ${reg.solicitadoPor}`, reg.usuario, justificativa, reg.casoId ?? reg.id);
  }
}

export function reverter(reg: SancaoAplicada, justificativa: string, comoRecurso = false) {
  if (reg.status !== 'ativa') throw new Error('Só é possível reverter uma sanção ativa.');
  Object.assign(reg, { status: 'revertida', revertidaPor: USUARIO_ATUAL, revertidaEm: agoraISO(), motivoReversao: justificativa });
  if (comoRecurso) reg.recursoDecisao = 'revertida';
  registrar('bloqueio', USUARIO_ATUAL, comoRecurso ? `Aceitou recurso e reverteu ${reg.sancaoNome}` : `Reverteu ${reg.sancaoNome}`, reg.usuario, justificativa, reg.id);
}

export const configAtual = obterConfigAtual;
