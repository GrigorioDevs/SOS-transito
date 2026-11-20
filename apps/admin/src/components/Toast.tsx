// Feedback de sucesso/erro (Snackbar) disponível em todas as telas: const toast = useToast().
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';

interface Toast { id: number; texto: string; tipo: 'success' | 'error' | 'info' }
interface ApiToast { sucesso: (t: string) => void; erro: (t: string) => void; info: (t: string) => void }

const Ctx = createContext<ApiToast>({ sucesso: () => {}, erro: () => {}, info: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [atual, setAtual] = useState<Toast | null>(null);
  const mostrar = useCallback((texto: string, tipo: Toast['tipo']) => setAtual({ id: Date.now(), texto, tipo }), []);
  const api = useMemo<ApiToast>(() => ({
    sucesso: (t) => mostrar(t, 'success'),
    erro: (t) => mostrar(t, 'error'),
    info: (t) => mostrar(t, 'info'),
  }), [mostrar]);
  const fechar = (_?: unknown, motivo?: string) => { if (motivo !== 'clickaway') setAtual(null); };

  return (
    <Ctx.Provider value={api}>
      {children}
      {atual && (
        <Snackbar key={atual.id} open autoHideDuration={atual.tipo === 'error' ? 6000 : 3500} onClose={fechar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: { xs: 90, sm: 24 } }}>
          <Alert severity={atual.tipo} variant="filled" onClose={() => setAtual(null)} sx={{ width: '100%' }}>{atual.texto}</Alert>
        </Snackbar>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
