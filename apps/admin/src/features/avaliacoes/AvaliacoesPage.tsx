// Avaliações: satisfação × insatisfação (faixas e metas da configuração) e moderação.
// Fila de revisão = nota até o limite de alerta da configuração e ainda não revisada.
import { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { Box, Button, Chip, Link, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useConfiguracoes } from '../../config/hooks';
import { buscarMeta, saudePorMeta, textoMeta } from '../../config/regras';
import type { ConfiguracoesAdmin } from '../../config/tipos';
import { useAvaliacoes, useModerarAvaliacao, useResumoAvaliacoes, type AcaoAvaliacao } from '../../api/hooks';
import type { Avaliacao, FiltroAvaliacoes, Segmento } from '../../api/tipos';
import { useConfirmacao } from '../../components/ConfirmarAcao';
import { Carregando, Cartao, Consulta } from '../../components/estados';
import { Estrelas, Quando, numero, tipoUsuario } from '../../components/formatos';
import { Sub, TabelaResponsiva, type Coluna } from '../../components/TabelaResponsiva';
import { Busca, Filtros, Kpis, useAtrasado } from '../../components/ui';
import { SegFiltro } from '../layouts/components/comum';
import { Rosca } from '../layouts/components/graficos';

const POR_PAGINA = 20;
const COR_NOTA: Record<number, string> = { 5: '#25C78A', 4: '#7CDDB9', 3: '#8494A7', 2: '#FFA940', 1: '#FF5252' };
type Situacao = NonNullable<FiltroAvaliacoes['situacao']>;

export default function AvaliacoesPage() {
  const { data: cfg } = useConfiguracoes();
  const [params, setParams] = useSearchParams();
  const [segmento, setSegmento] = useState<Segmento>('todos');
  const [dias, setDias] = useState(30);
  const [busca, setBusca] = useState('');
  const [nota, setNota] = useState<number | 'todas'>('todas');
  const [pagina, setPagina] = useState(0);
  const situacao = (params.get('aba') as Situacao | null) ?? 'revisao';
  const termo = useAtrasado(busca, 300);
  useEffect(() => setPagina(0), [segmento, termo, nota, situacao]);

  const resumo = useResumoAvaliacoes(segmento, dias);
  const q = useAvaliacoes({ segmento, busca: termo, nota, situacao, pagina, porPagina: POR_PAGINA });
  const moderar = useModerarAvaliacao();
  const confirmar = useConfirmacao();

  if (!cfg) return <Carregando />;
  const alerta = cfg.avaliacoes.notaAlertaRevisao;
  const r = resumo.data;

  const pedir = (a: Avaliacao, acao: AcaoAvaliacao) => {
    const textos = {
      manter: { titulo: 'Manter a avaliação publicada?', rotulo: 'Manter publicada', sucesso: 'Avaliação revisada e mantida publicada.', descricao: 'A avaliação sai da fila de revisão e continua visível no perfil.' },
      ocultar: { titulo: 'Ocultar esta avaliação?', rotulo: 'Ocultar', sucesso: 'Avaliação ocultada.', descricao: 'A avaliação deixa de aparecer no perfil e não entra mais na nota pública. Pode ser republicada depois.' },
      republicar: { titulo: 'Republicar esta avaliação?', rotulo: 'Republicar', sucesso: 'Avaliação republicada.', descricao: 'A avaliação volta a aparecer no perfil.' },
    }[acao];
    confirmar.pedir({
      ...textos, perigo: acao === 'ocultar',
      descricao: <><Estrelas nota={a.nota} /> “{a.comentario}” — {a.autor} sobre {a.avaliado}. <br />{textos.descricao}</>,
      executar: (j) => moderar.mutateAsync({ id: a.id, acao, justificativa: j }),
    });
  };

  const acoes = (a: Avaliacao) => (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: { sm: 'flex-end' } }}>
      {a.status === 'publicada' && !a.revisadaEm && <Button size="small" variant="outlined" onClick={() => pedir(a, 'manter')}>Manter</Button>}
      {a.status === 'publicada' && <Button size="small" variant="outlined" color="error" onClick={() => pedir(a, 'ocultar')}>Ocultar</Button>}
      {a.status === 'oculta' && <Button size="small" variant="outlined" onClick={() => pedir(a, 'republicar')}>Republicar</Button>}
    </Stack>
  );

  const situacaoDe = (a: Avaliacao) =>
    a.nota <= alerta && !a.revisadaEm ? <Chip size="small" color="warning" label="Para revisar" sx={{ height: 22, fontWeight: 700 }} />
      : a.status === 'oculta' ? <Chip size="small" label="Oculta" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
        : <Chip size="small" color="success" label="Publicada" sx={{ height: 22, fontWeight: 700 }} />;

  const colunas: Coluna<Avaliacao>[] = [
    { id: 'av', titulo: 'Avaliação', celula: (a) => (<><Estrelas nota={a.nota} /><Box sx={{ mt: 0.25, maxWidth: 420 }}>“{a.comentario}”</Box></>) },
    { id: 'quem', titulo: 'Quem → sobre quem', esconder: 'md', celula: (a) => (<>{a.autor} → <Link component={RouterLink} to={`/usuarios?usuario=${a.avaliadoId}`}>{a.avaliado}</Link><Sub>{tipoUsuario(a.autorTipo)} avalia {tipoUsuario(a.avaliadoTipo).toLowerCase()} · {a.chamado}</Sub></>) },
    { id: 'q', titulo: 'Quando', esconder: 'lg', celula: (a) => <Quando iso={a.criadoEm} /> },
    { id: 's', titulo: 'Situação', celula: (a) => (<>{situacaoDe(a)}{a.revisadaPor && <Sub>revisada por {a.revisadaPor}</Sub>}</>) },
    { id: 'acoes', titulo: <span className="sr-only">Ações</span>, alinhar: 'right', celula: acoes },
  ];

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <div className="pghead">
        <TextField select label="Período" value={dias} onChange={(e) => setDias(Number(e.target.value))} sx={{ width: 150 }}>
          {[7, 30, 60].map((d) => <MenuItem key={d} value={d}>Últimos {d} dias</MenuItem>)}
        </TextField>
        <span className="s">Por quem avaliou</span>
        <SegFiltro value={segmento} onChange={setSegmento} />
      </div>
      {r && <Kpis destacarPrimeiro itens={kpisAvaliacoes(r, cfg)} />}
      {resumo.isPending && <Kpis itens={[0, 1, 2, 3].map((i) => ({ id: String(i), label: 'Carregando…', value: '…', sub: '' }))} />}

      <section className="grid">
        <Cartao titulo="Avaliações" icone="check" id="av-lista">
          <Tabs value={situacao} onChange={(_, v: Situacao) => setParams((p) => { p.set('aba', v); return p; }, { replace: true })}
            variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Situação das avaliações" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab value="revisao" label={`Para revisar${r ? ` (${r.emRevisao})` : ''}`} />
            <Tab value="todas" label="Todas" />
            <Tab value="publicada" label="Publicadas" />
            <Tab value="oculta" label="Ocultas" />
          </Tabs>
          <Filtros>
            <Busca rotulo="Buscar por pessoa, comentário ou chamado" valor={busca} onChange={setBusca} />
            <TextField select label="Nota" value={nota} onChange={(e) => setNota(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}>
              <MenuItem value="todas">Todas</MenuItem>
              {[5, 4, 3, 2, 1].map((n) => <MenuItem key={n} value={n}>{n}★</MenuItem>)}
            </TextField>
          </Filtros>
          <Consulta q={q} carregando="Carregando avaliações…" vazio={(d) => d.total === 0}
            vazioTitulo={situacao === 'revisao' ? 'Fila de revisão vazia' : 'Nenhuma avaliação encontrada'}
            vazioTexto={situacao === 'revisao' ? `Avaliações com até ${alerta}★ aparecem aqui para revisão. O limite fica em Configurações.` : 'Troque os filtros para ver mais.'}>
            {(d) => (
              <Box sx={{ opacity: q.isPlaceholderData ? 0.6 : 1 }} aria-busy={q.isFetching}>
                <TabelaResponsiva rotulo="Avaliações" linhas={d.itens} colunas={colunas} chave={(a) => a.id}
                  total={d.total} pagina={pagina} porPagina={POR_PAGINA} onPagina={setPagina}
                  cartao={(a) => (
                    <Stack spacing={0.75}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Estrelas nota={a.nota} />{situacaoDe(a)}</Stack>
                      <Typography variant="body2">“{a.comentario}”</Typography>
                      <Typography variant="caption" color="text.secondary">{a.autor} → {a.avaliado} · <Quando iso={a.criadoEm} /></Typography>
                      {acoes(a)}
                    </Stack>
                  )} />
              </Box>
            )}
          </Consulta>
        </Cartao>
        <Cartao titulo="Distribuição das notas" icone="dash" id="av-dist">
          <Consulta q={resumo} carregando="Calculando…" vazio={(d) => d.total === 0} vazioTitulo="Sem avaliações no período">
            {(d) => (
              <div className="dn">
                <div className="c">
                  <Rosca size={140} segs={d.notas.map((n) => [n.pct, COR_NOTA[n.estrelas]])} track="#ffffff10" thick={16} />
                  <div><span><b>{numero(d.media)}</b><small>média · {d.total}</small></span></div>
                </div>
                <div className="st">
                  {d.notas.map((n) => <div key={n.estrelas}><i style={{ background: COR_NOTA[n.estrelas] }} />{n.estrelas}★<b>{numero(n.pct)}% <small className="s">({n.qtd})</small></b></div>)}
                  <small className="s">Satisfeito ≥ {cfg.avaliacoes.notaSatisfeito}★ · insatisfeito ≤ {cfg.avaliacoes.notaInsatisfeito}★ · revisão ≤ {alerta}★ (<Link component={RouterLink} to="/configuracoes?aba=retencao">alterar</Link>)</small>
                </div>
              </div>
            )}
          </Consulta>
        </Cartao>
      </section>
      {confirmar.dialogo}
    </Stack>
  );
}

