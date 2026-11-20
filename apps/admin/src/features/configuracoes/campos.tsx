// Campos reaproveitáveis da tela de Configurações (MUI).
import type { ChangeEvent, ReactNode } from 'react';
import { Box, Button, IconButton, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import type { ConfiguracoesAdmin, Duracao, Unidade } from '../../config/tipos';

export interface PropsSecao {
  c: ConfiguracoesAdmin;
  mudar: (fn: (c: ConfiguracoesAdmin) => void) => void;
  erro: (caminho: string) => string | undefined;
}

export const novoId = (prefixo: string) => `${prefixo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function mover<T>(lista: T[], de: number, para: number) {
  if (para < 0 || para >= lista.length) return;
  const [item] = lista.splice(de, 1);
  lista.splice(para, 0, item);
}

export function Bloco({ titulo, descricao, acao, children }: { titulo: ReactNode; descricao?: ReactNode; acao?: ReactNode; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>{titulo}</Typography>
          {descricao && <Typography variant="body2" color="text.secondary">{descricao}</Typography>}
        </Box>
        {acao}
      </Stack>
      {children}
    </Paper>
  );
}

export function Grade({ children, colunas = 3 }: { children: ReactNode; colunas?: number }) {
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: `repeat(${colunas}, minmax(0, 1fr))` } }}>
      {children}
    </Box>
  );
}

export function CampoNumero({ rotulo, valor, onChange, erro, ajuda, sufixo, min, max }: {
  rotulo: string; valor: number | undefined; onChange: (v: number) => void;
  erro?: string; ajuda?: string; sufixo?: string; min?: number; max?: number;
}) {
  return (
    <TextField
      type="number"
      label={rotulo}
      value={valor !== undefined && Number.isFinite(valor) ? valor : ''}
      onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
      error={Boolean(erro)}
      helperText={erro ?? ajuda}
      slotProps={{
        htmlInput: { min, max, inputMode: 'numeric' },
        input: sufixo ? { endAdornment: <InputAdornment position="end">{sufixo}</InputAdornment> } : undefined,
      }}
    />
  );
}

export function CampoDuracao({ rotulo, valor, onChange, erro, ajuda }: {
  rotulo: string; valor: Duracao; onChange: (v: Duracao) => void; erro?: string; ajuda?: string;
}) {
  return (
    <Box>
      <Stack direction="row" spacing={1}>
        <CampoNumero rotulo={rotulo} valor={valor.valor} onChange={(v) => onChange({ ...valor, valor: v })} erro={erro ? ' ' : undefined} min={0} />
        <TextField select label="Unidade" value={valor.unidade} sx={{ width: 110, flex: 'none' }}
          onChange={(e) => onChange({ ...valor, unidade: e.target.value as Unidade })}>
          <MenuItem value="dias">dias</MenuItem>
          <MenuItem value="horas">horas</MenuItem>
        </TextField>
      </Stack>
      {(erro || ajuda) && (
        <Typography variant="caption" color={erro ? 'error' : 'text.secondary'} sx={{ display: 'block', mx: 1.75, mt: 0.5 }}>{erro ?? ajuda}</Typography>
      )}
    </Box>
  );
}

export function CampoCor({ rotulo, valor, onChange, erro }: { rotulo: string; valor: string; onChange: (v: string) => void; erro?: string }) {
  return (
    <TextField
      label={rotulo}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      error={Boolean(erro)}
      helperText={erro}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Box component="input" type="color" aria-label={`${rotulo} (seletor)`} value={/^#[0-9a-fA-F]{6}$/.test(valor) ? valor : '#000000'}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value.toUpperCase())}
                sx={{ width: 28, height: 28, p: 0, border: 0, background: 'none', cursor: 'pointer' }} />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function ListaTextos({ rotulo, itens, onChange, erro, caminho, rotuloNovo }: {
  rotulo: string; itens: string[]; onChange: (v: string[]) => void;
  erro: (c: string) => string | undefined; caminho: string; rotuloNovo: string;
}) {
  return (
    <Stack spacing={1.5}>
      {itens.map((t, i) => (
        <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <TextField label={`${rotulo} ${i + 1}`} value={t} error={Boolean(erro(`${caminho}.${i}`))} helperText={erro(`${caminho}.${i}`)}
            onChange={(e) => onChange(itens.map((x, j) => (j === i ? e.target.value : x)))} />
          <IconButton aria-label={`Remover ${t || 'item'}`} onClick={() => onChange(itens.filter((_, j) => j !== i))}><DeleteOutline /></IconButton>
        </Stack>
      ))}
      {erro(caminho) && <Typography variant="caption" color="error">{erro(caminho)}</Typography>}
      <Button startIcon={<Add />} sx={{ alignSelf: 'flex-start' }} onClick={() => onChange([...itens, ''])}>{rotuloNovo}</Button>
    </Stack>
  );
}

export const BolinhaCor = ({ cor }: { cor: string }) => (
  <Box component="span" aria-hidden sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: cor, display: 'inline-block', flex: 'none' }} />
);
