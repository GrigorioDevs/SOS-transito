// Estados padrão de toda tela: carregando, vazio e erro (com "Tentar novamente").
import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { Ic, type NomeIcone } from '../features/layouts/components/graficos';

export function Carregando({ texto = 'Carregando…', compacto = false }: { texto?: string; compacto?: boolean }) {
  return (
    <Stack role="status" aria-live="polite" direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', py: compacto ? 3 : 8, color: 'text.secondary' }}>
      <CircularProgress size={20} color="inherit" aria-hidden />
      <Typography variant="body2">{texto}</Typography>
    </Stack>
  );
}

export function Vazio({ titulo, texto, icone = 'search', acao }: { titulo: string; texto?: string; icone?: NomeIcone; acao?: ReactNode }) {
  return (
    <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', py: 6, px: 2, color: 'text.secondary' }}>
      <Ic n={icone} s={30} />
      <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700 }}>{titulo}</Typography>
      {texto && <Typography variant="body2" sx={{ maxWidth: 420 }}>{texto}</Typography>}
      {acao}
    </Stack>
  );
}

export function ErroCarga({ erro, onTentar }: { erro: Error | null; onTentar?: () => void }) {
  return (
    <Alert severity="error" role="alert" action={onTentar && <Button color="inherit" size="small" onClick={onTentar}>Tentar novamente</Button>}>
      {erro?.message ?? 'Não foi possível carregar os dados.'}
    </Alert>
  );
}

// Envolve uma consulta: mostra carregando/erro/vazio e, com dados, chama children(dados).
export function Consulta<T>({ q, vazio, vazioTitulo = 'Nada por aqui', vazioTexto, vazioAcao, carregando, children }: {
  q: UseQueryResult<T, Error>;
  vazio?: (d: T) => boolean;
  vazioTitulo?: string;
  vazioTexto?: string;
  vazioAcao?: ReactNode;
  carregando?: string;
  children: (d: T) => ReactNode;
}) {
  if (q.isPending) return <Carregando texto={carregando} />;
  if (q.isError && q.data === undefined) return <ErroCarga erro={q.error} onTentar={() => q.refetch()} />;
  const d = q.data as T;
  return (
    <>
      {q.isError && <Box sx={{ mb: 1.5 }}><ErroCarga erro={q.error} onTentar={() => q.refetch()} /></Box>}
      {vazio?.(d) ? <Vazio titulo={vazioTitulo} texto={vazioTexto} acao={vazioAcao} /> : children(d)}
    </>
  );
}

// Cartão com título usado pelas telas novas (mesma aparência dos cartões da Visão geral).
export function Cartao({ titulo, icone, extra, children, id }: { titulo?: ReactNode; icone?: NomeIcone; extra?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <Paper variant="outlined" component="section" aria-labelledby={id} sx={{ p: { xs: 1.5, sm: 2.25 }, borderRadius: 4, minWidth: 0 }}>
      {(titulo || extra) && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', mb: 1.5, flexWrap: 'wrap' }}>
          {icone && <Box sx={{ color: 'text.secondary', display: 'flex' }}><Ic n={icone} s={18} /></Box>}
          {titulo && <Typography id={id} component="h2" sx={{ fontSize: 15, fontWeight: 700 }}>{titulo}</Typography>}
          {extra && <Box sx={{ ml: 'auto' }}>{extra}</Box>}
        </Stack>
      )}
      {children}
    </Paper>
  );
}
