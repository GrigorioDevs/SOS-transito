// Regras do "servidor" fictício, sem estado: abrir caso (snapshot dos prazos), pedir defesa,
// status do usuário e saídas. Recebem a configuração e o "agora" como parâmetros.
import { nivelDaCategoria, somarPrazo } from '../config/regras';
import type { ConfiguracoesAdmin } from '../config/tipos';
import type { Caso, SancaoAplicada, StatusUsuario, TipoProva, Usuario, UsuarioResumo } from './tipos';

export const HORA = 3_600_000;
export const DIA = 24 * HORA;

export type DadosCaso = Pick<Caso, 'id' | 'categoriaId' | 'denuncianteId' | 'denunciante' | 'denuncianteTipo' | 'denunciadoId' | 'denunciado' | 'denunciadoTipo' | 'chamado' | 'relato'> & { provas: TipoProva[] };

// Abre um caso copiando os prazos do nível da categoria na configuração ATUAL.
export function abrirCaso(d: DadosCaso, criadoEm: Date, cfg: ConfiguracoesAdmin): Caso {
  const nivel = nivelDaCategoria(cfg, d.categoriaId);
  const prazos = {
    contagem: cfg.moderacao.contagem,
    defesa: { ...nivel.prazoDefesa },
    decisao: { ...nivel.prazoDecisao },
    lembrete: { ...nivel.lembreteAntes },
    aoVencerDefesa: nivel.aoVencerDefesa,
  };
  return {
    ...d,
    categoria: cfg.categorias.find((c) => c.id === d.categoriaId)?.nome ?? d.categoriaId,
    status: 'novo',
    criadoEm: criadoEm.toISOString(),
    nivelId: nivel.id,
    versaoConfig: cfg.versao,
    prazos,
    decisaoAte: somarPrazo(criadoEm, prazos.decisao, prazos.contagem).toISOString(),
    procedentes: [],
  };
}

// Pedido de defesa: usa os prazos gravados no caso (não os da configuração atual).
export function solicitarDefesa(caso: Caso, quando: Date) {
  const defesaAte = somarPrazo(quando, caso.prazos.defesa, caso.prazos.contagem);
  caso.status = 'aguardando';
  caso.defesaSolicitadaEm = quando.toISOString();
  caso.defesaAte = defesaAte.toISOString();
  caso.decisaoAte = somarPrazo(defesaAte, caso.prazos.decisao, caso.prazos.contagem).toISOString();
}

// Momento em que o usuário passou a contar como "saiu" (último uso + dias sem uso), se já passou.
export function saidaEm(u: Usuario, diasSemUso: number, agora: number): number | null {
  const t = new Date(u.ultimoUsoEm).getTime() + diasSemUso * DIA;
  return t <= agora ? t : null;
}

// Procedente = qualquer decisão diferente de arquivar que não foi revertida.
export const ehProcedente = (s: SancaoAplicada) => (s.status === 'ativa' || s.status === 'encerrada') && Boolean(s.aplicadaEm);

export function indexarSancoes(sancoes: SancaoAplicada[]) {
  const m = new Map<string, SancaoAplicada[]>();
  for (const s of sancoes) {
    const l = m.get(s.usuarioId);
    if (l) l.push(s); else m.set(s.usuarioId, [s]);
  }
  return m;
}

export function resumirUsuario(u: Usuario, sancoesDoUsuario: SancaoAplicada[], cfg: ConfiguracoesAdmin, agora: number): UsuarioResumo {
  const ativas = sancoesDoUsuario.filter((s) => s.status === 'ativa');
  const susp = ativas.filter((s) => s.tipo === 'suspensao').sort((a, b) => (b.ate ?? '').localeCompare(a.ate ?? ''))[0];
  const saiu = saidaEm(u, cfg.retencao.diasSemUsoParaSaida, agora);
  let status: StatusUsuario = 'ativo';
  if (ativas.some((s) => s.tipo === 'bloqueio_permanente')) status = 'bloqueado';
  else if (susp) status = 'suspenso';
  else if (saiu) status = 'inativo';
  return { ...u, status, saiuEm: saiu ? new Date(saiu).toISOString() : undefined, suspensoAte: susp?.ate };
}

export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
