// Bloqueios e suspensões: ativos, fila da 2ª aprovação, recursos e histórico.
import { Link as RouterLink, useSearchParams } from 'react-router';
import { Box, Button, Link, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useConfiguracoes } from '../../config/hooks';
import { textoDuracao } from '../../config/regras';
import {
  aprovadorDe, SEGUNDO_ADMIN, useDecidirBloqueio, useDecidirRecurso, useResumoSancoes, useReverterSancao, useSancoes,
} from '../../api/hooks';
import type { AbaSancoes, SancaoAplicada } from '../../api/tipos';
import { useConfirmacao } from '../../components/ConfirmarAcao';
import { Cartao, Consulta } from '../../components/estados';
import { Quando, SeloSancao, tipoUsuario } from '../../components/formatos';
import { Sub, TabelaResponsiva, type Coluna } from '../../components/TabelaResponsiva';
import { Kpis } from '../../components/ui';
import { PerfilLateral } from '../usuarios/UsuariosPage';

const ABAS: { id: AbaSancoes; rotulo: string }[] = [
  { id: 'ativas', rotulo: 'Ativos' },
  { id: 'pendentes', rotulo: 'Aguardando 2ª aprovação' },
  { id: 'historico', rotulo: 'Histórico' },
];

const VAZIO: Record<AbaSancoes, [string, string]> = {
  ativas: ['Nenhum bloqueio ou suspensão ativo', 'Quando uma sanção for aplicada, ela aparece aqui até terminar ou ser revertida.'],
  pendentes: ['Nada aguardando aprovação', 'Bloqueios permanentes pedidos por um admin esperam aqui a aprovação de outro.'],
  historico: ['Histórico vazio', 'Sanções encerradas, revertidas ou recusadas aparecem aqui.'],
};

