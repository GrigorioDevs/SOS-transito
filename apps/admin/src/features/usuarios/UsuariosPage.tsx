// Usuários: busca e filtros (no servidor, paginados), perfil (?usuario=ID) com histórico e sanções.
import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { Alert, Box, Button, Divider, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useConfiguracoes } from '../../config/hooks';
import { maiorJanelaReincidencia, procedentesNaJanela, sancaoSugerida, sancoesAtivas, textoDuracao } from '../../config/regras';
import type { ConfiguracoesAdmin } from '../../config/tipos';
import { useReativarUsuario, useSancionarUsuario, useUsuario, useUsuarios } from '../../api/hooks';
import type { PerfilUsuario, Segmento, StatusUsuario, UsuarioResumo } from '../../api/tipos';
import { useConfirmacao } from '../../components/ConfirmarAcao';
import { Carregando, Cartao, Consulta, ErroCarga } from '../../components/estados';
import { Estrelas, Quando, ROTULO_USUARIO, SeloCaso, SeloSancao, SeloUsuario, numero, tipoUsuario } from '../../components/formatos';
import { Sub, TabelaResponsiva, type Coluna } from '../../components/TabelaResponsiva';
import { Busca, Dado, Filtros, Grade, PainelLateral, useAtrasado } from '../../components/ui';
import { SegFiltro } from '../layouts/components/comum';

const POR_PAGINA = 25;

export default function UsuariosPage() {
  const [params, setParams] = useSearchParams();
  const [segmento, setSegmento] = useState<Segmento>('todos');
  const [status, setStatus] = useState<StatusUsuario | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);
  const termo = useAtrasado(busca, 300);
  useEffect(() => setPagina(0), [segmento, status, termo]);
  const q = useUsuarios({ segmento, status, busca: termo, pagina, porPagina: POR_PAGINA });

  const usuarioId = params.get('usuario');
  const abrir = (id: string | null) => setParams((p) => { if (id) p.set('usuario', id); else p.delete('usuario'); return p; });

  const colunas: Coluna<UsuarioResumo>[] = [
    { id: 'nome', titulo: 'Usuário', celula: (u) => (<><b>{u.nome}</b><Sub>{tipoUsuario(u.tipo, u.servico)} · {u.id}</Sub></>) },
    { id: 'cidade', titulo: 'Cidade', esconder: 'lg', celula: (u) => u.cidade },
    { id: 'cad', titulo: 'Cadastro', esconder: 'lg', celula: (u) => <Quando iso={u.criadoEm} /> },
    { id: 'uso', titulo: 'Último uso', esconder: 'md', celula: (u) => <Quando iso={u.ultimoUsoEm} /> },
    { id: 'nota', titulo: 'Nota', esconder: 'md', celula: (u) => (u.notaMedia === null ? '—' : <>{numero(u.notaMedia)} ★<Sub>{u.chamados} chamados</Sub></>) },
    { id: 'status', titulo: 'Status', celula: (u) => (<><SeloUsuario s={u.status} />{u.suspensoAte && <Sub>até <Quando iso={u.suspensoAte} absoluta /></Sub>}</>) },
    { id: 'acao', titulo: <span className="sr-only">Ações</span>, alinhar: 'right', celula: (u) => <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); abrir(u.id); }} aria-label={`Abrir perfil de ${u.nome}`}>Perfil</Button> },
  ];

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <div className="pghead">
        <span className="s">{q.data ? `${q.data.total.toLocaleString('pt-BR')} usuários encontrados` : ' '}</span>
        <SegFiltro value={segmento} onChange={setSegmento} />
      </div>
      <Cartao>
        <Filtros>
          <Busca rotulo="Buscar por nome, e-mail, cidade ou ID" valor={busca} onChange={setBusca} />
          <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusUsuario | 'todos')}>
            <MenuItem value="todos">Todos</MenuItem>
            {(Object.keys(ROTULO_USUARIO) as StatusUsuario[]).map((s) => <MenuItem key={s} value={s}>{ROTULO_USUARIO[s]}</MenuItem>)}
          </TextField>
        </Filtros>
        <Consulta q={q} carregando="Carregando usuários…" vazio={(d) => d.total === 0}
          vazioTitulo="Nenhum usuário encontrado" vazioTexto="Confira a busca ou troque o filtro de status.">
          {(d) => (
            <Box sx={{ opacity: q.isPlaceholderData ? 0.6 : 1, transition: 'opacity .2s' }} aria-busy={q.isFetching}>
              <TabelaResponsiva rotulo="Usuários" linhas={d.itens} colunas={colunas} chave={(u) => u.id}
                onAbrir={(u) => abrir(u.id)} rotuloAbrir={(u) => `Abrir perfil de ${u.nome}`}
                total={d.total} pagina={pagina} porPagina={POR_PAGINA} onPagina={setPagina}
                cartao={(u) => (
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}><b>{u.nome}</b><SeloUsuario s={u.status} /></Stack>
                    <Typography variant="caption" color="text.secondary">
                      {tipoUsuario(u.tipo, u.servico)} · {u.cidade} · último uso <Quando iso={u.ultimoUsoEm} />
                    </Typography>
                  </Stack>
                )} />
            </Box>
          )}
        </Consulta>
      </Cartao>
      <PerfilLateral id={usuarioId} onFechar={() => abrir(null)} />
    </Stack>
  );
}

