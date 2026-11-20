// API FICTÍCIA da configuração. Persiste no localStorage deste navegador.
// Para ligar no back-end: troque o corpo de buscarConfiguracoes/salvarConfiguracoes/listarHistorico
// por GET/PUT /api/admin/configuracoes (por empresa), mantendo as assinaturas.
import { CONFIG_PADRAO, ESQUEMA_CONFIG, ROTULO_AO_VENCER, ROTULO_TIPO_SANCAO } from './padrao';
import { textoDuracao } from './regras';
import { validarConfig } from './validacao';
import type { AlteracaoConfig, ConfiguracoesAdmin, Duracao } from './tipos';

const CHAVE = 'sos-admin:configuracoes';
const CHAVE_HIST = 'sos-admin:configuracoes:historico';

// Usuário logado — fixo até existir login de admin.
export const USUARIO_ATUAL = 'Cristian';

const atraso = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const clonar = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function ler<T>(chave: string): T | null {
  try {
    const t = localStorage.getItem(chave);
    return t ? (JSON.parse(t) as T) : null;
  } catch {
    return null;
  }
}
function gravar(chave: string, valor: unknown) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento: vale só nesta sessão */ }
}

/* ------------- Mescla o que foi salvo com os padrões (campos novos ganham o padrão) ------------- */

const objeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function mesclar(padrao: unknown, salvo: unknown): unknown {
  if (salvo === undefined) return clonar(padrao);
  if (Array.isArray(padrao)) {
    if (!Array.isArray(salvo)) return clonar(padrao);
    if (!objeto(padrao[0])) return salvo;
    // Itens de lista (níveis, categorias...) ganham os campos que faltam do item padrão
    // de mesmo id; itens criados pela empresa usam o primeiro item padrão como modelo.
    return salvo.map((item) => {
      const igual = objeto(item) ? padrao.find((p) => objeto(p) && p.id === item.id) : undefined;
      return mesclar(igual ?? padrao[0], item);
    });
  }
  if (objeto(padrao)) {
    if (!objeto(salvo)) return clonar(padrao);
    const r: Record<string, unknown> = { ...salvo };
    for (const k of Object.keys(padrao)) r[k] = mesclar(padrao[k], salvo[k]);
    return r;
  }
  return typeof salvo === typeof padrao ? salvo : padrao;
}

function carregar(): ConfiguracoesAdmin {
  const gravado = ler<{ esquema: number; config: unknown }>(CHAVE);
  if (!gravado || typeof gravado.esquema !== 'number' || gravado.esquema > ESQUEMA_CONFIG) return clonar(CONFIG_PADRAO);
  // Migrações entre esquemas entram aqui quando ESQUEMA_CONFIG subir.
  const c = mesclar(CONFIG_PADRAO, gravado.config) as ConfiguracoesAdmin;
  // Metas são um conjunto fixo de indicadores: indicador novo no padrão aparece; removido some.
  c.metas = CONFIG_PADRAO.metas.map((p) => mesclar(p, c.metas.find((m) => m.id === p.id)) as typeof p);
  return c;
}

let atual = carregar();

// Leitura síncrona para a API fictícia de casos (snapshot ao abrir caso / pedir defesa).
export const obterConfigAtual = () => clonar(atual);

/* ----------------------------- Histórico (diferenças) ----------------------------- */

const ROTULOS: Record<string, string> = {
  moderacao: 'Prazos', contagem: 'Contagem de prazos', niveis: 'Nível', nome: 'Nome', cor: 'Cor', ordem: 'Ordem',
  prazoDefesa: 'Prazo de defesa', prazoDecisao: 'Prazo de decisão', lembreteAntes: 'Lembrete antes de vencer',
  aoVencerDefesa: 'Ao vencer a defesa', categorias: 'Categoria', nivelId: 'Criticidade', ativa: 'Ativa',
  sancoes: 'Sanções', catalogo: 'Sanção', tipo: 'Tipo', duracaoDias: 'Duração (dias)', reincidencia: 'Regra de reincidência',
  procedentes: 'Procedentes', janelaDias: 'Janela (dias)', sancaoId: 'Sanção sugerida', justificativaMin: 'Justificativa mínima (caracteres)',
  segundoAdminBloqueio: '2º admin para bloqueio', prazoRecurso: 'Prazo de recurso', provas: 'Provas', tiposAceitos: 'Tipos aceitos',
  tamanhoMaxMB: 'Tamanho máximo (MB)', maxPorDenuncia: 'Máximo por denúncia', guardaDias: 'Guarda após encerrar (dias)',
  metas: 'Meta', sentido: 'Sentido', limiteVerde: 'Limite verde', limiteVermelho: 'Limite vermelho', unidade: 'Unidade',
  retencao: 'Retenção', diasSemUsoParaSaida: 'Dias sem uso para "saiu"', motivosSaida: 'Motivos de saída',
  avaliacoes: 'Avaliações', notaAlertaRevisao: 'Nota de alerta', notaInsatisfeito: 'Nota insatisfeito', notaSatisfeito: 'Nota satisfeito',
  organizacao: 'Organização', nomeEmpresa: 'Nome da empresa', fusoHorario: 'Fuso horário', formatoData: 'Formato de data',
};
const IGNORAR = new Set(['versao', 'atualizadoEm', 'atualizadoPor']);

