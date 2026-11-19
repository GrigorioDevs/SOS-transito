// Auditoria: quem fez o quê, quando e por quê. Inclui alterações de configuração.
// Exporta o resultado filtrado em CSV (sem pacote extra).
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { Box, Button, Chip, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useConfiguracoes } from '../../config/hooks';
import { formatarData } from '../../config/regras';
import { useAuditoria } from '../../api/hooks';
import type { AreaAuditoria, EventoAuditoria } from '../../api/tipos';
import { Cartao, Consulta } from '../../components/estados';
import { Quando } from '../../components/formatos';
import { Sub, TabelaResponsiva, type Coluna } from '../../components/TabelaResponsiva';
import { useToast } from '../../components/Toast';
import { Busca, Filtros, useAtrasado } from '../../components/ui';

const AREAS: Record<AreaAuditoria, string> = {
  denuncia: 'Denúncia', usuario: 'Usuário', bloqueio: 'Bloqueio', avaliacao: 'Avaliação', sistema: 'Sistema', configuracao: 'Configuração',
};
const POR_PAGINA = 30;

// Link para o item relacionado (caso, usuário, sanção, configuração).
function LinkRef({ e }: { e: EventoAuditoria }) {
  const r = e.ref;
  if (!r) return null;
  const para = r.startsWith('D-') ? `/denuncias?caso=${r}` : r.startsWith('U-') ? `/usuarios?usuario=${r}`
    : r.startsWith('S-') ? '/bloqueios?aba=historico' : r.startsWith('AV-') ? '/avaliacoes?aba=todas' : r === 'configuracoes' ? '/configuracoes?aba=historico' : null;
  const texto = r === 'configuracoes' ? 'ver histórico' : r;
  return para ? <Link component={RouterLink} to={para}>{texto}</Link> : <>{r}</>;
}

export default function AuditoriaPage() {
  const { data: cfg } = useConfiguracoes();
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const [area, setArea] = useState<AreaAuditoria | 'todas'>('todas');
  const [quem, setQuem] = useState('todos');
  const [dias, setDias] = useState(30);
  const [pagina, setPagina] = useState(0);
  const termo = useAtrasado(busca, 300);
  const filtro = { busca: termo, area, quem, dias: dias || undefined };
  const q = useAuditoria(filtro);
  const todos = useAuditoria({});
  const pessoas = useMemo(() => [...new Set((todos.data ?? []).map((e) => e.quem))].sort(), [todos.data]);
  const lista = q.data ?? [];

  const mudar = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPagina(0); };

  const exportar = () => {
    const esc = (s?: string) => `"${(s ?? '').replace(/"/g, '""')}"`;
    const linhas = [['Quando', 'Quem', 'Área', 'Ação', 'Alvo', 'Justificativa', 'Referência'].join(';'),
      ...lista.map((e) => [cfg ? formatarData(e.quando, cfg) : e.quando, e.quem, AREAS[e.area], e.acao, e.alvo, e.motivo, e.ref].map(esc).join(';'))];
    const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.sucesso(`${lista.length} registro(s) exportado(s).`);
  };

  const colunas: Coluna<EventoAuditoria>[] = [
    { id: 'q', titulo: 'Quando', largura: 120, celula: (e) => (<><Quando iso={e.quando} /><Sub>{cfg ? formatarData(e.quando, cfg) : ''}</Sub></>) },
    { id: 'quem', titulo: 'Quem', largura: 130, celula: (e) => (<><b>{e.quem}</b><Sub><Chip size="small" label={AREAS[e.area]} variant="outlined" sx={{ height: 18, fontSize: 10 }} /></Sub></>) },
    { id: 'o', titulo: 'O quê', celula: (e) => (<>{e.acao}{e.alvo && <> — <b>{e.alvo}</b></>}{e.motivo && <Sub>Por quê: “{e.motivo}”</Sub>}</>) },
    { id: 'ref', titulo: 'Referência', esconder: 'md', alinhar: 'right', celula: (e) => <LinkRef e={e} /> },
  ];

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary">
        Toda ação crítica fica registrada com quem fez, quando, o quê e a justificativa. Os registros não podem ser editados.
      </Typography>
      <Cartao titulo={q.data ? `${lista.length} registro(s)` : 'Registros'} icone="history" id="aud-titulo"
        extra={<Button size="small" variant="outlined" onClick={exportar} disabled={!lista.length}>Exportar CSV</Button>}>
        <Filtros>
          <Busca rotulo="Buscar por pessoa, ação, caso ou justificativa" valor={busca} onChange={mudar(setBusca)} />
          <TextField select label="Área" value={area} onChange={(e) => mudar(setArea)(e.target.value as AreaAuditoria | 'todas')}>
            <MenuItem value="todas">Todas</MenuItem>
            {(Object.keys(AREAS) as AreaAuditoria[]).map((a) => <MenuItem key={a} value={a}>{AREAS[a]}</MenuItem>)}
          </TextField>
          <TextField select label="Quem" value={quem} onChange={(e) => mudar(setQuem)(e.target.value)}>
            <MenuItem value="todos">Todos</MenuItem>
            {pessoas.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
          <TextField select label="Período" value={dias} onChange={(e) => mudar(setDias)(Number(e.target.value))}>
            <MenuItem value={1}>Últimas 24 horas</MenuItem>
            <MenuItem value={7}>Últimos 7 dias</MenuItem>
            <MenuItem value={30}>Últimos 30 dias</MenuItem>
            <MenuItem value={0}>Tudo</MenuItem>
          </TextField>
        </Filtros>
        <Consulta q={q} carregando="Carregando auditoria…" vazio={(l) => l.length === 0}
          vazioTitulo="Nenhum registro encontrado" vazioTexto="Amplie o período ou limpe os filtros.">
          {() => (
            <Box sx={{ opacity: q.isPlaceholderData ? 0.6 : 1 }} aria-busy={q.isFetching}>
              <TabelaResponsiva rotulo="Registros de auditoria" linhas={lista.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)} colunas={colunas}
                chave={(e) => e.id} total={lista.length} pagina={pagina} porPagina={POR_PAGINA} onPagina={setPagina}
                cartao={(e) => (
                  <Stack spacing={0.5}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}><b>{e.quem}</b><Typography variant="caption" color="text.secondary"><Quando iso={e.quando} /></Typography></Stack>
                    <Typography variant="body2">{e.acao}{e.alvo && <> — <b>{e.alvo}</b></>}</Typography>
                    {e.motivo && <Typography variant="caption" color="text.secondary">Por quê: “{e.motivo}”</Typography>}
                    <Typography variant="caption">{AREAS[e.area]} · <LinkRef e={e} /></Typography>
                  </Stack>
                )} />
            </Box>
          )}
        </Consulta>
      </Cartao>
    </Stack>
  );
}
