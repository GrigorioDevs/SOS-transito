// API FICTÍCIA de usuários (clientes e prestadores).
// Back-end: GET /api/admin/usuarios?busca=&segmento=&status=&pagina=, GET /api/admin/usuarios/{id},
// POST /api/admin/usuarios/{id}/sancoes, POST /api/admin/usuarios/{id}/reativar.
import { db, persistir } from './armazenamento';
import { indexarSancoes, normalizar, resumirUsuario } from './dominio';
import {
  acharUsuario, aplicarSancao, configAtual, exigirJustificativa, procedentesDe, processarVencimentos, rede, reverter,
} from './nucleo';
import type { FiltroUsuarios, Pagina, PerfilUsuario, UsuarioResumo } from './tipos';

const ORDEM_STATUS = { bloqueado: 0, suspenso: 1, ativo: 2, inativo: 3 } as const;

export function resumirTodos(): UsuarioResumo[] {
  const b = db();
  const cfg = configAtual();
  const agora = Date.now();
  const idx = indexarSancoes(b.sancoes);
  return b.usuarios.map((u) => resumirUsuario(u, idx.get(u.id) ?? [], cfg, agora));
}

export async function listarUsuarios(f: FiltroUsuarios = {}): Promise<Pagina<UsuarioResumo>> {
  await rede();
  processarVencimentos();
  const termo = normalizar(f.busca?.trim() ?? '');
  const lista = resumirTodos()
    .filter((u) => !f.segmento || f.segmento === 'todos' || (f.segmento === 'clientes' ? u.tipo === 'cliente' : u.tipo === 'prestador'))
    .filter((u) => !f.status || f.status === 'todos' || u.status === f.status)
    .filter((u) => !termo || normalizar(`${u.nome} ${u.email} ${u.id} ${u.cidade} ${u.servico ?? ''}`).includes(termo))
    .sort((a, b) => ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || b.ultimoUsoEm.localeCompare(a.ultimoUsoEm));
  const porPagina = f.porPagina ?? 25;
  const pagina = f.pagina ?? 0;
  return { total: lista.length, itens: lista.slice(pagina * porPagina, (pagina + 1) * porPagina) };
}

export async function buscarUsuario(id: string): Promise<PerfilUsuario> {
  await rede(250);
  processarVencimentos();
  const b = db();
  const u = acharUsuario(id);
  const sancoes = b.sancoes.filter((s) => s.usuarioId === id).sort((a, c) => c.solicitadoEm.localeCompare(a.solicitadoEm));
  const procedentes = procedentesDe(id);
  return {
    usuario: resumirUsuario(u, sancoes, configAtual(), Date.now()),
    sancoes,
    casosRecebidos: b.casos.filter((c) => c.denunciadoId === id).map((c) => ({ ...c, procedentes })),
    casosFeitos: b.casos.filter((c) => c.denuncianteId === id).map((c) => ({ ...c, procedentes: procedentesDe(c.denunciadoId) })),
    avaliacoesRecebidas: b.avaliacoes.filter((a) => a.avaliadoId === id).sort((a, c) => c.criadoEm.localeCompare(a.criadoEm)).slice(0, 20),
    procedentes,
  };
}

// Sanção aplicada direto no perfil (sem denúncia), com as mesmas regras do catálogo.
export async function sancionarUsuario(id: string, sancaoId: string, justificativa: string) {
  await rede();
  const cfg = configAtual();
  const just = exigirJustificativa(justificativa, cfg);
  const usuario = acharUsuario(id);
  const s = cfg.sancoes.catalogo.find((x) => x.id === sancaoId && x.ativa);
  if (!s) throw new Error('Esta sanção não está disponível.');
  const atual = resumirUsuario(usuario, db().sancoes.filter((x) => x.usuarioId === id), cfg, Date.now());
  if (atual.status === 'bloqueado') throw new Error('Este usuário já está bloqueado.');
  if (db().sancoes.some((x) => x.usuarioId === id && x.status === 'pendente_2a') && s.tipo === 'bloqueio_permanente') {
    throw new Error('Já existe um bloqueio aguardando a 2ª aprovação para este usuário.');
  }
  const r = aplicarSancao({ usuario, sancao: s, justificativa: just, cfg });
  persistir();
  return r;
}

// Reativa: reverte todas as suspensões e bloqueios ativos do usuário.
export async function reativarUsuario(id: string, justificativa: string) {
  await rede();
  const just = exigirJustificativa(justificativa, configAtual());
  const ativas = db().sancoes.filter((s) => s.usuarioId === id && s.status === 'ativa' && (s.tipo === 'suspensao' || s.tipo === 'bloqueio_permanente'));
  if (!ativas.length) throw new Error('Este usuário não tem suspensão nem bloqueio ativo.');
  for (const s of ativas) reverter(s, just);
  persistir();
}
