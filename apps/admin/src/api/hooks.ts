// Hooks TanStack Query de todas as telas. As telas importam SÓ daqui (nunca do mock/seed).
// Na troca pelo back-end, só os arquivos de api mudam; estes hooks continuam iguais.
// Todas as chaves começam com 'gov': salvar a configuração ou qualquer ação recalcula tudo.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarAuditoria, restaurarDemonstracao } from './auditoria';
import { listarAvaliacoes, moderarAvaliacao, resumoAvaliacoes, type AcaoAvaliacao } from './avaliacoes';
import { decidirCaso, listarCasos, simularDenuncia, type AcaoCaso } from './casos';
import { enviarAuditoria } from './nucleo';
import { buscarPainelGovernanca, buscarPendencias } from './painel';
import { buscarRetencao } from './retencao';
import { decidirBloqueioPendente, decidirRecurso, listarSancoes, resumoSancoes, reverterSancao } from './sancoes';
import { buscarUsuario, listarUsuarios, reativarUsuario, sancionarUsuario } from './usuarios';
import type { AbaSancoes, FiltroAuditoria, FiltroAvaliacoes, FiltroUsuarios, Segmento } from './tipos';

// Toda ação só é dada como concluída depois que o registro de auditoria chegou ao servidor.
function useAcao<V, R = unknown>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: V) => {
      const r = await fn(v);
      try {
        await enviarAuditoria();
      } catch {
        throw new Error('A ação foi feita, mas o registro na auditoria não chegou ao servidor. Ele será reenviado assim que a API responder.');
      }
      return r;
    },
    // onSettled: a tela reflete a ação mesmo quando só o envio da auditoria falhou.
    onSettled: () => qc.invalidateQueries({ queryKey: ['gov'] }),
  });
}

/* Visão geral e menu */
export const usePainelGovernanca = (segmento: Segmento) =>
  useQuery({ queryKey: ['gov', 'painel', segmento], queryFn: () => buscarPainelGovernanca(segmento), placeholderData: keepPreviousData });
export const usePendencias = () =>
  useQuery({ queryKey: ['gov', 'pendencias'], queryFn: buscarPendencias, refetchInterval: 60_000 });

/* Denúncias */
export const useCasos = () => useQuery({ queryKey: ['gov', 'casos'], queryFn: listarCasos, refetchInterval: 60_000 });
export const useDecidirCaso = () =>
  useAcao((v: { id: string; acao: AcaoCaso; justificativa: string }) => decidirCaso(v.id, v.acao, v.justificativa));
export const useSimularDenuncia = () => useAcao(() => simularDenuncia());

/* Usuários */
export const useUsuarios = (f: FiltroUsuarios) =>
  useQuery({ queryKey: ['gov', 'usuarios', f], queryFn: () => listarUsuarios(f), placeholderData: keepPreviousData });
export const useUsuario = (id: string | null) =>
  useQuery({ queryKey: ['gov', 'usuario', id], queryFn: () => buscarUsuario(id!), enabled: Boolean(id) });
export const useSancionarUsuario = () =>
  useAcao((v: { id: string; sancaoId: string; justificativa: string }) => sancionarUsuario(v.id, v.sancaoId, v.justificativa));
export const useReativarUsuario = () =>
  useAcao((v: { id: string; justificativa: string }) => reativarUsuario(v.id, v.justificativa));

/* Bloqueios */
export const useSancoes = (aba: AbaSancoes) =>
  useQuery({ queryKey: ['gov', 'sancoes', aba], queryFn: () => listarSancoes(aba), placeholderData: keepPreviousData });
export const useResumoSancoes = () => useQuery({ queryKey: ['gov', 'sancoes', 'resumo'], queryFn: resumoSancoes });
export const useReverterSancao = () =>
  useAcao((v: { id: string; justificativa: string }) => reverterSancao(v.id, v.justificativa));
export const useDecidirBloqueio = () =>
  useAcao((v: { id: string; aprovar: boolean; justificativa: string }) => decidirBloqueioPendente(v.id, v.aprovar, v.justificativa));
export const useDecidirRecurso = () =>
  useAcao((v: { id: string; aceitar: boolean; justificativa: string }) => decidirRecurso(v.id, v.aceitar, v.justificativa));

/* Retenção */
export const useRetencao = (segmento: Segmento) =>
  useQuery({ queryKey: ['gov', 'retencao', segmento], queryFn: () => buscarRetencao(segmento), placeholderData: keepPreviousData });

/* Avaliações */
export const useResumoAvaliacoes = (segmento: Segmento, dias: number) =>
  useQuery({ queryKey: ['gov', 'avaliacoes', 'resumo', segmento, dias], queryFn: () => resumoAvaliacoes(segmento, dias), placeholderData: keepPreviousData });
export const useAvaliacoes = (f: FiltroAvaliacoes) =>
  useQuery({ queryKey: ['gov', 'avaliacoes', 'lista', f], queryFn: () => listarAvaliacoes(f), placeholderData: keepPreviousData });
export const useModerarAvaliacao = () =>
  useAcao((v: { id: string; acao: AcaoAvaliacao; justificativa: string }) => moderarAvaliacao(v.id, v.acao, v.justificativa));

/* Auditoria */
export const useAuditoria = (f: FiltroAuditoria = {}) =>
  useQuery({ queryKey: ['gov', 'auditoria', f], queryFn: () => listarAuditoria(f), placeholderData: keepPreviousData });
export const useRestaurarDemonstracao = () => useAcao(() => restaurarDemonstracao());

export type { AcaoCaso, AcaoAvaliacao };
export { SEGUNDO_ADMIN } from './casos';
export { aprovadorDe } from './sancoes';
export { USUARIO_ATUAL } from './nucleo';
