// Tela de Configurações: nenhum prazo, limite ou regra fica fixo no código.
// Edita um rascunho; só vale depois de "Salvar". Avisa ao sair com alterações não salvas.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBlocker, useSearchParams } from 'react-router';
import {
  Alert, Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Paper, Snackbar, Stack, Tab, Tabs, Typography,
} from '@mui/material';
import { useConfiguracoes, useSalvarConfiguracoes } from '../../config/hooks';
import { CONFIG_PADRAO } from '../../config/padrao';
import { formatarData } from '../../config/regras';
import { validarConfig } from '../../config/validacao';
import type { ConfiguracoesAdmin } from '../../config/tipos';
import { Carregando } from '../layouts/components/comum';
import SecaoPrazos from './secoes/SecaoPrazos';
import SecaoCategorias from './secoes/SecaoCategorias';
import SecaoSancoes from './secoes/SecaoSancoes';
import SecaoProvas from './secoes/SecaoProvas';
import SecaoMetas from './secoes/SecaoMetas';
import SecaoRetencao from './secoes/SecaoRetencao';
import SecaoOrganizacao from './secoes/SecaoOrganizacao';
import SecaoServicos from './secoes/SecaoServicos';
import SecaoHistorico from './secoes/SecaoHistorico';

const ABAS = [
  { id: 'prazos', rotulo: 'Prazos', prefixos: ['moderacao'] },
  { id: 'categorias', rotulo: 'Categorias', prefixos: ['categorias'] },
  { id: 'sancoes', rotulo: 'Sanções', prefixos: ['sancoes'] },
  { id: 'provas', rotulo: 'Provas', prefixos: ['provas'] },
  { id: 'metas', rotulo: 'Metas do semáforo', prefixos: ['metas'] },
  { id: 'retencao', rotulo: 'Retenção e avaliações', prefixos: ['retencao', 'avaliacoes'] },
  { id: 'organizacao', rotulo: 'Organização', prefixos: ['organizacao'] },
  { id: 'servicos', rotulo: 'Serviços', prefixos: [] },
  { id: 'historico', rotulo: 'Histórico', prefixos: [] },
] as const;
type IdAba = (typeof ABAS)[number]['id'];

export default function ConfiguracoesPage() {
  const { data, isPending, isError, error, refetch } = useConfiguracoes();
  const [mensagem, setMensagem] = useState<string | null>(null);
  if (isPending) return <Carregando cor="#8494A7" />;
  if (isError) return <Alert severity="error" action={<Button color="inherit" onClick={() => refetch()}>Tentar novamente</Button>}>{error.message}</Alert>;
  return (
    <>
      {/* key = versão: depois de salvar, o rascunho recomeça a partir da versão nova */}
      <Editor key={data.versao} salvo={data} onSalvo={() => setMensagem('Configurações salvas.')} />
      <Snackbar open={Boolean(mensagem)} autoHideDuration={3500} onClose={() => setMensagem(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: { xs: 90, sm: 24 } }}>
        <Alert severity="success" variant="filled" onClose={() => setMensagem(null)}>{mensagem}</Alert>
      </Snackbar>
    </>
  );
}

