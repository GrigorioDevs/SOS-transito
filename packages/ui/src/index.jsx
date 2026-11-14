import { Card, CardContent, Typography, Chip, Stack } from '@mui/material';
export { theme } from './theme.js';

export function ServiceCard({ nome, descricao }) {
  return (
    <Card component="article">
      <CardContent>
        <Stack spacing={1.5}>
          <Typography component="h2" variant="h6" fontWeight={700}>{nome}</Typography>
          <Typography color="text.secondary">{descricao}</Typography>
          <Chip size="small" label="Categoria de socorro" sx={{ alignSelf: 'start' }} />
        </Stack>
      </CardContent>
    </Card>
  );
}
