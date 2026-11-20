// B) Categorias de denúncia, cada uma com a criticidade padrão (nível da seção A).
import { Alert, Box, Button, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField } from '@mui/material';
import Add from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { Bloco, BolinhaCor, novoId, type PropsSecao } from '../campos';

export default function SecaoCategorias({ c, mudar, erro }: PropsSecao) {
  return (
    <Bloco titulo="Categorias de denúncia" descricao="A criticidade define os prazos que o caso recebe ao ser aberto. Categoria inativa não aparece para quem denuncia.">
      <Stack spacing={2}>
        {erro('categorias') && <Alert severity="error">{erro('categorias')}</Alert>}
        {c.categorias.map((cat, i) => {
          const p = `categorias.${i}`;
          return (
            <Box key={cat.id} sx={{ display: 'grid', gap: 1.5, alignItems: 'start', gridTemplateColumns: { xs: '1fr auto', sm: '2fr 1.4fr auto auto' } }}>
              <TextField label="Nome" value={cat.nome} error={Boolean(erro(`${p}.nome`))} helperText={erro(`${p}.nome`)}
                onChange={(e) => mudar((x) => { x.categorias[i].nome = e.target.value; })} sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }} />
              <TextField select label="Criticidade" value={cat.nivelId} error={Boolean(erro(`${p}.nivelId`))} helperText={erro(`${p}.nivelId`)}
                onChange={(e) => mudar((x) => { x.categorias[i].nivelId = e.target.value; })}>
                {c.moderacao.niveis.map((n) => (
                  <MenuItem key={n.id} value={n.id}><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><BolinhaCor cor={n.cor} /><span>{n.nome || '(sem nome)'}</span></Stack></MenuItem>
                ))}
              </TextField>
              <FormControlLabel sx={{ m: 0 }} label="Ativa"
                control={<Switch checked={cat.ativa} onChange={(_, v) => mudar((x) => { x.categorias[i].ativa = v; })} />} />
              <IconButton aria-label={`Excluir ${cat.nome}`} onClick={() => mudar((x) => { x.categorias.splice(i, 1); })}><DeleteOutline /></IconButton>
            </Box>
          );
        })}
        <Button startIcon={<Add />} sx={{ alignSelf: 'flex-start' }} onClick={() => mudar((x) => {
          x.categorias.push({ id: novoId('cat'), nome: '', nivelId: x.moderacao.niveis[x.moderacao.niveis.length - 1]?.id ?? '', ativa: true });
        })}>Adicionar categoria</Button>
      </Stack>
    </Bloco>
  );
}
