// Denúncias: fila com filtros, detalhe do caso (?caso=ID, link direto) e decisão.
import { useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { Box, Button, Chip, Divider, Link, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useConfiguracoes } from '../../config/hooks';
import { nivelPorId, textoDuracao } from '../../config/regras';
import type { ConfiguracoesAdmin } from '../../config/tipos';
import { useAuditoria, useCasos, useSimularDenuncia } from '../../api/hooks';
import type { Caso } from '../../api/tipos';
import { Carregando, Cartao, Consulta, ErroCarga } from '../../components/estados';
import { Quando, SeloCaso, normalizar } from '../../components/formatos';
import { Sub, TabelaResponsiva, type Coluna } from '../../components/TabelaResponsiva';
import { useToast } from '../../components/Toast';
import { Busca, Dado, Filtros, Grade, PainelLateral } from '../../components/ui';
import { Provas } from '../layouts/components/graficos';
import PainelDecisao from './PainelDecisao';
import { casoVencido, prazoDoCaso } from './prazos';

type Aba = 'abertos' | 'vencidos' | 'aguardando' | 'aguardando_2a' | 'resolvido' | 'todos';
const ABAS: { id: Aba; rotulo: string; filtro: (c: Caso) => boolean }[] = [
  { id: 'abertos', rotulo: 'Abertos', filtro: (c) => c.status !== 'resolvido' },
  { id: 'vencidos', rotulo: 'Fora do prazo', filtro: casoVencido },
  { id: 'aguardando', rotulo: 'Aguardando defesa', filtro: (c) => c.status === 'aguardando' },
  { id: 'aguardando_2a', rotulo: '2ª aprovação', filtro: (c) => c.status === 'aguardando_2a' },
  { id: 'resolvido', rotulo: 'Resolvidos', filtro: (c) => c.status === 'resolvido' },
  { id: 'todos', rotulo: 'Todos', filtro: () => true },
];

const COR_SAUDE = { r: 'error.main', y: 'warning.main', g: 'text.secondary' } as const;

export function SeloNivel({ cfg, nivelId }: { cfg: ConfiguracoesAdmin; nivelId: string }) {
  const n = nivelPorId(cfg, nivelId);
  const cor = n?.cor ?? '#8494A7';
  return <Chip size="small" label={n?.nome ?? nivelId} sx={{ height: 20, fontSize: 11, fontWeight: 700, color: cor, bgcolor: `${cor}29` }} />;
}

export function PrazoCaso({ c }: { c: Caso }) {
  const p = prazoDoCaso(c);
  return <Box component="span" sx={{ display: 'block', fontSize: 12, mt: 0.5, color: p.saude ? COR_SAUDE[p.saude] : 'text.secondary', fontWeight: p.saude === 'r' ? 700 : 400 }}>{p.texto}</Box>;
}

// Urgência: vencidos primeiro, depois o prazo mais próximo; resolvidos por data de decisão.
function ordenar(a: Caso, b: Caso) {
  const ra = a.status === 'resolvido', rb = b.status === 'resolvido';
  if (ra !== rb) return ra ? 1 : -1;
  if (ra) return (b.resolvidoEm ?? '').localeCompare(a.resolvidoEm ?? '');
  return (prazoDoCaso(a).ate ?? '9').localeCompare(prazoDoCaso(b).ate ?? '9');
}

export default function DenunciasPage() {
  const q = useCasos();
  const { data: cfg } = useConfiguracoes();
  const [params, setParams] = useSearchParams();
  const [aba, setAba] = useState<Aba>('abertos');
  const [busca, setBusca] = useState('');
  const [nivel, setNivel] = useState('todos');
  const [categoria, setCategoria] = useState('todas');
  const simular = useSimularDenuncia();
  const toast = useToast();

  const casoId = params.get('caso');
  const abrir = (id: string | null) => setParams((p) => { if (id) p.set('caso', id); else p.delete('caso'); return p; });

  const casos = useMemo(() => q.data ?? [], [q.data]);
  const termo = normalizar(busca.trim());
  const filtrados = useMemo(() => casos
    .filter(ABAS.find((a) => a.id === aba)!.filtro)
    .filter((c) => nivel === 'todos' || c.nivelId === nivel)
    .filter((c) => categoria === 'todas' || c.categoriaId === categoria)
    .filter((c) => !termo || normalizar(`${c.id} ${c.chamado} ${c.denunciante} ${c.denunciado} ${c.categoria} ${c.relato}`).includes(termo))
    .sort(ordenar), [casos, aba, nivel, categoria, termo]);

  if (!cfg) return <Carregando />;
  const selecionado = casos.find((c) => c.id === casoId);

  const colunas: Coluna<Caso>[] = [
    { id: 'caso', titulo: 'Caso', celula: (c) => (<><b>{c.categoria}</b><Sub><SeloNivel cfg={cfg} nivelId={c.nivelId} /> {c.id} · {c.chamado}</Sub></>) },
    { id: 'env', titulo: 'Envolvidos', celula: (c) => (<>{c.denunciante} → {c.denunciado}<Sub>{c.denuncianteTipo} denuncia {c.denunciadoTipo.toLowerCase()}</Sub></>) },
    { id: 'provas', titulo: 'Provas', esconder: 'lg', celula: (c) => <Box sx={{ display: 'flex', gap: 0.5 }}><Provas lista={c.provas} w={36} h={28} dark /></Box> },
    { id: 'aberto', titulo: 'Aberto', esconder: 'md', celula: (c) => <Quando iso={c.criadoEm} /> },
    { id: 'status', titulo: 'Status e prazo', celula: (c) => (<><SeloCaso s={c.status} /><PrazoCaso c={c} /></>) },
    { id: 'acao', titulo: <span className="sr-only">Ações</span>, alinhar: 'right', celula: (c) => <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); abrir(c.id); }} aria-label={`Abrir caso ${c.id}`}>Abrir</Button> },
  ];

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          Prazos gravados em cada caso ao abrir. Mudanças em Configurações valem só para casos novos.
        </Typography>
        <Button variant="outlined" color="inherit" size="small" disabled={simular.isPending}
          onClick={() => simular.mutate(undefined, {
            onSuccess: (c) => { toast.sucesso(`Denúncia ${c.id} criada com os prazos da configuração v${c.versaoConfig}.`); abrir(c.id); },
            onError: (e) => toast.erro(e.message),
          })}>
          {simular.isPending ? 'Criando…' : 'Simular nova denúncia'}
        </Button>
      </Stack>

      <Cartao>
        <Tabs value={aba} onChange={(_, v: Aba) => setAba(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
          aria-label="Filtrar denúncias por situação" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          {ABAS.map((a) => <Tab key={a.id} value={a.id} label={`${a.rotulo} (${casos.filter(a.filtro).length})`} />)}
        </Tabs>
        <Filtros>
          <Busca rotulo="Buscar por caso, chamado ou pessoa" valor={busca} onChange={setBusca} />
          <TextField select label="Criticidade" value={nivel} onChange={(e) => setNivel(e.target.value)}>
            <MenuItem value="todos">Todas</MenuItem>
            {cfg.moderacao.niveis.map((n) => <MenuItem key={n.id} value={n.id}>{n.nome}</MenuItem>)}
          </TextField>
          <TextField select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <MenuItem value="todas">Todas</MenuItem>
            {cfg.categorias.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
          </TextField>
        </Filtros>
        <Consulta q={q} carregando="Carregando denúncias…" vazio={() => filtrados.length === 0}
          vazioTitulo={casos.length ? 'Nenhuma denúncia com estes filtros' : 'Nenhuma denúncia ainda'}
          vazioTexto={casos.length ? 'Troque a aba ou limpe a busca para ver mais casos.' : 'Quando alguém denunciar, o caso aparece aqui.'}>
          {() => (
            <TabelaResponsiva rotulo="Denúncias" linhas={filtrados} colunas={colunas} chave={(c) => c.id}
              onAbrir={(c) => abrir(c.id)} rotuloAbrir={(c) => `Abrir caso ${c.id}`}
              cartao={(c) => (
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <b>{c.categoria}</b><SeloCaso s={c.status} />
                  </Stack>
                  <Typography variant="body2">{c.denunciante} → {c.denunciado}</Typography>
                  <Typography variant="caption" color="text.secondary"><SeloNivel cfg={cfg} nivelId={c.nivelId} /> {c.id} · <Quando iso={c.criadoEm} /> · {c.provas.length} provas</Typography>
                  <PrazoCaso c={c} />
                </Stack>
              )} />
          )}
        </Consulta>
      </Cartao>

      <PainelLateral aberto={Boolean(casoId)} onFechar={() => abrir(null)}
        titulo={selecionado ? `${selecionado.id} · ${selecionado.categoria}` : casoId ?? ''}
        subtitulo={selecionado && <>Chamado {selecionado.chamado} · aberto <Quando iso={selecionado.criadoEm} /></>}>
        {q.isPending ? <Carregando /> : q.isError ? <ErroCarga erro={q.error} onTentar={() => q.refetch()} />
          : selecionado ? <DetalheCaso c={selecionado} cfg={cfg} />
            : <Typography color="text.secondary">Caso {casoId} não encontrado.</Typography>}
      </PainelLateral>
    </Stack>
  );
}

function DetalheCaso({ c, cfg }: { c: Caso; cfg: ConfiguracoesAdmin }) {
  const hist = useAuditoria({ busca: c.id });
  const p = c.prazos;
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <SeloCaso s={c.status} /><SeloNivel cfg={cfg} nivelId={c.nivelId} /><PrazoCaso c={c} />
      </Stack>
      <Box component="blockquote" sx={{ m: 0, p: 1.5, borderLeft: 3, borderColor: 'primary.main', bgcolor: 'background.paper', borderRadius: 1, fontStyle: 'italic' }}>
        “{c.relato}”
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Provas ({c.provas.length})</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}><Provas lista={c.provas} w={72} h={56} dark /></Box>
      </Box>
      <Grade>
        <Dado rotulo={`Denunciante · ${c.denuncianteTipo}`}>
          {c.denuncianteId ? <Link component={RouterLink} to={`/usuarios?usuario=${c.denuncianteId}`}>{c.denunciante}</Link> : c.denunciante}
        </Dado>
        <Dado rotulo={`Denunciado · ${c.denunciadoTipo}`}>
          <Link component={RouterLink} to={`/usuarios?usuario=${c.denunciadoId}`}>{c.denunciado}</Link>
        </Dado>
        <Dado rotulo="Decisões procedentes contra o denunciado">{c.procedentes.length}</Dado>
        <Dado rotulo="Decisão até"><Quando iso={c.decisaoAte} absoluta /></Dado>
        {c.defesaAte && <Dado rotulo="Defesa até"><Quando iso={c.defesaAte} absoluta /></Dado>}
      </Grade>
      <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
          Prazos gravados ao abrir (configuração v{c.versaoConfig})
        </Typography>
        <Typography variant="body2">
          Defesa {textoDuracao(p.defesa)} · Decisão {textoDuracao(p.decisao)} · Lembrete {textoDuracao(p.lembrete)} antes · {p.contagem === 'uteis' ? 'dias úteis' : 'dias corridos'}
        </Typography>
      </Box>
      <Divider />
      <Box>
        <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>Decisão</Typography>
        <PainelDecisao caso={c} cfg={cfg} />
      </Box>
      <Divider />
      <Box>
        <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>Histórico do caso</Typography>
        <Consulta q={hist} carregando="Carregando histórico…" vazio={(l) => l.length === 0} vazioTitulo="Sem registros ainda">
          {(l) => (
            <Stack component="ol" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {l.map((e) => (
                <Box component="li" key={e.id} sx={{ fontSize: 13 }}>
                  <b>{e.quem}</b> · {e.acao} <Typography component="span" variant="caption" color="text.secondary">· <Quando iso={e.quando} /></Typography>
                  {e.motivo && <Sub>“{e.motivo}”</Sub>}
                </Box>
              ))}
            </Stack>
          )}
        </Consulta>
      </Box>
    </Stack>
  );
}
