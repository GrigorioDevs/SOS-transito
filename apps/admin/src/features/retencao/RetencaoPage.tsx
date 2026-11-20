// Retenção: entradas × saídas, churn com meta (semáforo), motivos de saída e quem saiu.
// "Saiu" = X dias sem uso (Configurações › Retenção e avaliações).
import { useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { Box, Link, Stack, Typography } from '@mui/material';
import { useConfiguracoes } from '../../config/hooks';
import { buscarMeta, saudePorMeta, textoMeta } from '../../config/regras';
import { useRetencao } from '../../api/hooks';
import type { Kpi, Segmento, UsuarioResumo } from '../../api/tipos';
import { Cartao, Consulta } from '../../components/estados';
import { Quando, numero, tipoUsuario } from '../../components/formatos';
import { Sub, TabelaResponsiva, type Coluna } from '../../components/TabelaResponsiva';
import { Kpis } from '../../components/ui';
import { SegFiltro } from '../layouts/components/comum';
import { Ic, Linhas } from '../layouts/components/graficos';
import { PerfilLateral } from '../usuarios/UsuariosPage';

const POR_PAGINA = 10;

export default function RetencaoPage() {
  const [segmento, setSegmento] = useState<Segmento>('todos');
  const [pagina, setPagina] = useState(0);
  const [params, setParams] = useSearchParams();
  const q = useRetencao(segmento);
  const { data: cfg } = useConfiguracoes();
  const usuarioId = params.get('usuario');
  const abrir = (id: string | null) => setParams((p) => { if (id) p.set('usuario', id); else p.delete('usuario'); return p; });

  const colunas: Coluna<UsuarioResumo>[] = [
    { id: 'n', titulo: 'Usuário', celula: (u) => (<><b>{u.nome}</b><Sub>{tipoUsuario(u.tipo, u.servico)} · {u.cidade}</Sub></>) },
    { id: 'uso', titulo: 'Último uso', celula: (u) => <Quando iso={u.ultimoUsoEm} /> },
    { id: 'saiu', titulo: 'Contou como saída', esconder: 'md', celula: (u) => <Quando iso={u.saiuEm} /> },
    { id: 'm', titulo: 'Motivo informado', celula: (u) => u.motivoSaida ?? <Typography component="span" variant="body2" color="text.secondary">não respondeu</Typography> },
  ];

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <div className="pghead">
        <span className="s">
          Últimas 8 semanas · conta como saída quem ficou {cfg?.retencao.diasSemUsoParaSaida ?? '…'} dias sem usar{' '}
          (<Link component={RouterLink} to="/configuracoes?aba=retencao">alterar</Link>)
        </span>
        <SegFiltro value={segmento} onChange={(s) => { setSegmento(s); setPagina(0); }} />
      </div>
      <Consulta q={q} carregando="Calculando retenção…">
        {(r) => {
          const meta = (id: string, v: number) => {
            const m = cfg ? buscarMeta(cfg, id) : undefined;
            return m ? { saude: saudePorMeta(v, m), meta: textoMeta(m) } : { saude: undefined, meta: '' };
          };
          const mc = meta('churn_clientes', r.churnClientes);
          const mp = meta('churn_prestadores', r.churnPrestadores);
          const kpis: Kpi[] = [
            { id: 'novos', label: 'Novos (7 dias)', value: String(r.novos7d), sub: r.novosVariacao === null ? 'sem base de comparação' : `${r.novosVariacao >= 0 ? '+' : ''}${r.novosVariacao}% vs semana anterior` },
            { id: 'saidas', label: 'Saíram (7 dias)', value: String(r.saidas7d), sub: `${r.diasSemUso} dias sem uso` },
            { id: 'cc', label: 'Churn de clientes (30d)', value: `${numero(r.churnClientes)}%`, sub: mc.meta, saude: mc.saude },
            { id: 'cp', label: 'Churn de prestadores (30d)', value: `${numero(r.churnPrestadores)}%`, sub: mp.meta, saude: mp.saude },
            { id: 'base', label: 'Base ativa', value: r.baseAtiva.toLocaleString('pt-BR'), sub: segmento === 'todos' ? 'clientes + prestadores' : segmento },
          ];
          const total = r.recentes.length;
          const maiorMotivo = Math.max(1, ...r.motivos.map((m) => m.qtd));
          return (
            <>
              <Kpis itens={kpis} destacarPrimeiro />
              <section className="grid">
                <Cartao titulo="Entradas × saídas por semana" icone="users" id="ret-grafico">
                  <div className="leg"><span style={{ ['--c' as string]: '#FFC928' }}>Novos usuários</span><span style={{ ['--c' as string]: '#FF5252' }}>Saíram</span></div>
                  <Box role="img" aria-label={`Novos por semana: ${r.entradas.join(', ')}. Saídas por semana: ${r.saidas.join(', ')}.`}>
                    <Linhas a={r.entradas} b={r.saidas} labels={r.semanas} w={640} h={200} c1="#FFC928" c2="#FF5252" grid="#ffffff10" labelColor="#8494A7" />
                  </Box>
                </Cartao>
                <Cartao titulo="Motivos de saída (30 dias)" icone="alert" id="ret-motivos">
                  {r.motivos.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Ninguém respondeu à pesquisa de saída no período.</Typography>
                  ) : (
                    <Stack component="ul" spacing={1.25} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                      {r.motivos.map((m) => (
                        <Box component="li" key={m.motivo}>
                          <Stack direction="row" sx={{ fontSize: 13, mb: 0.5 }}><span>{m.motivo}</span><Box component="b" sx={{ ml: 'auto' }}>{m.pct}% <Typography component="span" variant="caption" color="text.secondary">({m.qtd})</Typography></Box></Stack>
                          <Box sx={{ height: 8, borderRadius: 4, bgcolor: '#ffffff10' }} aria-hidden>
                            <Box sx={{ height: '100%', width: `${(m.qtd / maiorMotivo) * 100}%`, borderRadius: 4, bgcolor: 'warning.main' }} />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
                    {r.semResposta} saída(s) sem resposta. Os motivos oferecidos vêm da configuração; respostas fora da lista entram em “Outros”.
                  </Typography>
                </Cartao>
              </section>
              <Cartao titulo={`Saíram nos últimos dias (${total})`} icone="x" id="ret-lista">
                {total === 0 ? (
                  <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}><Ic n="check" s={24} /><Typography variant="body2">Ninguém saiu no período.</Typography></Box>
                ) : (
                  <TabelaResponsiva rotulo="Usuários que saíram" linhas={r.recentes.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)} colunas={colunas}
                    chave={(u) => u.id} onAbrir={(u) => abrir(u.id)} rotuloAbrir={(u) => `Abrir perfil de ${u.nome}`}
                    total={total} pagina={pagina} porPagina={POR_PAGINA} onPagina={setPagina}
                    cartao={(u) => (
                      <Stack spacing={0.5}>
                        <b>{u.nome}</b>
                        <Typography variant="caption" color="text.secondary">{tipoUsuario(u.tipo, u.servico)} · último uso <Quando iso={u.ultimoUsoEm} /></Typography>
                        <Typography variant="body2">{u.motivoSaida ?? 'Não respondeu à pesquisa'}</Typography>
                      </Stack>
                    )} />
                )}
              </Cartao>
            </>
          );
        }}
      </Consulta>
      <PerfilLateral id={usuarioId} onFechar={() => abrir(null)} />
    </Stack>
  );
}
