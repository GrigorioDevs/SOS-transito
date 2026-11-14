import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { listarServicos } from '@sos/api-client';
import { ServiceCard } from '@sos/ui';

export default function CatalogoPage() {
  const { data = [], isPending, isError, error, refetch } = useQuery({
    queryKey: ['servicos'],
    queryFn: ({ signal }) => listarServicos({ signal }),
    staleTime: 60_000,
    retry: 1,
  });
  if (isPending) return <Stack role="status" direction="row" spacing={2}><CircularProgress size={24} /><Typography>Carregando serviços...</Typography></Stack>;
  if (isError) return <Alert severity="error" action={<Button color="inherit" onClick={() => refetch()}>Tentar novamente</Button>}>{error.message}</Alert>;
  if (data.length === 0) return <Alert severity="warning">Nenhum serviço disponível no momento.</Alert>;
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>{data.map(s => <ServiceCard key={s.id} nome={s.nome} descricao={s.descricao} />)}</Box>;
}
