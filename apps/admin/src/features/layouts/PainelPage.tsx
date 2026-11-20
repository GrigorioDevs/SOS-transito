// Visão geral do painel admin (layout "Central Noturna"): saúde do app e moderação.
// Prazos, metas, sanções e notas vêm da configuração (useConfiguracoes), nunca fixos aqui.
import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Linhas, Provas, Rosca, iniciais, Ic, rotuloSaude } from './components/graficos';
import { SegFiltro, useSegmento } from './components/comum';
import { useCasos, usePainelGovernanca } from '../../api/hooks';
import { useConfiguracoes } from '../../config/hooks';
import { buscarMeta, maiorJanelaReincidencia, procedentesNaJanela, sancaoSugerida, saudePorMeta, textoMeta } from '../../config/regras';
import type { ConfiguracoesAdmin } from '../../config/tipos';
import type { Caso, Kpi, PainelGovernanca, Saude } from '../../api/tipos';
import { Carregando, ErroCarga } from '../../components/estados';
import { ROTULO_CASO, numero } from '../../components/formatos';
import { Kpis, piorSaude } from '../../components/ui';
import PainelDecisao from '../denuncias/PainelDecisao';
import { SeloNivel } from '../denuncias/DenunciasPage';
import { casoVencido, prazoDoCaso } from '../denuncias/prazos';

const corNota = ['#25C78A', '#7CDDB9', '#8494A7', '#FFA940', '#FF5252'];

interface Indicador { metaId: string; nome: string; valor: number | null; texto: string; saude?: Saude; meta?: string }
interface Setor { id: string; nome: string; rota?: string; icone: 'alert' | 'siren' | 'check' | 'users'; indicadores: Indicador[]; saude: Saude }

// Setores do app e seus indicadores. A cor de cada indicador vem da meta configurada;
// a do setor é a pior entre os seus indicadores; a geral é a pior entre os setores.
function montarSetores(p: PainelGovernanca, vencidos: number, cfg: ConfiguracoesAdmin): Setor[] {
  const ind = (metaId: string, valor: number | null, texto: string): Indicador => {
    const m = buscarMeta(cfg, metaId);
    return { metaId, nome: m?.nome ?? metaId, valor, texto, saude: m && valor !== null ? saudePorMeta(valor, m) : undefined, meta: m ? textoMeta(m) : undefined };
  };
  const setores: Omit<Setor, 'saude'>[] = [
    { id: 'moderacao', nome: 'Moderação', rota: '/denuncias', icone: 'alert', indicadores: [
      ind('casos_vencidos', vencidos, String(vencidos)),
      ind('tempo_resolucao', p.tempoResolucaoH, p.tempoResolucaoH === null ? 'sem casos' : `${p.tempoResolucaoH}h`),
    ] },
    { id: 'atendimento', nome: 'Atendimento', icone: 'siren', indicadores: [
      ind('finalizacao', p.finalizacao, `${numero(p.finalizacao)}%`),
      ind('cancelamento', p.cancelamento, `${numero(p.cancelamento)}%`),
    ] },
    { id: 'satisfacao', nome: 'Satisfação', rota: '/avaliacoes', icone: 'check', indicadores: [
      ind('satisfacao', p.satisfacao, `${numero(p.satisfacao)}%`),
      ind('insatisfacao', p.insatisfacao, `${numero(p.insatisfacao)}%`),
    ] },
    { id: 'retencao', nome: 'Retenção', rota: '/retencao', icone: 'users', indicadores: [
      ind('churn_clientes', p.churnClientes, `${numero(p.churnClientes)}%`),
      ind('churn_prestadores', p.churnPrestadores, `${numero(p.churnPrestadores)}%`),
    ] },
  ];
  return setores.map((s) => ({ ...s, saude: piorSaude(s.indicadores.map((i) => i.saude)) }));
}

