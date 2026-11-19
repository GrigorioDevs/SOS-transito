// "Banco" da API fictícia, guardado no localStorage deste navegador.
// Na troca pelo back-end este arquivo deixa de existir: as funções de api passam a chamar fetch().
//
// - Guarda { esquema, salvoEm, banco }. Esquema diferente do atual → dados de demonstração novos.
// - Ao carregar, o que foi salvo é mesclado com os dados padrão: registros novos da demonstração
//   aparecem e campos novos recebem o valor padrão.
// - Datas relativas: todas as datas são deslocadas pelo tempo que o painel ficou fechado.
//   Assim "há 3 dias" continua "há 3 dias" amanhã e a demonstração sempre parece atual.
import { obterConfigAtual } from '../config/api';
import { gerarDadosDemonstracao } from './seed';
import type { Avaliacao, Caso, ChamadosSemana, EventoAuditoria, SancaoAplicada, Usuario } from './tipos';

const CHAVE = 'sos-admin:dados';
export const ESQUEMA_DADOS = 1;

export interface Banco {
  usuarios: Usuario[];
  casos: Caso[];
  sancoes: SancaoAplicada[];
  avaliacoes: Avaliacao[];
  chamadosSemana: ChamadosSemana[];
  auditoria: EventoAuditoria[];
  seq: Record<string, number>;
}

interface Gravado { esquema: number; salvoEm: string; banco: Banco }

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const objeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// Desloca todas as datas ISO do objeto em `ms` milissegundos.
function deslocar(v: unknown, ms: number): unknown {
  if (typeof v === 'string') return ISO.test(v) ? new Date(new Date(v).getTime() + ms).toISOString() : v;
  if (Array.isArray(v)) return v.map((x) => deslocar(x, ms));
  if (objeto(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deslocar(x, ms)]));
  return v;
}

// Campos que faltam no registro salvo recebem o valor do registro padrão.
function completar<T extends object>(padrao: T | undefined, salvo: T): T {
  if (!padrao) return salvo;
  const r = { ...salvo } as Record<string, unknown>;
  for (const [k, v] of Object.entries(padrao)) if (!(k in r)) r[k] = v;
  return r as T;
}

// Mescla uma coleção por id: mantém a ordem salva e acrescenta registros padrão que não existiam.
function mesclarColecao<T extends { id: string }>(padrao: T[], salvo: unknown): T[] {
  if (!Array.isArray(salvo)) return padrao;
  const porId = new Map(padrao.map((p) => [p.id, p]));
  const lista = (salvo as T[]).filter((x) => objeto(x) && typeof x.id === 'string').map((x) => completar(porId.get(x.id), x));
  const ids = new Set(lista.map((x) => x.id));
  return [...lista, ...padrao.filter((p) => !ids.has(p.id))];
}

function ler(): Gravado | null {
  try {
    const t = localStorage.getItem(CHAVE);
    return t ? (JSON.parse(t) as Gravado) : null;
  } catch {
    return null;
  }
}

function carregar(): Banco {
  const agora = Date.now();
  const padrao = gerarDadosDemonstracao(obterConfigAtual(), agora);
  const g = ler();
  if (!g || g.esquema !== ESQUEMA_DADOS || !objeto(g.banco) || typeof g.salvoEm !== 'string') return padrao;
  // Migrações entre esquemas entram aqui quando ESQUEMA_DADOS subir.
  const pausa = Math.max(0, agora - new Date(g.salvoEm).getTime());
  const salvo = deslocar(g.banco, pausa) as Banco;
  const seq = { ...padrao.seq };
  for (const [k, v] of Object.entries(objeto(salvo.seq) ? salvo.seq : {})) seq[k] = Math.max(seq[k] ?? 0, Number(v) || 0);
  return {
    usuarios: mesclarColecao(padrao.usuarios, salvo.usuarios),
    casos: mesclarColecao(padrao.casos, salvo.casos),
    sancoes: mesclarColecao(padrao.sancoes, salvo.sancoes),
    avaliacoes: mesclarColecao(padrao.avaliacoes, salvo.avaliacoes),
    auditoria: mesclarColecao(padrao.auditoria, salvo.auditoria),
    // Série semanal: sempre a da demonstração (só leitura).
    chamadosSemana: padrao.chamadosSemana,
    seq,
  };
}

let banco: Banco | null = null;

export function db(): Banco {
  if (!banco) {
    banco = carregar();
    persistir();
  }
  return banco;
}

export function persistir() {
  if (!banco) return;
  try {
    const g: Gravado = { esquema: ESQUEMA_DADOS, salvoEm: new Date().toISOString(), banco };
    localStorage.setItem(CHAVE, JSON.stringify(g));
  } catch {
    /* sem armazenamento: os dados valem só nesta sessão */
  }
}

// Apaga o que foi feito e recria os dados de demonstração a partir de agora.
export function recriarDemonstracao() {
  banco = gerarDadosDemonstracao(obterConfigAtual(), Date.now());
  persistir();
}

// Mantém o "relógio" salvo em dia ao fechar a aba (as datas só andam com o painel aberto).
if (typeof window !== 'undefined') window.addEventListener('pagehide', persistir);
