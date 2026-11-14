import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock3, Compass, LoaderCircle, MapPin, Navigation,
  RadioTower, RefreshCw, Route, Search, ShieldCheck, Truck, Wallet, Wrench, X,
} from 'lucide-react';
import { formatDistanceKm, formatMoneyFromCents } from '../services/api.js';

const SERVICE_NAMES = {
  guincho: 'Guincho', borracheiro: 'Borracheiro', chaveiro: 'Chaveiro',
  eletricista: 'Pane elétrica', pane_seca: 'Pane seca', mecanico: 'Mecânico',
};
const labelService = (type) => SERVICE_NAMES[type] || type || 'Assistência automotiva';
const dateLabel = (iso) => iso && !Number.isNaN(Date.parse(iso))
  ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  : 'Data não informada';

export function PartnerDrawer({ type, onClose, earnings, history, jobs, loading, error, onRefresh, onSelectJob, selectedJob, detailBusy, detailError, routeInfo, routeBusy, onRoute, onAccept, acceptBusy, isOnline, activeJob }) {
  const [search, setSearch] = useState('');
  const displayJobs = useMemo(() => jobs.filter((job) =>
    `${labelService(job?.tipoServico)} ${job?.bairro || ''} ${job?.localizacaoResumo || ''}`.toLowerCase().includes(search.toLowerCase())),
    [jobs, search]);
  if (!type) return null;

  const title = type === 'ganhos' ? 'Seus ganhos' : type === 'detalhe' ? 'Detalhes do chamado' : 'Solicitações disponíveis';
  return <div className="sos-drawer-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="sos-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sos-drawer-grip" aria-hidden="true" />
      <div className="sos-drawer-head">
        <div><span className="sos-eyebrow">SOS TRÂNSITO · PARCEIRO</span><h2>{title}<span className="sos-red-dot">.</span></h2></div>
        <button className="sos-icon-btn" aria-label="Fechar painel" onClick={onClose}><X size={21}/></button>
      </div>

      {type === 'ganhos' && <div className="sos-drawer-body">
        <div className="sos-earning-feature"><span><CircleDollarSign size={18}/> TOTAL RECEBIDO</span><strong>{formatMoneyFromCents(earnings?.totalRecebidoCentavos)}</strong><small>Atendimentos concluídos com repasse recebido, conforme o servidor.</small></div>
        <div className="sos-sheet-title"><h3>Histórico</h3><button onClick={onRefresh} title="Atualizar histórico" aria-label="Atualizar histórico"><RefreshCw size={17}/></button></div>
        {loading ? <Loading /> : error ? <EmptyState title="Não foi possível consultar os ganhos" body={error}/> : history.length === 0 ? <EmptyState title="Ainda não há repasses" body="Os ganhos recebidos aparecerão aqui quando a API registrar pagamentos."/> :
          <div className="sos-transaction-list">{history.map((item) => <div className="sos-transaction" key={item.id}>
            <span className="sos-tx-icon"><Wallet size={19}/></span>
            <div><strong>{labelService(item.tipoServico)}</strong><small>{dateLabel(item.recebidoEm)}</small></div>
            <strong>{formatMoneyFromCents(item.valorRecebidoCentavos)}</strong>
          </div>)}</div>}
      </div>}

      {type === 'solicitacoes' && <div className="sos-drawer-body">
        <div className="sos-search-input"><Search size={18}/><input aria-label="Buscar chamados" placeholder="Buscar serviço ou região..." value={search} onChange={(e) => setSearch(e.target.value)}/></div>
        <div className="sos-sheet-title"><h3>Chamados próximos</h3><button onClick={onRefresh} title="Atualizar chamados" aria-label="Atualizar chamados"><RefreshCw size={17}/></button></div>
        {!isOnline && <div className="sos-note"><RadioTower size={19}/> Fique online para consultar e receber ofertas de serviço.</div>}
        {loading ? <Loading /> : error ? <EmptyState title="Não foi possível consultar chamados" body={error}/> : displayJobs.length === 0 ?
          <EmptyState title="Nenhum chamado disponível" body="Quando houver solicitações para seu perfil e área autorizada, elas aparecerão aqui."/> :
          <div className="sos-jobs">{displayJobs.map((job) => <button className="sos-job-card" key={job.id} onClick={() => onSelectJob(job.id)}>
            <div className="sos-job-top"><span className="sos-job-tag"><Wrench size={14}/> {labelService(job.tipoServico)}</span><strong>{formatMoneyFromCents(job.valorEstimadoCentavos)}</strong></div>
            <h4>{job.localizacaoResumo || 'Local informado no chamado'}</h4>
            <div className="sos-job-meta"><span><MapPin size={15}/> {formatDistanceKm(job.distanciaKm)}</span>{Number.isFinite(job.tempoChegadaMinutos) && <span><Clock3 size={15}/> {job.tempoChegadaMinutos} min</span>}</div>
            <span className="sos-job-open">VER DETALHES <ChevronRight size={17}/></span>
          </button>)}</div>}
      </div>}

      {type === 'detalhe' && <div className="sos-drawer-body">
        {detailBusy ? <Loading /> : detailError ? <EmptyState title="Não foi possível carregar detalhes" body={detailError}/> : !selectedJob ? <EmptyState title="Chamado indisponível" body="A oferta pode ter expirado ou sido atendida."/> : <>
          <div className="sos-detail-price"><span><Truck size={18}/> {labelService(selectedJob.tipoServico)}</span><strong>{formatMoneyFromCents(selectedJob.valorEstimadoCentavos)}</strong><small>Valor estimado pela plataforma</small></div>
          <div className="sos-detail-list">
            <div><MapPin size={20}/><span><small>LOCAL DO ATENDIMENTO</small><strong>{selectedJob.enderecoResumo || selectedJob.localizacaoResumo || 'Consulte o chamado'}</strong></span></div>
            {selectedJob.destinoResumo && <div><Navigation size={20}/><span><small>DESTINO</small><strong>{selectedJob.destinoResumo}</strong></span></div>}
            <div><Compass size={20}/><span><small>DISTÂNCIA ESTIMADA</small><strong>{formatDistanceKm(selectedJob.distanciaKm)}</strong></span></div>
            {selectedJob.descricao && <div><Wrench size={20}/><span><small>DESCRIÇÃO</small><strong>{selectedJob.descricao}</strong></span></div>}
          </div>
          <button type="button" className="sos-secondary-btn" onClick={onRoute} disabled={routeBusy || !selectedJob.localizacao || !isOnline}>
            {routeBusy ? <LoaderCircle className="sos-spin" size={18}/> : <Route size={18}/>}
            {routeBusy ? 'CALCULANDO ROTA' : 'TRAÇAR ROTA'}
          </button>
          {routeInfo && <div className="sos-route-summary"><Route size={18}/>{formatDistanceKm(routeInfo.distanciaKm)} · {Number.isFinite(routeInfo.duracaoMinutos) ? `${Math.round(routeInfo.duracaoMinutos)} min` : 'Previsão indisponível'}</div>}
          {routeInfo?.error && <div className="sos-note">{routeInfo.error}</div>}
          <button type="button" className="sos-accept-btn" onClick={onAccept} disabled={acceptBusy || !isOnline || Boolean(activeJob)}>
            {acceptBusy ? <LoaderCircle className="sos-spin" size={19}/> : <CheckCircle2 size={19}/>}
            {acceptBusy ? 'CONFIRMANDO COM O SERVIDOR...' : activeJob ? 'JÁ EXISTE UM ATENDIMENTO ATIVO' : 'ACEITAR CHAMADO'}
          </button>
          <p className="sos-footnote"><ShieldCheck size={14}/> O aceite só é confirmado quando o servidor autoriza a operação.</p>
        </>}
      </div>}
    </aside>
  </div>;
}

function Loading() { return <div className="sos-loading"><LoaderCircle className="sos-spin" size={25}/> Consultando servidor...</div>; }
function EmptyState({ title, body }) { return <div className="sos-empty-state"><span><Search size={27}/></span><strong>{title}</strong><p>{body}</p></div>; }
