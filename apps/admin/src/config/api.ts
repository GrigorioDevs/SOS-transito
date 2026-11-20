// API da configuração, ligada ao back-end (.NET + PostgreSQL):
//   GET /api/admin/configuracoes          → versão atual (204 = nunca salva: valores padrão, versão 1)
//   PUT /api/admin/configuracoes          → grava uma versão nova (409 se outra pessoa salvou antes)
//   GET /api/admin/configuracoes/versoes  → versões salvas; o histórico (diferenças) é montado aqui
import { pedir } from '../api/http';
import { CONFIG_PADRAO, ESQUEMA_CONFIG, ROTULO_AO_VENCER, ROTULO_TIPO_SANCAO } from './padrao';
import { textoDuracao } from './regras';
import { validarConfig } from './validacao';
import type { AlteracaoConfig, ConfiguracoesAdmin, Duracao } from './tipos';

// Usuário logado — fixo até existir login de admin.
export const USUARIO_ATUAL = 'Cristian';

const clonar = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// Formato devolvido pela API (ConfiguracaoResponse no back-end).
interface VersaoApi { versao: number; esquema: number; salvoEm: string; salvoPor: string; dados: unknown }

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

// Versão vinda da API → objeto completo das telas (campos que faltam recebem o padrão).
function montar(v: VersaoApi): ConfiguracoesAdmin {
  if (v.esquema > ESQUEMA_CONFIG) {
    throw new Error('A configuração foi salva por uma versão mais nova do painel. Atualize a página (Ctrl+F5).');
  }
  // Migrações entre esquemas entram aqui quando ESQUEMA_CONFIG subir.
  const c = mesclar(CONFIG_PADRAO, v.dados) as ConfiguracoesAdmin;
  // Metas são um conjunto fixo de indicadores: indicador novo no padrão aparece; removido some.
  c.metas = CONFIG_PADRAO.metas.map((p) => mesclar(p, c.metas.find((m) => m.id === p.id)) as typeof p);
  return { ...c, versao: v.versao, atualizadoEm: v.salvoEm, atualizadoPor: v.salvoPor };
}

// Só o conteúdo vai para o banco: versão, data e autor são colunas próprias, definidas pelo servidor.
function dados(c: ConfiguracoesAdmin) {
  const { versao: _v, atualizadoEm: _e, atualizadoPor: _p, ...resto } = c;
  return resto;
}

// Última configuração lida do servidor. Começa no padrão até a primeira resposta chegar
// (o AdminLayout busca a configuração ao abrir o painel).
let atual = clonar(CONFIG_PADRAO);

// Leitura síncrona para as APIs fictícias de casos/sanções (snapshot ao abrir caso / pedir defesa).
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
  const v = await pedir<VersaoApi>('GET', '/api/admin/configuracoes');
  atual = v ? montar(v) : clonar(CONFIG_PADRAO);
  return clonar(atual);
}

export async function salvarConfiguracoes(nova: ConfiguracoesAdmin): Promise<ConfiguracoesAdmin> {
  const erros = validarConfig(nova);
  if (Object.keys(erros).length) throw new Error('A configuração tem campos inválidos. Corrija antes de salvar.');

  const salva: ConfiguracoesAdmin = clonar({
    ...nova,
    moderacao: { ...nova.moderacao, niveis: nova.moderacao.niveis.map((n, i) => ({ ...n, ordem: i + 1 })) },
  });
  // Nada mudou em relação ao que foi aberto: não cria versão nova.
  if (nova.versao === atual.versao && diferencas(atual, salva).length === 0) return clonar(atual);

  // O servidor confere se nova.versao ainda é a atual (senão responde 409 com a mensagem de conflito).
  const v = await pedir<VersaoApi>('PUT', '/api/admin/configuracoes', {
    versaoBase: nova.versao,
    esquema: ESQUEMA_CONFIG,
    salvoPor: USUARIO_ATUAL,
    dados: dados(salva),
  });
  atual = montar(v!);
  return clonar(atual);
}

// Histórico: diferença de cada versão salva para a anterior (a versão 2 compara com o padrão, versão 1).
export async function listarHistorico(): Promise<AlteracaoConfig[]> {
  const versoes = (await pedir<VersaoApi[]>('GET', '/api/admin/configuracoes/versoes?limite=200')) ?? [];
  const porVersao = new Map(versoes.map((v) => [v.versao, montar(v)]));
  const r: AlteracaoConfig[] = [];
  for (const v of [...versoes].sort((a, b) => b.versao - a.versao)) {
    const anterior = porVersao.get(v.versao - 1) ?? (v.versao === 2 ? clonar(CONFIG_PADRAO) : undefined);
    if (!anterior) continue; // versão mais antiga que o limite da listagem: sem base para comparar
    diferencas(anterior, porVersao.get(v.versao)!).forEach((m, i) =>
      r.push({ id: `${v.versao}-${i}`, quando: v.salvoEm, quem: v.salvoPor, versao: v.versao, ...m }));
  }
  return r;
}
