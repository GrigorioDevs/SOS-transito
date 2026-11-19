// Ações críticas: justificativa obrigatória (mínimo da configuração) + confirmação + toast.
// O registro na auditoria (quem, quando, o quê, por quê) é feito pela API ao executar.
//
//   const confirmar = useConfirmacao();
//   confirmar.pedir({ titulo, rotulo, sucesso, executar: (just) => mut.mutateAsync({ ..., justificativa: just }) });
//   return <>{...}{confirmar.dialogo}</>;
import { useState, type ReactNode } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { useConfiguracoes } from '../config/hooks';
import { USUARIO_ATUAL } from '../api/hooks';
import { useToast } from './Toast';

export interface PedidoConfirmacao {
  titulo: string;
  descricao?: ReactNode;
  rotulo: string;          // texto do botão de confirmar
  sucesso: string;         // mensagem do toast
  perigo?: boolean;
  semJustificativa?: boolean;
  executar: (justificativa: string) => Promise<unknown>;
  depois?: () => void;
}

export function useConfirmacao() {
  const [pedido, setPedido] = useState<(PedidoConfirmacao & { n: number }) | null>(null);
  const dialogo = pedido ? <DialogoConfirmacao key={pedido.n} pedido={pedido} onFechar={() => setPedido(null)} /> : null;
  return { pedir: (p: PedidoConfirmacao) => setPedido({ ...p, n: Date.now() }), dialogo };
}

function DialogoConfirmacao({ pedido, onFechar }: { pedido: PedidoConfirmacao; onFechar: () => void }) {
  const { data: cfg } = useConfiguracoes();
  const toast = useToast();
  const tema = useTheme();
  const celular = useMediaQuery(tema.breakpoints.down('sm'));
  const min = cfg?.sancoes.justificativaMin ?? 0;
  const [just, setJust] = useState('');
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const n = just.trim().length;
  const ok = pedido.semJustificativa || n >= min;

  const confirmar = async () => {
    setTocado(true);
    if (!ok) return;
    setEnviando(true);
    setErro(null);
    try {
      await pedido.executar(just.trim());
      toast.sucesso(pedido.sucesso);
      pedido.depois?.();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
      setEnviando(false);
    }
  };

  return (
    <Dialog open onClose={enviando ? undefined : onFechar} fullWidth maxWidth="sm" fullScreen={celular} aria-labelledby="confirmar-titulo">
      <DialogTitle id="confirmar-titulo">{pedido.titulo}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {pedido.descricao && <Typography component="div" variant="body2" color="text.secondary">{pedido.descricao}</Typography>}
          {!pedido.semJustificativa && (
            <TextField
              label="Justificativa" required multiline minRows={3} autoFocus value={just}
              onChange={(e) => setJust(e.target.value)} onBlur={() => setTocado(true)}
              error={tocado && !ok}
              placeholder="Explique a decisão com base nas provas e nas regras de uso."
              helperText={`${n}/${min} caracteres no mínimo${tocado && !ok ? ` — faltam ${min - n}` : ''}`}
              slotProps={{ formHelperText: { 'aria-live': 'polite' } as object }}
            />
          )}
          <Typography variant="caption" color="text.secondary">
            Fica registrado na auditoria: {USUARIO_ATUAL}, data e hora, ação{pedido.semJustificativa ? '' : ' e justificativa'}.
          </Typography>
          {erro && <Alert severity="error" role="alert">{erro}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onFechar} disabled={enviando}>Cancelar</Button>
        <Button variant="contained" color={pedido.perigo ? 'error' : 'primary'} onClick={confirmar} disabled={enviando || (tocado && !ok)}>
          {enviando ? 'Salvando…' : pedido.rotulo}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