export default function BloqueiosPage() {
  const [params, setParams] = useSearchParams();
  const aba = (ABAS.find((a) => a.id === params.get('aba'))?.id ?? 'ativas') as AbaSancoes;
  const usuarioId = params.get('usuario');
  const q = useSancoes(aba);
  const resumo = useResumoSancoes();
  const { data: cfg } = useConfiguracoes();
  const reverter = useReverterSancao();
  const decidirBloqueio = useDecidirBloqueio();
  const decidirRecurso = useDecidirRecurso();
  const confirmar = useConfirmacao();
  const r = resumo.data;

  const set = (k: string, v: string | null) => setParams((p) => { if (v) p.set(k, v); else p.delete(k); return p; }, { replace: k === 'aba' });

  const acoes = (s: SancaoAplicada) => {
    const botoes = [];
    if (s.status === 'pendente_2a') {
      const quem = aprovadorDe(s);
      const simulado = quem === SEGUNDO_ADMIN;
      botoes.push(
        <Button key="ap" size="small" variant="contained" color="error"
          onClick={() => confirmar.pedir({
            titulo: `Aprovar ${s.sancaoNome.toLowerCase()} de ${s.usuario}?`, rotulo: 'Aprovar bloqueio', perigo: true,
            sucesso: `${s.usuario} está bloqueado.`,
            descricao: <>Pedido de <b>{s.solicitadoPor}</b>: “{s.justificativa}”. A aprovação é registrada em nome de {quem}{simulado ? ' (simulação do 2º admin, porque o pedido foi seu)' : ''}.</>,
            executar: (j) => decidirBloqueio.mutateAsync({ id: s.id, aprovar: true, justificativa: j }),
          })}>Aprovar ({quem})</Button>,
        <Button key="rc" size="small" variant="outlined" color="inherit"
          onClick={() => confirmar.pedir({
            titulo: `Recusar o bloqueio de ${s.usuario}?`, rotulo: 'Recusar', sucesso: 'Pedido de bloqueio recusado.',
            descricao: `Recusa registrada em nome de ${quem}.${s.casoId ? ` O caso ${s.casoId} volta para análise.` : ''}`,
            executar: (j) => decidirBloqueio.mutateAsync({ id: s.id, aprovar: false, justificativa: j }),
          })}>Recusar</Button>,
      );
    }
    if (s.status === 'ativa' && s.recurso && !s.recursoDecisao) {
      botoes.push(
        <Button key="ac" size="small" variant="contained" color="success"
          onClick={() => confirmar.pedir({
            titulo: `Aceitar o recurso de ${s.usuario}?`, rotulo: 'Aceitar e reverter', sucesso: `Recurso aceito. ${s.sancaoNome} revertida.`,
            descricao: <>Recurso: “{s.recurso!.texto}”. A sanção é revertida e deixa de contar como procedente.</>,
            executar: (j) => decidirRecurso.mutateAsync({ id: s.id, aceitar: true, justificativa: j }),
          })}>Aceitar recurso</Button>,
        <Button key="ng" size="small" variant="outlined" color="inherit"
          onClick={() => confirmar.pedir({
            titulo: `Negar o recurso de ${s.usuario}?`, rotulo: 'Negar recurso', sucesso: 'Recurso negado. A sanção continua valendo.',
            descricao: <>Recurso: “{s.recurso!.texto}”.</>,
            executar: (j) => decidirRecurso.mutateAsync({ id: s.id, aceitar: false, justificativa: j }),
          })}>Negar recurso</Button>,
      );
    } else if (s.status === 'ativa') {
      botoes.push(
        <Button key="rv" size="small" variant="outlined"
          onClick={() => confirmar.pedir({
            titulo: `Reverter ${s.sancaoNome.toLowerCase()} de ${s.usuario}?`, rotulo: 'Reverter', sucesso: `${s.sancaoNome} de ${s.usuario} revertida.`,
            descricao: 'A conta volta a ficar ativa e a sanção deixa de contar como procedente para reincidência.',
            executar: (j) => reverter.mutateAsync({ id: s.id, justificativa: j }),
          })}>Reverter</Button>,
      );
    }
    botoes.push(<Button key="pf" size="small" color="inherit" onClick={() => set('usuario', s.usuarioId)} aria-label={`Abrir perfil de ${s.usuario}`}>Perfil</Button>);
    return <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: { sm: 'flex-end' } }}>{botoes}</Stack>;
  };

  const recurso = (s: SancaoAplicada) => {
    if (s.recurso) return <>{s.recursoDecisao ? `Recurso ${s.recursoDecisao === 'mantida' ? 'negado' : 'aceito'}` : <b>Recurso para analisar</b>}<Sub>enviado <Quando iso={s.recurso.em} /></Sub></>;
    if (!s.recursoAte) return '—';
    return new Date(s.recursoAte).getTime() > Date.now() ? <>Prazo aberto<Sub>até <Quando iso={s.recursoAte} absoluta /></Sub></> : <>Prazo encerrado</>;
  };

  const colunas: Coluna<SancaoAplicada>[] = [
    { id: 'u', titulo: 'Usuário', celula: (s) => (<><b>{s.usuario}</b><Sub>{tipoUsuario(s.usuarioTipo)}{s.casoId && <> · <Link component={RouterLink} to={`/denuncias?caso=${s.casoId}`} onClick={(e) => e.stopPropagation()}>{s.casoId}</Link></>}</Sub></>) },
    { id: 's', titulo: 'Sanção', celula: (s) => (<>{s.sancaoNome}<Box sx={{ mt: 0.5 }}><SeloSancao s={s.status} /></Box></>) },
    { id: 'q', titulo: aba === 'pendentes' ? 'Pedido' : 'Aplicada', esconder: 'md', celula: (s) => (<><Quando iso={s.aplicadaEm ?? s.solicitadoEm} /><Sub>por {s.solicitadoPor}{s.aprovadoPor && `, aprovado por ${s.aprovadoPor}`}</Sub></>) },
    {
      id: 'ate', titulo: aba === 'historico' ? 'Resultado' : 'Até', esconder: 'md',
      celula: (s) => aba === 'historico'
        ? (s.motivoReversao ? <>{s.status === 'recusada' ? 'Recusada' : 'Revertida'} por {s.revertidaPor}<Sub>“{s.motivoReversao}”</Sub></> : s.encerradaEm ? <>Encerrada <Quando iso={s.encerradaEm} /></> : '—')
        : s.tipo === 'bloqueio_permanente' ? 'Permanente' : s.ate ? <><Quando iso={s.ate} /><Sub><Quando iso={s.ate} absoluta /></Sub></> : '—',
    },
    ...(aba === 'ativas' ? [{ id: 'rec', titulo: 'Recurso', esconder: 'lg' as const, celula: recurso }] : []),
    ...(aba === 'pendentes' ? [{ id: 'just', titulo: 'Justificativa', esconder: 'lg' as const, celula: (s: SancaoAplicada) => <Typography variant="body2" sx={{ maxWidth: 320 }}>“{s.justificativa}”</Typography> }] : []),
    { id: 'acoes', titulo: <span className="sr-only">Ações</span>, alinhar: 'right', celula: acoes },
  ];

  const contagem: Partial<Record<AbaSancoes, number>> = { pendentes: r?.pendentes };

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Kpis itens={[
        { id: 'b', label: 'Bloqueios permanentes', value: r ? String(r.bloqueios) : '…', sub: 'ativos agora' },
        { id: 's', label: 'Suspensões ativas', value: r ? String(r.suspensoes) : '…', sub: 'terminam sozinhas no prazo' },
        { id: 'p', label: 'Aguardando 2ª aprovação', value: r ? String(r.pendentes) : '…', sub: cfg?.sancoes.segundoAdminBloqueio ? 'regra do 2º admin ligada' : 'regra do 2º admin desligada', saude: r ? (r.pendentes ? 'y' : 'g') : undefined },
        { id: 'r', label: 'Recursos para analisar', value: r ? String(r.recursos) : '…', sub: cfg ? `prazo de recurso: ${textoDuracao(cfg.sancoes.prazoRecurso)}` : '', saude: r ? (r.recursos ? 'y' : 'g') : undefined },
        { id: 'v', label: 'Revertidas (30 dias)', value: r ? String(r.revertidas30d) : '…', sub: 'por reversão ou recurso' },
      ]} />
      <Cartao>
        <Tabs value={aba} onChange={(_, v: AbaSancoes) => set('aba', v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
          aria-label="Situação das sanções" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          {ABAS.map((a) => <Tab key={a.id} value={a.id} label={contagem[a.id] ? `${a.rotulo} (${contagem[a.id]})` : a.rotulo} />)}
        </Tabs>
        <Consulta q={q} carregando="Carregando sanções…" vazio={(l) => l.length === 0} vazioTitulo={VAZIO[aba][0]} vazioTexto={VAZIO[aba][1]}>
          {(l) => (
            <TabelaResponsiva rotulo={ABAS.find((a) => a.id === aba)!.rotulo} linhas={l} colunas={colunas} chave={(s) => s.id}
              cartao={(s) => (
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}><b>{s.usuario}</b><SeloSancao s={s.status} /></Stack>
                  <Typography variant="body2">{s.sancaoNome}{s.ate && s.status === 'ativa' && <> · até <Quando iso={s.ate} absoluta /></>}</Typography>
                  <Typography variant="caption" color="text.secondary">por {s.solicitadoPor} · <Quando iso={s.aplicadaEm ?? s.solicitadoEm} />{s.recurso && !s.recursoDecisao && ' · recurso para analisar'}</Typography>
                  {acoes(s)}
                </Stack>
              )} />
          )}
        </Consulta>
      </Cartao>
      <PerfilLateral id={usuarioId} onFechar={() => set('usuario', null)} />
      {confirmar.dialogo}
    </Stack>
  );
}
