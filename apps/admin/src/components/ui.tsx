// Peças de layout das telas: KPIs com semáforo, barra de filtros, busca e painel lateral de detalhe.
import { useEffect, useState, type ReactNode } from 'react';
import { Box, Drawer, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { Ic, rotuloSaude } from '../features/layouts/components/graficos';
import type { Kpi } from '../api/tipos';

export function Kpis({ itens, destacarPrimeiro = false }: { itens: Kpi[]; destacarPrimeiro?: boolean }) {
  return (
    <section className={`kpis k${itens.length}`} aria-label="Indicadores">
      {itens.map((k, i) => (
        <div key={k.id} className={`kpi ${destacarPrimeiro && i === 0 ? 'hl' : ''}`}>
          <div className="l">
            {k.saude && <i className={`dot ${k.saude}`} role="img" aria-label={rotuloSaude[k.saude]} title={rotuloSaude[k.saude]} />}
            {k.label}
          </div>
          <div className="v">{k.value}</div>
          <div className="s">{k.sub}</div>
        </div>
      ))}
    </section>
  );
}

export function Filtros({ children }: { children: ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap role="search"
      sx={{ flexWrap: 'wrap', alignItems: { sm: 'center' }, mb: 2, '& > .MuiFormControl-root': { minWidth: { sm: 170 }, width: { xs: '100%', sm: 'auto' } } }}>
      {children}
    </Stack>
  );
}

export function Busca({ valor, onChange, rotulo }: { valor: string; onChange: (v: string) => void; rotulo: string }) {
  return (
    <TextField
      label={rotulo} value={valor} onChange={(e) => onChange(e.target.value)} type="search"
      sx={{ flex: { sm: '1 1 240px' }, maxWidth: { sm: 380 } }}
      slotProps={{ input: { startAdornment: <InputAdornment position="start"><Ic n="search" s={16} /></InputAdornment> } }}
    />
  );
}

export function PainelLateral({ aberto, onFechar, titulo, subtitulo, children }: {
  aberto: boolean; onFechar: () => void; titulo: ReactNode; subtitulo?: ReactNode; children: ReactNode;
}) {
  return (
    <Drawer anchor="right" open={aberto} onClose={onFechar}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 540, lg: 620 }, bgcolor: 'background.default', backgroundImage: 'none' }, role: 'dialog', 'aria-labelledby': 'painel-lateral-titulo' } as object }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', p: 2, borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.default', zIndex: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="painel-lateral-titulo" component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>{titulo}</Typography>
          {subtitulo && <Typography variant="body2" color="text.secondary">{subtitulo}</Typography>}
        </Box>
        <IconButton onClick={onFechar} aria-label="Fechar"><Ic n="x" s={18} /></IconButton>
      </Stack>
      <Box sx={{ p: 2, pb: 6 }}>{children}</Box>
    </Drawer>
  );
}

// Par rótulo/valor nos painéis de detalhe.
export function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" component="div">{rotulo}</Typography>
      <Typography variant="body2" component="div" sx={{ overflowWrap: 'anywhere' }}>{children}</Typography>
    </Box>
  );
}

export function Grade({ children, min = 150 }: { children: ReactNode; min?: number }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 1.5 }}>{children}</Box>;
}

// Pior saúde de uma lista (r > y > g).
export const piorSaude = (l: ('r' | 'y' | 'g' | undefined)[]) => (l.includes('r') ? 'r' : l.includes('y') ? 'y' : 'g');

// Valor "atrasado" para não consultar a API a cada tecla digitada na busca.
export function useAtrasado<T>(valor: T, ms = 300) {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}
