// API da auditoria: quem, quando, o quê e por quê.
// Junta três fontes numa lista só:
//   1. eventos gravados no servidor (GET /api/admin/auditoria) — tudo o que é feito no painel;
//   2. eventos de exemplo dos dados de demonstração (locais, somem quando a demonstração for removida);
//   3. alterações de configuração, montadas a partir das versões salvas no servidor.
import { listarHistorico } from '../config/api';
import { db, recriarDemonstracao } from './armazenamento';
import { DIA, normalizar } from './dominio';
import { consulta, pedir } from './http';
import { enviarAuditoria, rede } from './nucleo';
import type { EventoAuditoria, FiltroAuditoria } from './tipos';

interface EventoApi { id: number; quando: string; quem: string; area: EventoAuditoria['area']; acao: string; alvo?: string | null; motivo?: string | null; ref?: string | null }

const doServidor = (e: EventoApi): EventoAuditoria => ({
  id: `AUD-${e.id}`,
  quando: new Date(e.quando).toISOString(),
  quem: e.quem,
  area: e.area,
  acao: e.acao,
  alvo: e.alvo ?? undefined,
  motivo: e.motivo ?? undefined,
  ref: e.ref ?? undefined,
});

async function eventosDeConfiguracao(): Promise<EventoAuditoria[]> {
  const hist = await listarHistorico();
  const porVersao = new Map<number, typeof hist>();
  for (const h of hist) porVersao.set(h.versao, [...(porVersao.get(h.versao) ?? []), h]);
  return [...porVersao.entries()].map(([versao, itens]) => ({
    id: `CFG-${versao}`,
    quando: itens[0].quando,
    quem: itens[0].quem,
    area: 'configuracao' as const,
    acao: `Alterou as configurações (versão ${versao})`,
    alvo: `${itens.length} campo${itens.length > 1 ? 's' : ''}`,
    motivo: itens.slice(0, 4).map((i) => `${i.campo}: ${i.anterior} → ${i.novo}`).join(' · ') + (itens.length > 4 ? ' · …' : ''),
    ref: 'configuracoes',
  }));
}

export async function listarAuditoria(f: FiltroAuditoria = {}): Promise<EventoAuditoria[]> {
  // Garante que ações recém-feitas já estão no servidor antes de listar.
  await enviarAuditoria();
  const area = f.area && f.area !== 'todas' ? f.area : undefined;
  const quem = f.quem && f.quem !== 'todos' ? f.quem : undefined;
  const [servidor, config] = await Promise.all([
    pedir<EventoApi[]>('GET', `/api/admin/auditoria${consulta({ area, quem, dias: f.dias, limite: 2000 })}`),
    eventosDeConfiguracao(),
  ]);
  // A busca por texto fica aqui: ignora acentos e maiúsculas, como no resto do painel.
  const termo = normalizar(f.busca?.trim() ?? '');
  const desde = f.dias ? Date.now() - f.dias * DIA : 0;
  return [...(servidor ?? []).map(doServidor), ...db().auditoria, ...config]
    .filter((e) => !area || e.area === area)
    .filter((e) => !quem || e.quem === quem)
    .filter((e) => !desde || new Date(e.quando).getTime() >= desde)
    .filter((e) => !termo || normalizar(`${e.quem} ${e.acao} ${e.alvo ?? ''} ${e.motivo ?? ''} ${e.ref ?? ''}`).includes(termo))
    .sort((a, b) => b.quando.localeCompare(a.quando));
}

// Só para a demonstração: volta os dados fictícios ao estado inicial, relativos a agora.
// Não apaga a configuração nem os registros de auditoria gravados no servidor (são só de inclusão).
export async function restaurarDemonstracao() {
  await rede();
  recriarDemonstracao();
}
