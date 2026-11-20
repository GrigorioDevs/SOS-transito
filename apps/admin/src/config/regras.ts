// Regras de negócio que LEEM a configuração. As telas usam estas funções
// em vez de ter prazos e limites fixos no código.
import type { Saude } from '../api/tipos';
import type {
  ConfiguracoesAdmin, Contagem, Duracao, MetaIndicador, NivelCriticidade, Sancao,
} from './tipos';

const HORA = 3_600_000;
const DIA = 24 * HORA;

// Converte para horas (1 dia = 24h) — usado para comparar prazos de unidades diferentes.
export const emHoras = (d: Duracao) => (d.unidade === 'horas' ? d.valor : d.valor * 24);

export const textoDuracao = (d: Duracao) =>
  `${d.valor} ${d.unidade === 'horas' ? (d.valor === 1 ? 'hora' : 'horas') : d.valor === 1 ? 'dia' : 'dias'}`;

// Soma um prazo a uma data. Horas: sempre corridas. Dias úteis: pula sábado e domingo.
export function somarPrazo(inicio: Date, d: Duracao, contagem: Contagem): Date {
  if (d.unidade === 'horas' || contagem === 'corridos') return new Date(inicio.getTime() + emHoras(d) * HORA);
  const r = new Date(inicio);
  let faltam = d.valor;
  while (faltam > 0) {
    r.setDate(r.getDate() + 1);
    const dia = r.getDay();
    if (dia !== 0 && dia !== 6) faltam--;
  }
  return r;
}

// "vence em 5h", "vence em 3 dias", "vencido há 2h"
export function tempoRestante(ate: string, agora = new Date()) {
  const ms = new Date(ate).getTime() - agora.getTime();
  const abs = Math.abs(ms);
  const qtd = abs >= DIA ? `${Math.round(abs / DIA)} dia${Math.round(abs / DIA) > 1 ? 's' : ''}` : `${Math.max(1, Math.round(abs / HORA))}h`;
  return { vencido: ms < 0, horas: ms / HORA, texto: ms < 0 ? `vencido há ${qtd}` : `vence em ${qtd}` };
}

// Semáforo de um prazo: vencido = vermelho; dentro da janela do lembrete = amarelo.
export function saudePrazo(ate: string, lembrete: Duracao, agora = new Date()): Saude {
  const { vencido, horas } = tempoRestante(ate, agora);
  if (vencido) return 'r';
  return horas <= emHoras(lembrete) ? 'y' : 'g';
}

// Semáforo de um indicador segundo a meta configurada.
export function saudePorMeta(valor: number, m: MetaIndicador): Saude {
  if (m.sentido === 'maior_melhor') return valor >= m.limiteVerde ? 'g' : valor < m.limiteVermelho ? 'r' : 'y';
  return valor <= m.limiteVerde ? 'g' : valor > m.limiteVermelho ? 'r' : 'y';
}

const sufixo = (m: MetaIndicador) => (m.unidade === 'casos' ? '' : m.unidade);

export const textoMeta = (m: MetaIndicador) =>
  `meta ${m.sentido === 'maior_melhor' ? '≥' : '≤'} ${m.limiteVerde}${sufixo(m)}`;

export function textoFaixas(m: MetaIndicador) {
  const s = sufixo(m);
  return m.sentido === 'maior_melhor'
    ? { verde: `≥ ${m.limiteVerde}${s}`, amarelo: `${m.limiteVermelho}${s} a < ${m.limiteVerde}${s}`, vermelho: `< ${m.limiteVermelho}${s}` }
    : { verde: `≤ ${m.limiteVerde}${s}`, amarelo: `> ${m.limiteVerde}${s} a ${m.limiteVermelho}${s}`, vermelho: `> ${m.limiteVermelho}${s}` };
}

export const buscarMeta = (c: ConfiguracoesAdmin, id: string) => c.metas.find((m) => m.id === id);
export const nivelPorId = (c: ConfiguracoesAdmin, id: string) => c.moderacao.niveis.find((n) => n.id === id);

export function nivelDaCategoria(c: ConfiguracoesAdmin, categoriaId: string): NivelCriticidade {
  const cat = c.categorias.find((x) => x.id === categoriaId);
  const niveis = [...c.moderacao.niveis].sort((a, b) => a.ordem - b.ordem);
  return (cat && niveis.find((n) => n.id === cat.nivelId)) ?? niveis[niveis.length - 1];
}

export const sancoesAtivas = (c: ConfiguracoesAdmin) => c.sancoes.catalogo.filter((s) => s.ativa);

// Quantas decisões procedentes caem dentro de uma janela de dias.
export const procedentesNaJanela = (datas: string[], janelaDias: number, agora = new Date()) =>
  datas.filter((d) => agora.getTime() - new Date(d).getTime() <= janelaDias * DIA).length;

// Sanção sugerida pela regra de reincidência mais grave que o histórico atinge.
export function sancaoSugerida(c: ConfiguracoesAdmin, procedentes: string[], agora = new Date()): Sancao | undefined {
  const regras = [...c.sancoes.reincidencia].sort((a, b) => b.procedentes - a.procedentes);
  for (const r of regras) {
    if (procedentesNaJanela(procedentes, r.janelaDias, agora) >= r.procedentes) {
      return c.sancoes.catalogo.find((s) => s.id === r.sancaoId && s.ativa);
    }
  }
  return undefined;
}

export const maiorJanelaReincidencia = (c: ConfiguracoesAdmin) =>
  Math.max(0, ...c.sancoes.reincidencia.map((r) => r.janelaDias));

// Formata data/hora conforme o fuso e o formato da organização.
export function formatarData(iso: string, c: ConfiguracoesAdmin, comHora = true) {
  if (!iso) return '—';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: c.organizacao.fusoHorario, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  const data = c.organizacao.formatoData.replace('dd', p.day).replace('MM', p.month).replace('yyyy', p.year);
  return comHora ? `${data} ${p.hour}:${p.minute}` : data;
}