function montarKpis(p: PainelGovernanca, vencidos: number, cfg: ConfiguracoesAdmin, seg: string): Kpi[] {
  const churnId = seg === 'prestadores' ? 'churn_prestadores' : 'churn_clientes';
  const comMeta = (k: Kpi, valor: number | null) => {
    const m = k.metaId ? buscarMeta(cfg, k.metaId) : undefined;
    return m && valor !== null ? { ...k, saude: saudePorMeta(valor, m), sub: `${k.sub} · ${textoMeta(m)}` } : k;
  };
  const variacao = p.novosVariacao === null ? 'sem comparação' : `${p.novosVariacao >= 0 ? '+' : ''}${p.novosVariacao}% vs semana anterior`;
  return [
    comMeta({ id: 'recl', label: 'Reclamações abertas', value: String(p.reclamacoesAbertas), sub: `+${p.reclamacoesHoje} hoje · ${vencidos} fora do prazo`, metaId: 'casos_vencidos' }, vencidos),
    comMeta({ id: 'final', label: 'Taxa de finalização', value: `${numero(p.finalizacao)}%`, sub: 'chamados (7 dias)', metaId: 'finalizacao' }, p.finalizacao),
    comMeta({ id: 'sat', label: 'Satisfação', value: `${numero(p.satisfacao)}%`, sub: `${numero(p.insatisfacao)}% insatisfeitos (30d)`, metaId: 'satisfacao' }, p.satisfacao),
    { id: 'novos', label: 'Novos usuários (7d)', value: String(p.novos7d), sub: variacao },
    comMeta({ id: 'saidas', label: 'Saíram do app (7d)', value: String(p.saidas7d), sub: `churn ${numero(p.churn)}% · ${cfg.retencao.diasSemUsoParaSaida}d sem uso`, metaId: seg === 'todos' ? undefined : churnId }, p.churn),
    comMeta({ id: 'resol', label: 'Tempo médio de resolução', value: p.tempoResolucaoH === null ? '—' : `${p.tempoResolucaoH}h`, sub: 'denúncias (30d)', metaId: 'tempo_resolucao' }, p.tempoResolucaoH),
  ];
}

const MENSAGEM: Record<Saude, string> = {
  r: 'Crítico: há setores que precisam de ação agora.',
  y: 'Atenção: alguns indicadores estão fora da meta.',
  g: 'Saudável: todos os indicadores dentro da meta.',
};

