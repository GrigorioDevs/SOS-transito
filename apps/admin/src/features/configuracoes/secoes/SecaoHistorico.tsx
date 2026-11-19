// H) Histórico das alterações: quem, quando, valor anterior → novo.
import { Alert, Box, Stack, Typography } from '@mui/material';
import { useHistoricoConfiguracoes } from '../../../config/hooks';
import { formatarData } from '../../../config/regras';
import type { ConfiguracoesAdmin } from '../../../config/tipos';
import { Bloco } from '../campos';

export default function SecaoHistorico({ c }: { c: ConfiguracoesAdmin }) {
  const { data = [], isPending } = useHistoricoConfiguracoes();
  return (
    <Bloco titulo="Histórico de alterações" descricao="Registro de cada mudança salva. Não pode ser editado.">
      {isPending && <Typography color="text.secondary">Carregando…</Typography>}
      {!isPending && data.length === 0 && <Alert severity="info">Nenhuma alteração salva ainda. A configuração está com os valores padrão.</Alert>}
      <Stack component="ol" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {data.map((h) => (
          <Box component="li" key={h.id} sx={{ borderLeft: 3, borderColor: 'primary.main', pl: 1.5, py: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Versão {h.versao} · {formatarData(h.quando, c)} · {h.quem}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{h.campo}</Typography>
            <Typography variant="body2" color="text.secondary">
              <Box component="span" sx={{ textDecoration: 'line-through' }}>{h.anterior}</Box> → <Box component="span" sx={{ color: 'text.primary' }}>{h.novo}</Box>
            </Typography>
          </Box>
        ))}
      </Stack>
    </Bloco>
  );
}