const ehDuracao = (v: unknown): v is Duracao => objeto(v) && 'valor' in v && 'unidade' in v;

function mostrar(chave: string, v: unknown): string {
  if (v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (ehDuracao(v)) return textoDuracao(v);
  if (Array.isArray(v)) return v.join(', ') || '(vazio)';
  if (chave === 'aoVencerDefesa') return ROTULO_AO_VENCER[String(v)] ?? String(v);
  if (chave === 'tipo') return ROTULO_TIPO_SANCAO[String(v)] ?? String(v);
  if (chave === 'sentido') return v === 'maior_melhor' ? 'Maior é melhor' : 'Menor é melhor';
  if (chave === 'contagem') return v === 'uteis' ? 'Dias úteis' : 'Dias corridos';
  return String(v);
}

interface Folha { rotulo: string; chave: string; valor: unknown }

// Achata a configuração em folhas. A chave interna usa o id dos itens (renomear não vira "removido + novo").
function achatar(v: unknown, caminho: string, rotulo: string, chave: string, saida: Map<string, Folha>) {
  if (Array.isArray(v) && v.length && objeto(v[0])) {
    v.forEach((item, i) => {
      const it = item as Record<string, unknown>;
      const id = String(it.id ?? i + 1);
      const nome = String(it.nome ?? `#${i + 1}`);
      for (const [k, val] of Object.entries(it)) {
        if (k !== 'id') achatar(val, `${caminho}.${id}.${k}`, `${rotulo} "${nome}" › ${ROTULOS[k] ?? k}`, k, saida);
      }
    });
    return;
  }
  if (objeto(v) && !ehDuracao(v)) {
    for (const [k, val] of Object.entries(v)) {
      if (IGNORAR.has(k)) continue;
      const r = ROTULOS[k] ?? k;
      achatar(val, caminho ? `${caminho}.${k}` : k, rotulo ? `${rotulo} › ${r}` : r, k, saida);
    }
    return;
  }
  saida.set(caminho, { rotulo, chave, valor: v });
}

function diferencas(antes: ConfiguracoesAdmin, depois: ConfiguracoesAdmin) {
  const a = new Map<string, Folha>(), d = new Map<string, Folha>();
  achatar(antes, '', '', '', a);
  achatar(depois, '', '', '', d);
  const r: { campo: string; anterior: string; novo: string }[] = [];
  for (const k of new Set([...a.keys(), ...d.keys()])) {
    const fa = a.get(k), fd = d.get(k);
    if (fa && fd && JSON.stringify(fa.valor) === JSON.stringify(fd.valor)) continue;
    const f = (fd ?? fa)!;
    r.push({
      campo: f.rotulo,
      anterior: fa ? mostrar(f.chave, fa.valor) : '(novo)',
      novo: fd ? mostrar(f.chave, fd.valor) : '(removido)',
    });
  }
  return r;
}

/* ----------------------------------- API ----------------------------------- */

export async function buscarConfiguracoes(): Promise<ConfiguracoesAdmin> {
  await atraso();
  return clonar(atual);
}

export async function salvarConfiguracoes(nova: ConfiguracoesAdmin): Promise<ConfiguracoesAdmin> {
  await atraso();
  const erros = validarConfig(nova);
  if (Object.keys(erros).length) throw new Error('A configuração tem campos inválidos. Corrija antes de salvar.');
  if (nova.versao !== atual.versao) throw new Error('A configuração foi alterada por outra pessoa. Recarregue a página.');

  const agora = new Date().toISOString();
  const salva: ConfiguracoesAdmin = clonar({
    ...nova,
    moderacao: { ...nova.moderacao, niveis: nova.moderacao.niveis.map((n, i) => ({ ...n, ordem: i + 1 })) },
    versao: atual.versao + 1,
    atualizadoEm: agora,
    atualizadoPor: USUARIO_ATUAL,
  });
  const mudancas = diferencas(atual, salva);
  if (mudancas.length === 0) return clonar(atual);

  const historico = ler<AlteracaoConfig[]>(CHAVE_HIST) ?? [];
  const novas = mudancas.map((m, i) => ({ id: `${salva.versao}-${i}`, quando: agora, quem: USUARIO_ATUAL, versao: salva.versao, ...m }));
  gravar(CHAVE_HIST, [...novas, ...historico].slice(0, 500));
  gravar(CHAVE, { esquema: ESQUEMA_CONFIG, config: salva });
  atual = salva;
  return clonar(atual);
}

export async function listarHistorico(): Promise<AlteracaoConfig[]> {
  await atraso(150);
  return ler<AlteracaoConfig[]>(CHAVE_HIST) ?? [];
}
