// Prazo que está correndo agora para o caso (defesa ou decisão) e a cor do semáforo.
// Usa os prazos gravados no caso (snapshot), nunca a configuração atual.
import { saudePrazo, tempoRestante } from '../../config/regras';
import { SEGUNDO_ADMIN } from '../../api/hooks';
import type { Caso, Saude } from '../../api/tipos';

export function prazoDoCaso(c: Caso): { texto: string; saude?: Saude; ate?: string } {
  if (c.status === 'resolvido') return { texto: c.decisao ?? 'decidido' };
  if (c.status === 'aguardando_2a') return { texto: `aguarda 2ª aprovação (${c.bloqueioPendente?.solicitadoPor === SEGUNDO_ADMIN ? 'você' : SEGUNDO_ADMIN})` };
  const ate = c.status === 'aguardando' && c.defesaAte ? c.defesaAte : c.decisaoAte;
  const rotulo = c.status === 'aguardando' ? 'defesa' : 'decisão';
  return { texto: `${rotulo}: ${tempoRestante(ate).texto}`, saude: saudePrazo(ate, c.prazos.lembrete), ate };
}

export const casoVencido = (c: Caso) => c.status !== 'resolvido' && prazoDoCaso(c).saude === 'r';
