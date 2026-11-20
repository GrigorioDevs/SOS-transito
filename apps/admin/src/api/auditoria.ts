// API FICTÍCIA da auditoria: quem, quando, o quê e por quê.
// Inclui as alterações de configuração (agrupadas por versão). Back-end: GET /api/admin/auditoria.
import { listarHistorico } from '../config/api';
import { db, recriarDemonstracao } from './armazenamento';
import { DIA, normalizar } from './dominio';
import { rede } from './nucleo';
import type { EventoAuditoria, FiltroAuditoria } from './tipos';

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
  await rede();
  const termo = normalizar(f.busca?.trim() ?? '');
  const desde = f.dias ? Date.now() - f.dias * DIA : 0;
  return [...db().auditoria, ...(await eventosDeConfiguracao())]
    .filter((e) => !f.area || f.area === 'todas' || e.area === f.area)
    .filter((e) => !f.quem || f.quem === 'todos' || e.quem === f.quem)
    .filter((e) => !desde || new Date(e.quando).getTime() >= desde)
    .filter((e) => !termo || normalizar(`${e.quem} ${e.acao} ${e.alvo ?? ''} ${e.motivo ?? ''} ${e.ref ?? ''}`).includes(termo))
    .sort((a, b) => b.quando.localeCompare(a.quando));
}

// Só para a demonstração: volta todos os dados fictícios ao estado inicial, relativos a agora.
// A configuração não é apagada.
export async function restaurarDemonstracao() {
  await rede();
  recriarDemonstracao();
}