function kpisAvaliacoes(r: NonNullable<ReturnType<typeof useResumoAvaliacoes>['data']>, cfg: ConfiguracoesAdmin) {
  const com = (id: string, v: number) => {
    const m = buscarMeta(cfg, id);
    return m ? { saude: saudePorMeta(v, m), meta: textoMeta(m) } : { saude: undefined, meta: '' };
  };
  const s = com('satisfacao', r.satisfacao);
  const i = com('insatisfacao', r.insatisfacao);
  return [
    { id: 'rev', label: 'Para revisar', value: String(r.emRevisao), sub: `notas até ${cfg.avaliacoes.notaAlertaRevisao}★ sem revisão`, saude: r.emRevisao > 0 ? ('y' as const) : ('g' as const) },
    { id: 'media', label: 'Nota média', value: r.total ? `${numero(r.media)} ★` : '—', sub: `${r.total} avaliações em ${r.janelaDias} dias` },
    { id: 'sat', label: 'Satisfação', value: `${numero(r.satisfacao)}%`, sub: `≥ ${cfg.avaliacoes.notaSatisfeito}★ · ${s.meta}`, saude: s.saude },
    { id: 'ins', label: 'Insatisfação', value: `${numero(r.insatisfacao)}%`, sub: `≤ ${cfg.avaliacoes.notaInsatisfeito}★ · ${i.meta}`, saude: i.saude },
  ];
}
