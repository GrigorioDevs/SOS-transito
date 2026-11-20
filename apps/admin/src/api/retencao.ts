// API FICTÍCIA de retenção (entradas, saídas e churn).
// "Saiu" = sem usar o app há X dias (Configurações › Retenção). Back-end: GET /api/admin/retencao?segmento=.
import type { ConfiguracoesAdmin } from '../config/tipos';
import { db } from './armazenamento';
import { DIA, indexarSancoes, resumirUsuario, saidaEm } from './dominio';
import { configAtual, rede } from './nucleo';
import type { Retencao, Segmento, TipoUsuario, Usuario } from './tipos';

const SEMANAS = 8;

const pct1 = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

function rotuloSemana(ms: number, cfg: ConfiguracoesAdmin) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: cfg.organizacao.fusoHorario }).format(new Date(ms));
}

// Churn de 30 dias: saídas no período ÷ usuários que estavam ativos no início do período.
function churn(lista: Usuario[], N: number, agora: number) {
  const inicio = agora - 30 * DIA;
  let base = 0, sairam = 0;
  for (const u of lista) {
    if (new Date(u.criadoEm).getTime() > inicio) continue;
    const s = saidaEm(u, N, agora);
    if (s !== null && s < inicio) continue;
    base++;
    if (s !== null) sairam++;
  }
  return pct1(sairam, base);
}

export function calcularRetencao(usuarios: Usuario[], cfg: ConfiguracoesAdmin, segmento: Segmento, agora = Date.now()) {
  const N = cfg.retencao.diasSemUsoParaSaida;
  const doTipo = (t: TipoUsuario) => usuarios.filter((u) => u.tipo === t);
  const lista = segmento === 'todos' ? usuarios : doTipo(segmento === 'clientes' ? 'cliente' : 'prestador');
  const inicio = agora - SEMANAS * 7 * DIA;
  const entradas = Array(SEMANAS).fill(0) as number[];
  const saidas = Array(SEMANAS).fill(0) as number[];
  const semana = (t: number) => Math.floor((t - inicio) / (7 * DIA));
  let ativos = 0;
  const sairam: { u: Usuario; em: number }[] = [];
  for (const u of lista) {
    const c = new Date(u.criadoEm).getTime();
    if (c >= inicio) entradas[Math.min(SEMANAS - 1, semana(c))]++;
    const s = saidaEm(u, N, agora);
    if (s === null) ativos++;
    else {
      if (s >= inicio) saidas[Math.min(SEMANAS - 1, semana(s))]++;
      sairam.push({ u, em: s });
    }
  }
  // Motivos: a lista oferecida vem da configuração; respostas fora dela entram em "Outros".
  const recentes = sairam.filter((x) => x.em >= agora - 30 * DIA);
  const oferecidos = cfg.retencao.motivosSaida;
  const contagem = new Map<string, number>();
  let semResposta = 0;
  for (const { u } of recentes) {
    if (!u.motivoSaida) { semResposta++; continue; }
    const m = oferecidos.includes(u.motivoSaida) ? u.motivoSaida : 'Outros';
    contagem.set(m, (contagem.get(m) ?? 0) + 1);
  }
  const respondidos = recentes.length - semResposta;
  const motivos = [...contagem.entries()].map(([motivo, qtd]) => ({ motivo, qtd, pct: Math.round(pct1(qtd, respondidos)) })).sort((a, b) => b.qtd - a.qtd);
  const anterior = entradas[SEMANAS - 2];
  const churnClientes = churn(doTipo('cliente'), N, agora);
  const churnPrestadores = churn(doTipo('prestador'), N, agora);
  return {
    semanas: entradas.map((_, i) => rotuloSemana(inicio + i * 7 * DIA, cfg)),
    entradas, saidas,
    novos7d: entradas[SEMANAS - 1],
    saidas7d: saidas[SEMANAS - 1],
    novosVariacao: anterior ? Math.round(((entradas[SEMANAS - 1] - anterior) / anterior) * 100) : null,
    churnClientes, churnPrestadores,
    churn: segmento === 'clientes' ? churnClientes : segmento === 'prestadores' ? churnPrestadores : churn(usuarios, N, agora),
    baseAtiva: ativos,
    diasSemUso: N,
    motivos, semResposta,
    sairam: sairam.sort((a, b) => b.em - a.em),
  };
}

export async function buscarRetencao(segmento: Segmento): Promise<Retencao> {
  await rede();
  const b = db();
  const cfg = configAtual();
  const agora = Date.now();
  const { sairam, ...r } = calcularRetencao(b.usuarios, cfg, segmento, agora);
  const idx = indexarSancoes(b.sancoes);
  return { segmento, ...r, recentes: sairam.slice(0, 100).map(({ u }) => resumirUsuario(u, idx.get(u.id) ?? [], cfg, agora)) };
}
