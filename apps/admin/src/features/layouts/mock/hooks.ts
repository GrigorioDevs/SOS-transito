// Hooks do painel de OPERAÇÃO (ainda sem rota). Os hooks de governança ficam em src/api/hooks.ts.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarPainelOperacao, cancelarChamado, listarPendentes, responderParceiro } from './api';

// Atualiza sozinho a cada 5 s, imitando o tempo real (SignalR) do painel de operação.
export function usePainelOperacao() {
  return useQuery({ queryKey: ['op', 'painel'], queryFn: buscarPainelOperacao, refetchInterval: 5000 });
}

export function useCancelarChamado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelarChamado,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['op', 'painel'] }),
  });
}

export function usePendentes() {
  return useQuery({ queryKey: ['op', 'pendentes'], queryFn: listarPendentes });
}

export function useResponderParceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; aprovar: boolean }) => responderParceiro(v.id, v.aprovar),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['op', 'pendentes'] }),
  });
}