export default function PainelPage() {
  const [seg, setSeg] = useSegmento();
  const [aberto, setAberto] = useState<string | null>(null);
  const navegar = useNavigate();
  const painel = usePainelGovernanca(seg);
  const casosQ = useCasos();
  const { data: cfg } = useConfiguracoes();
  const p = painel.data;
  const casos = casosQ.data ?? [];

  if (painel.isError && !p) return <ErroCarga erro={painel.error} onTentar={() => painel.refetch()} />;
  if (!p || !cfg) return <Carregando texto="Carregando a visão geral…" />;

  const vencidos = casos.filter(casoVencido).length;
  const setores = montarSetores(p, vencidos, cfg);
  const geral = piorSaude(setores.map((s) => s.saude));
  const kpis = montarKpis(p, vencidos, cfg, seg);
  const abertos = casos.filter((c) => c.status !== 'resolvido');
  const recentes = [...abertos].sort((a, b) => (prazoDoCaso(a).ate ?? '9').localeCompare(prazoDoCaso(b).ate ?? '9')).slice(0, 6);

  // Reincidentes = denunciados com decisões procedentes na maior janela das regras de reincidência.
  const janela = maiorJanelaReincidencia(cfg);
  const reinc = [...new Map(casos.map((c) => [c.denunciadoId, c])).values()]
    .map((c) => ({ c, n: procedentesNaJanela(c.procedentes, janela), sug: sancaoSugerida(cfg, c.procedentes) }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);

  return (
    <>
      <div className="pghead">
        <span className="s">Dados fictícios · atualizados <span aria-live="polite">{painel.isFetching ? 'agora…' : 'agora'}</span></span>
        <SegFiltro value={seg} onChange={setSeg} />
      </div>
      {painel.isError && <ErroCarga erro={painel.error} onTentar={() => painel.refetch()} />}

      <section className="saude" aria-labelledby="saude-titulo">
        <div className={`semaforo ${geral}`} role="img" aria-label={`Saúde geral: ${rotuloSaude[geral]}`}>
          <i className="r" /><i className="y" /><i className="g" />
        </div>
        <div className="saude-txt">
          <h2 id="saude-titulo">Saúde do app: {rotuloSaude[geral]}</h2>
          <p>{MENSAGEM[geral]} Metas em <Link to="/configuracoes?aba=metas">Configurações</Link>.</p>
        </div>
        <div className="setores">
          {setores.map((s) => {
            const corpo = (
              <>
                <div className="st-h"><Ic n={s.icone} s={16} /><b>{s.nome}</b><i className={`dot ${s.saude}`} role="img" aria-label={rotuloSaude[s.saude]} /></div>
                {s.indicadores.map((i) => (
                  <div key={i.metaId} className="st-i" title={i.meta}>
                    {i.saude && <i className={`dot ${i.saude}`} role="img" aria-label={rotuloSaude[i.saude]} />}
                    <span>{i.nome}</span><b>{i.texto}</b>
                  </div>
                ))}
              </>
            );
            return s.rota
              ? <Link key={s.id} to={s.rota} className={`setor ${s.saude}`} aria-label={`${s.nome}: ${rotuloSaude[s.saude]}. Abrir`}>{corpo}</Link>
              : <div key={s.id} className={`setor ${s.saude}`}>{corpo}</div>;
          })}
        </div>
      </section>

      <Kpis itens={kpis} destacarPrimeiro />

      <section className="grid">
        <div className="card">
          <h3><Ic n="users" s={18} /> Crescimento: entradas × saídas <span className="m">{p.semanas.length} semanas</span></h3>
          <div className="leg"><span style={{ ['--c' as string]: '#FFC928' }}>Novos usuários</span><span style={{ ['--c' as string]: '#FF5252' }}>Saíram</span></div>
          <div role="img" aria-label={`Novos por semana: ${p.entradas.join(', ')}. Saídas: ${p.saidas.join(', ')}.`}>
            <Linhas a={p.entradas} b={p.saidas} labels={p.semanas} w={640} h={190} c1="#FFC928" c2="#FF5252" grid="#ffffff10" labelColor="#8494A7" />
          </div>
          <div className="chips">
            <span className="chip" style={{ color: 'var(--ink)' }}>Motivos de saída:</span>
            {p.motivos.length === 0 && <span className="chip">sem respostas</span>}
            {p.motivos.slice(0, 4).map((m) => <span key={m.motivo} className="chip">{m.motivo}<b>{m.pct}%</b></span>)}
            <Link to="/retencao" className="chip">Ver retenção →</Link>
          </div>
        </div>
        <div className="card">
          <h3><Ic n="check" s={18} /> Satisfação × insatisfação <span className="m">30 dias</span></h3>
          <div className="dn">
            <div className="c">
              <Rosca size={150} segs={p.notas.map((n, i) => [n.pct, corNota[i]])} track="#ffffff10" thick={16} />
              <div><span><b>{numero(p.satisfacao, 0)}%</b><small>satisfeitos</small></span></div>
            </div>
            <div className="st">
              {p.notas.map((n, i) => <div key={n.estrelas}><i style={{ background: corNota[i] }} />{n.estrelas} estrela{n.estrelas > 1 ? 's' : ''}<b>{numero(n.pct)}%</b></div>)}
              <small className="s">Satisfeito ≥ {cfg.avaliacoes.notaSatisfeito}★ · insatisfeito ≤ {cfg.avaliacoes.notaInsatisfeito}★</small>
              {p.avaliacoesEmRevisao > 0 && <Link to="/avaliacoes" className="s lk">{p.avaliacoesEmRevisao} avaliação(ões) para revisar →</Link>}
            </div>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3><Ic n="alert" s={18} /> Denúncias mais urgentes <Link to="/denuncias" className="m">{abertos.length} abertas · ver todas →</Link></h3>
          {casosQ.isPending && <Carregando compacto texto="Carregando denúncias…" />}
          {casosQ.isError && <ErroCarga erro={casosQ.error} onTentar={() => casosQ.refetch()} />}
          {casosQ.isSuccess && recentes.length === 0 && <p className="s">Nenhuma denúncia aberta. Tudo em dia.</p>}
          {recentes.length > 0 && (
            <>
              <table className="tbl">
                <thead><tr><th>Caso</th><th>Envolvidos</th><th className="hm">Provas</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead>
                <tbody>
                  {recentes.map((c) => (
                    <Fragment key={c.id}>
                      <tr>
                        <td><b>{c.categoria}</b><small><SeloNivel cfg={cfg} nivelId={c.nivelId} /> {c.id} · {c.chamado}</small></td>
                        <td>{c.denunciante} → {c.denunciado}<small>{c.denuncianteTipo} denuncia {c.denunciadoTipo.split(' ·')[0].toLowerCase()}</small></td>
                        <td className="hm"><div className="pv"><Provas lista={c.provas} w={40} h={30} dark /></div></td>
                        <td><span className={`tag ${c.status}`}>{ROTULO_CASO[c.status]}</span><Prazo c={c} /></td>
                        <td><button className="btn" onClick={() => setAberto(aberto === c.id ? null : c.id)} aria-expanded={aberto === c.id} aria-controls={`dec-${c.id}`}>{aberto === c.id ? 'Fechar' : 'Analisar'}</button></td>
                      </tr>
                      {aberto === c.id && (
                        <tr id={`dec-${c.id}`}>
                          <td colSpan={5} className="painel-caso">
                            <div className="relato">“{c.relato}”</div>
                            <PainelDecisao caso={c} cfg={cfg} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              <ul className="mob cards" aria-label="Denúncias mais urgentes">
                {recentes.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <button className="mc" onClick={() => navegar(`/denuncias?caso=${c.id}`)} aria-label={`Abrir caso ${c.id}`}>
                      <span className="t">{c.categoria}<span className={`tag ${c.status}`}>{ROTULO_CASO[c.status]}</span></span>
                      <small>{c.denunciante} → {c.denunciado} · {c.provas.length} provas · <Prazo c={c} inline /></small>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="card">
          <h3><Ic n="alert" s={18} /> Reincidentes · {janela} dias</h3>
          {reinc.length === 0 && <p className="s">Nenhum reincidente no período.</p>}
          {reinc.map(({ c, n, sug }) => (
            <Link key={c.denunciadoId} to={`/usuarios?usuario=${c.denunciadoId}`} className="risk">
              <div className="i" aria-hidden>{iniciais(c.denunciado)}</div>
              <div className="m"><b>{c.denunciado}</b><small>{c.denunciadoTipo}{sug ? ` · sugere: ${sug.nome}` : ''}</small></div>
              <span className="n">{n} procedente{n > 1 ? 's' : ''}</span>
            </Link>
          ))}
          <div className="chips">
            <span className="chip">Bloqueados<b>{p.bloqueios.ativos}</b></span>
            <span className="chip">Suspensos<b>{p.bloqueios.suspensos}</b></span>
            <Link to="/bloqueios?aba=pendentes" className="chip">2ª aprovação<b>{p.bloqueios.pendentes}</b></Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Prazo({ c, inline = false }: { c: Caso; inline?: boolean }) {
  const prazo = prazoDoCaso(c);
  const Tag = inline ? 'span' : 'small';
  return <Tag className={`pz ${prazo.saude ?? ''}`}>{prazo.texto}</Tag>;
}