export function PerfilLateral({ id, onFechar }: { id: string | null; onFechar: () => void }) {
  const q = useUsuario(id);
  const { data: cfg } = useConfiguracoes();
  const u = q.data?.usuario;
  return (
    <PainelLateral aberto={Boolean(id)} onFechar={onFechar} titulo={u?.nome ?? 'Perfil do usuário'}
      subtitulo={u && <>{tipoUsuario(u.tipo, u.servico)} · {u.id}</>}>
      {q.isPending || !cfg ? <Carregando texto="Carregando perfil…" /> : q.isError ? <ErroCarga erro={q.error} onTentar={() => q.refetch()} />
        : <Perfil p={q.data} cfg={cfg} />}
    </PainelLateral>
  );
}

function Perfil({ p, cfg }: { p: PerfilUsuario; cfg: ConfiguracoesAdmin }) {
  const u = p.usuario;
  const sancionar = useSancionarUsuario();
  const reativar = useReativarUsuario();
  const confirmar = useConfirmacao();
  const janela = maiorJanelaReincidencia(cfg);
  const naJanela = procedentesNaJanela(p.procedentes, janela);
  const sugerida = sancaoSugerida(cfg, p.procedentes);
  const pendente = p.sancoes.find((s) => s.status === 'pendente_2a');
  const sancoes = sancoesAtivas(cfg).filter((s) => s.tipo !== 'reembolso');
  const restrito = u.status === 'suspenso' || u.status === 'bloqueado';

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <SeloUsuario s={u.status} />
        {u.suspensoAte && <Typography variant="body2" color="text.secondary">suspenso até <Quando iso={u.suspensoAte} absoluta /></Typography>}
        {u.saiuEm && u.status === 'inativo' && <Typography variant="body2" color="text.secondary">conta como “saiu” desde <Quando iso={u.saiuEm} /> ({cfg.retencao.diasSemUsoParaSaida} dias sem uso)</Typography>}
      </Stack>
      <Grade>
        <Dado rotulo="E-mail">{u.email}</Dado>
        <Dado rotulo="Telefone">{u.telefone}</Dado>
        <Dado rotulo="Cidade">{u.cidade}</Dado>
        <Dado rotulo="Cadastro"><Quando iso={u.criadoEm} /></Dado>
        <Dado rotulo="Último uso"><Quando iso={u.ultimoUsoEm} /></Dado>
        <Dado rotulo="Chamados">{u.chamados}</Dado>
        <Dado rotulo="Nota média">{u.notaMedia === null ? '—' : `${numero(u.notaMedia)} ★`}</Dado>
        <Dado rotulo={`Procedentes (${janela} dias)`}>{naJanela}</Dado>
        {u.motivoSaida && <Dado rotulo="Motivo de saída">{u.motivoSaida}</Dado>}
      </Grade>

      {pendente && <Alert severity="warning">{pendente.sancaoNome} solicitado por {pendente.solicitadoPor} <Quando iso={pendente.solicitadoEm} />, aguardando a 2ª aprovação em <Link component={RouterLink} to="/bloqueios?aba=pendentes">Bloqueios</Link>.</Alert>}
      {sugerida && !restrito && <Alert severity="warning">Reincidência: {naJanela} procedente(s) em {janela} dias. A regra sugere <b>{sugerida.nome}</b>.</Alert>}

      <Box>
        <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>Ações</Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {restrito && (
            <Button size="small" variant="contained" color="success"
              onClick={() => confirmar.pedir({
                titulo: `Reativar ${u.nome}?`, rotulo: 'Reativar conta', sucesso: `${u.nome} foi reativado.`,
                descricao: 'Todas as suspensões e bloqueios ativos deste usuário serão revertidos.',
                executar: (j) => reativar.mutateAsync({ id: u.id, justificativa: j }),
              })}>
              Reativar
            </Button>
          )}
          {u.status !== 'bloqueado' && sancoes.map((s) => {
            const bloqueio = s.tipo === 'bloqueio_permanente';
            const com2 = bloqueio && cfg.sancoes.segundoAdminBloqueio;
            if (bloqueio && pendente) return null;
            return (
              <Button key={s.id} size="small" variant={sugerida?.id === s.id ? 'contained' : 'outlined'} color={bloqueio ? 'error' : 'primary'}
                onClick={() => confirmar.pedir({
                  titulo: `${com2 ? 'Solicitar' : 'Aplicar'} ${s.nome.toLowerCase()} a ${u.nome}?`,
                  rotulo: com2 ? 'Solicitar bloqueio' : `Aplicar ${s.nome.toLowerCase()}`, perigo: s.tipo !== 'advertencia',
                  sucesso: com2 ? 'Bloqueio solicitado. Aguardando a 2ª aprovação.' : `${s.nome} aplicada a ${u.nome}.`,
                  descricao: [
                    'Sanção aplicada direto no perfil (sem denúncia).',
                    s.tipo === 'suspensao' ? `A conta fica suspensa por ${s.duracaoDias} dias.` : '',
                    com2 ? 'Só passa a valer depois da aprovação de outro admin.' : '',
                    `Prazo de recurso: ${textoDuracao(cfg.sancoes.prazoRecurso)}.`,
                  ].filter(Boolean).join(' '),
                  executar: (j) => sancionar.mutateAsync({ id: u.id, sancaoId: s.id, justificativa: j }),
                })}>
                {com2 ? `Solicitar ${s.nome.toLowerCase()}` : s.nome}
              </Button>
            );
          })}
        </Stack>
      </Box>

      <Divider />
      <Secao titulo={`Sanções (${p.sancoes.length})`} vazio="Nenhuma sanção.">
        {p.sancoes.map((s) => (
          <Linha key={s.id} titulo={<>{s.sancaoNome} <SeloSancao s={s.status} /></>}
            sub={<>{s.aplicadaEm ? <>aplicada <Quando iso={s.aplicadaEm} /></> : <>pedida <Quando iso={s.solicitadoEm} /></>} por {s.solicitadoPor}{s.casoId && <> · <Link component={RouterLink} to={`/denuncias?caso=${s.casoId}`}>{s.casoId}</Link></>}{s.motivoReversao && <> · revertida: “{s.motivoReversao}”</>}</>} />
        ))}
      </Secao>
      <Secao titulo={`Denúncias recebidas (${p.casosRecebidos.length})`} vazio="Nenhuma denúncia contra este usuário.">
        {p.casosRecebidos.map((c) => (
          <Linha key={c.id} titulo={<><Link component={RouterLink} to={`/denuncias?caso=${c.id}`}>{c.id}</Link> · {c.categoria} <SeloCaso s={c.status} /></>}
            sub={<>por {c.denunciante} · <Quando iso={c.criadoEm} />{c.decisao && ` · ${c.decisao}`}</>} />
        ))}
      </Secao>
      <Secao titulo={`Denúncias feitas (${p.casosFeitos.length})`} vazio="Nenhuma denúncia feita.">
        {p.casosFeitos.map((c) => (
          <Linha key={c.id} titulo={<><Link component={RouterLink} to={`/denuncias?caso=${c.id}`}>{c.id}</Link> · {c.categoria} <SeloCaso s={c.status} /></>}
            sub={<>contra {c.denunciado} · <Quando iso={c.criadoEm} /></>} />
        ))}
      </Secao>
      <Secao titulo={`Últimas avaliações recebidas (${p.avaliacoesRecebidas.length})`} vazio="Nenhuma avaliação recebida.">
        {p.avaliacoesRecebidas.slice(0, 6).map((a) => (
          <Linha key={a.id} titulo={<><Estrelas nota={a.nota} /> {a.status === 'oculta' && '(oculta)'}</>} sub={<>“{a.comentario}” — {a.autor}, <Quando iso={a.criadoEm} /></>} />
        ))}
      </Secao>
      {confirmar.dialogo}
    </Stack>
  );
}

function Secao({ titulo, vazio, children }: { titulo: string; vazio: string; children: ReactNode[] }) {
  return (
    <Box>
      <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>{titulo}</Typography>
      {children.length === 0 ? <Typography variant="body2" color="text.secondary">{vazio}</Typography> : <Stack component="ul" spacing={1.25} sx={{ listStyle: 'none', p: 0, m: 0 }}>{children}</Stack>}
    </Box>
  );
}

function Linha({ titulo, sub }: { titulo: ReactNode; sub: ReactNode }) {
  return (
    <Box component="li" sx={{ fontSize: 14 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>{titulo}</Box>
      <Sub>{sub}</Sub>
    </Box>
  );
}
