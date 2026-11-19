// E) Metas do semáforo de saúde. Valem ao vivo: o painel recalcula as cores ao salvar.
import { Box, Chip, MenuItem, Stack, TextField } from '@mui/material';
import { textoFaixas } from '../../../config/regras';
import type { Sentido } from '../../../config/tipos';
import { Bloco, CampoNumero, type PropsSecao } from '../campos';

const sufixo = { '%': '%', h: 'h', casos: 'casos' } as const;

export default function SecaoMetas({ c, mudar, erro }: PropsSecao) {
  return (
    <Stack spacing={2}>
      {c.metas.map((m, i) => {
        const p = `metas.${i}`;
        const temErro = Boolean(erro(`${p}.limiteVerde`) || erro(`${p}.limiteVermelho`));
        const f = textoFaixas(m);
        return (
          <Bloco key={m.id} titulo={m.nome}>
            <Box sx={{ display: 'grid', gap: 2, alignItems: 'start', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' } }}>
              <TextField select label="Sentido" value={m.sentido} onChange={(e) => mudar((x) => { x.metas[i].sentido = e.target.value as Sentido; })}>
                <MenuItem value="maior_melhor">Maior é melhor</MenuItem>
                <MenuItem value="menor_melhor">Menor é melhor</MenuItem>
              </TextField>
              <CampoNumero rotulo="Limite do verde" sufixo={sufixo[m.unidade]} valor={m.limiteVerde} min={0}
                erro={erro(`${p}.limiteVerde`)} onChange={(v) => mudar((x) => { x.metas[i].limiteVerde = v; })} />
              <CampoNumero rotulo="Limite do vermelho" sufixo={sufixo[m.unidade]} valor={m.limiteVermelho} min={0}
                erro={erro(`${p}.limiteVermelho`)} onChange={(v) => mudar((x) => { x.metas[i].limiteVermelho = v; })} />
            </Box>
            {!temErro && (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
                <Chip size="small" label={`Verde ${f.verde}`} sx={{ bgcolor: '#25C78A22', color: 'success.main' }} />
                <Chip size="small" label={`Amarelo ${f.amarelo}`} sx={{ bgcolor: '#FFA94022', color: 'warning.main' }} />
                <Chip size="small" label={`Vermelho ${f.vermelho}`} sx={{ bgcolor: '#FF525222', color: 'error.main' }} />
              </Stack>
            )}
          </Bloco>
        );
      })}
    </Stack>
  );
}
