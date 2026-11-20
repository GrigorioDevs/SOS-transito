// Hooks TanStack Query da configuração. As telas leem prazos, limites e regras daqui.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buscarConfiguracoes, listarHistorico, salvarConfiguracoes } from './api';
import type { ConfiguracoesAdmin } from './tipos';

export function useConfiguracoes() {
  return useQuery({ queryKey: ['config'], queryFn: buscarConfiguracoes, staleTime: Infinity });
}

export function useSalvarConfiguracoes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: ConfiguracoesAdmin) => salvarConfiguracoes(c),
    onSuccess: (salva) => {
      qc.setQueryData(['config'], salva);
      qc.invalidateQueries({ queryKey: ['config', 'historico'] });
      qc.invalidateQueries({ queryKey: ['gov'] }); // metas do semáforo valem ao vivo
    },
  });
}

export function useHistoricoConfiguracoes() {
  return useQuery({ queryKey: ['config', 'historico'], queryFn: listarHistorico });
}
