// Tabela no PC/tablet e lista de cartões no celular, com paginação opcional.
// Colunas secundárias somem no tablet (esconder: 'md') para não haver rolagem lateral.
import type { ReactNode } from 'react';
import {
  Box, ButtonBase, Paper, Stack, Table, TableBody, TableCell, TableHead, TablePagination, TableRow,
  useMediaQuery, useTheme,
} from '@mui/material';

export interface Coluna<T> {
  id: string;
  titulo: ReactNode;
  celula: (linha: T) => ReactNode;
  esconder?: 'md' | 'lg';
  alinhar?: 'right' | 'center';
  largura?: number | string;
}

interface Props<T> {
  rotulo: string;
  linhas: T[];
  colunas: Coluna<T>[];
  chave: (linha: T) => string;
  cartao: (linha: T) => ReactNode;
  onAbrir?: (linha: T) => void;
  rotuloAbrir?: (linha: T) => string;
  total?: number;
  pagina?: number;
  porPagina?: number;
  onPagina?: (p: number) => void;
}

const exibir = (e?: 'md' | 'lg') => (e ? { display: { xs: 'none', [e]: 'table-cell' } } : undefined);

export function TabelaResponsiva<T>(p: Props<T>) {
  const tema = useTheme();
  const celular = useMediaQuery(tema.breakpoints.down('sm'));
  const paginado = p.total !== undefined && p.onPagina && p.porPagina;

  return (
    <Box sx={{ minWidth: 0 }}>
      {celular ? (
        <Stack component="ul" aria-label={p.rotulo} spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {p.linhas.map((l) => (
            <Box component="li" key={p.chave(l)}>
              {p.onAbrir ? (
                <ButtonBase onClick={() => p.onAbrir!(l)} aria-label={p.rotuloAbrir?.(l)} focusRipple
                  sx={{ width: '100%', textAlign: 'left', borderRadius: 3, display: 'block', '&:focus-visible': { outline: '2px solid #FFC928', outlineOffset: 2 } }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, bgcolor: '#193653' }}>{p.cartao(l)}</Paper>
                </ButtonBase>
              ) : (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, bgcolor: '#193653' }}>{p.cartao(l)}</Paper>
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label={p.rotulo} sx={{ '& td, & th': { borderColor: 'divider', px: 1, '&:first-of-type': { pl: 0 } } }}>
            <TableHead>
              <TableRow>
                {p.colunas.map((c) => (
                  <TableCell key={c.id} align={c.alinhar} sx={{ color: 'text.secondary', fontWeight: 500, fontSize: 12, width: c.largura, ...exibir(c.esconder) }}>{c.titulo}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {p.linhas.map((l) => (
                <TableRow key={p.chave(l)} hover onClick={p.onAbrir ? () => p.onAbrir!(l) : undefined} sx={{ cursor: p.onAbrir ? 'pointer' : undefined }}>
                  {p.colunas.map((c) => (
                    <TableCell key={c.id} align={c.alinhar} sx={{ fontSize: 13, py: 1.25, verticalAlign: 'middle', ...exibir(c.esconder) }}>{c.celula(l)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      {paginado && p.total! > p.porPagina! && (
        <TablePagination
          component="div" count={p.total!} page={p.pagina ?? 0} rowsPerPage={p.porPagina!} rowsPerPageOptions={[]}
          onPageChange={(_, n) => p.onPagina!(n)}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          getItemAriaLabel={(t) => (t === 'next' ? 'Próxima página' : t === 'previous' ? 'Página anterior' : t === 'first' ? 'Primeira página' : 'Última página')}
          sx={{ '& .MuiTablePagination-toolbar': { px: 0 } }}
        />
      )}
    </Box>
  );
}

// Linha de texto secundário (padrão nas células).
export const Sub = ({ children }: { children: ReactNode }) => (
  <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: 12, mt: 0.25 }}>{children}</Box>
);