function Editor({ salvo, onSalvo }: { salvo: ConfiguracoesAdmin; onSalvo: () => void }) {
  const [rascunho, setRascunho] = useState<ConfiguracoesAdmin>(salvo);
  const [params, setParams] = useSearchParams();
  const [confirmarPadrao, setConfirmarPadrao] = useState(false);
  const salvar = useSalvarConfiguracoes();

  const aba: IdAba = ABAS.find((a) => a.id === params.get('aba'))?.id ?? 'prazos';
  const erros = useMemo(() => validarConfig(rascunho), [rascunho]);
  const nErros = Object.keys(erros).length;
  const sujo = useMemo(() => JSON.stringify(rascunho) !== JSON.stringify(salvo), [rascunho, salvo]);
  const errosDaAba = (prefixos: readonly string[]) => Object.keys(erros).filter((k) => prefixos.some((p) => k === p || k.startsWith(`${p}.`))).length;

  const mudar = useCallback((fn: (c: ConfiguracoesAdmin) => void) => {
    setRascunho((atual) => { const novo = structuredClone(atual); fn(novo); return novo; });
  }, []);
  const erro = useCallback((caminho: string) => erros[caminho], [erros]);

  // Aviso ao sair: troca de tela dentro do app (useBlocker) e fechar/recarregar a aba (beforeunload).
  const blocker = useBlocker(({ currentLocation, nextLocation }) => sujo && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!sujo) return;
    const aviso = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [sujo]);

  const restaurarPadroes = () => {
    setRascunho({ ...structuredClone(CONFIG_PADRAO), versao: salvo.versao, atualizadoEm: salvo.atualizadoEm, atualizadoPor: salvo.atualizadoPor });
    setConfirmarPadrao(false);
  };

  const props = { c: rascunho, mudar, erro };
  const status = sujo
    ? 'Alterações não salvas'
    : salvo.atualizadoEm
      ? `Versão ${salvo.versao} · salva em ${formatarData(salvo.atualizadoEm, salvo)} por ${salvo.atualizadoPor}`
      : `Versão ${salvo.versao} · valores padrão`;

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Paper variant="outlined" sx={{ p: 1.5, position: 'sticky', top: 0, zIndex: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: sujo ? 'warning.main' : 'text.secondary' }} role="status">{status}</Typography>
            {nErros > 0 && <Typography variant="caption" color="error">{nErros} campo{nErros > 1 ? 's' : ''} com erro — corrija para salvar.</Typography>}
          </Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button color="inherit" onClick={() => setConfirmarPadrao(true)}>Restaurar padrões</Button>
            <Button variant="outlined" color="inherit" disabled={!sujo || salvar.isPending} onClick={() => { setRascunho(salvo); salvar.reset(); }}>Descartar alterações</Button>
            <Button variant="contained" disabled={!sujo || nErros > 0 || salvar.isPending}
              onClick={() => salvar.mutate(rascunho, { onSuccess: onSalvo })}>
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </Stack>
        </Stack>
        {salvar.isError && <Alert severity="error" sx={{ mt: 1.5 }}>{salvar.error.message}</Alert>}
      </Paper>

      <Tabs value={aba} onChange={(_, v: IdAba) => setParams({ aba: v }, { replace: true })}
        variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Seções das configurações"
        sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {ABAS.map((a) => {
          const n = errosDaAba(a.prefixos);
          return (
            <Tab key={a.id} value={a.id} id={`aba-${a.id}`} aria-controls={`painel-${a.id}`}
              label={n > 0 ? <Badge color="error" badgeContent={n} sx={{ '& .MuiBadge-badge': { right: -12 } }}>{a.rotulo}</Badge> : a.rotulo} />
          );
        })}
      </Tabs>

      <Box role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === 'prazos' && <SecaoPrazos {...props} />}
        {aba === 'categorias' && <SecaoCategorias {...props} />}
        {aba === 'sancoes' && <SecaoSancoes {...props} />}
        {aba === 'provas' && <SecaoProvas {...props} />}
        {aba === 'metas' && <SecaoMetas {...props} />}
        {aba === 'retencao' && <SecaoRetencao {...props} />}
        {aba === 'organizacao' && <SecaoOrganizacao {...props} />}
        {aba === 'servicos' && <SecaoServicos />}
        {aba === 'historico' && <SecaoHistorico c={salvo} />}
      </Box>

      <Dialog open={confirmarPadrao} onClose={() => setConfirmarPadrao(false)}>
        <DialogTitle>Restaurar os valores padrão?</DialogTitle>
        <DialogContent>
          <DialogContentText>Todos os campos voltam ao padrão do sistema. Nada é gravado até você clicar em “Salvar”.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setConfirmarPadrao(false)}>Cancelar</Button>
          <Button variant="contained" onClick={restaurarPadroes}>Restaurar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()}>
        <DialogTitle>Sair sem salvar?</DialogTitle>
        <DialogContent>
          <DialogContentText>Você tem alterações nas configurações que ainda não foram salvas. Se sair agora, elas serão perdidas.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => blocker.reset?.()}>Continuar editando</Button>
          <Button variant="contained" color="error" onClick={() => blocker.proceed?.()}>Sair sem salvar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
