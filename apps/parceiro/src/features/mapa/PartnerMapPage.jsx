import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowLeft, Bell, Check, ChevronDown, CircleHelp, CircleUserRound,
  Compass, Home, Layers3, List, LoaderCircle, LocateFixed, MapPin, Menu,
  Navigation2, Power, RadioTower, RefreshCw, Search, ShieldCheck, SlidersHorizontal,
  Wallet, X,
} from 'lucide-react';
import GoogleDemandMap from './components/GoogleDemandMap.jsx';
import { PartnerDrawer } from './components/PartnerPanels.jsx';
import { usePartnerPosition } from './hooks/usePartnerPosition.js';
import { ApiError, formatMoneyFromCents, normalizeLatLng, partnerApi } from './services/api.js';
import { connectPartnerHub, disconnectPartnerHub, publishPosition } from './services/realtime.js';
import './PartnerMapPage.css';

export default function PartnerMapPage({ onHome, hidden = false }) {
  const [online, setOnline] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [changeLoading, setChangeLoading] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [backendError, setBackendError] = useState('');
  const [signalState, setSignalState] = useState('disconnected');
  const [earnings, setEarnings] = useState(null);
  const [history, setHistory] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [drawer, setDrawer] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [route, setRoute] = useState(null);
  const [routeBusy, setRouteBusy] = useState(false);
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [heatVisible, setHeatVisible] = useState(true);
  const [demandInfo, setDemandInfo] = useState({ count: null, error: '' });
  const [mapWarning, setMapWarning] = useState('');
  const [recenterIndex, setRecenterIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const connectionRef = useRef(null);
  const connectingRef = useRef(null);
  const mountedRef = useRef(false);
  const onlineRef = useRef(false);
  const lastLocationRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const jobsLoaderRef = useRef(null);

  const loadJobs = useCallback(async (signal) => {
    if (!onlineRef.current) { setJobs([]); return; }
    const items = await partnerApi.getAvailableJobs(signal);
    setJobs(items);
  }, []);
  useEffect(() => { jobsLoaderRef.current = loadJobs; }, [loadJobs]);

  const sendLivePosition = useCallback(async (point) => {
    lastLocationRef.current = point;
    if (!onlineRef.current) return;
    // Limita tráfego; o servidor também precisa limitar e autorizar as atualizações.
    const now = Date.now();
    if (now - lastSentAtRef.current < 5000) return;
    lastSentAtRef.current = now;
    try { await publishPosition(connectionRef.current, point); }
    catch { setSignalState('reconnecting'); }
  }, []);

  const { position, gpsStatus, gpsError, getPosition } = usePartnerPosition({ online, onLivePosition: sendLivePosition });
  useEffect(() => { if (position) lastLocationRef.current = position; }, [position]);
  useEffect(() => { onlineRef.current = online; }, [online]);

  const connect = useCallback(async () => {
    if (connectionRef.current?.state === 'Connected') return connectionRef.current;
    if (connectingRef.current) return connectingRef.current;
    if (connectionRef.current) {
      const stale = connectionRef.current; connectionRef.current = null;
      await disconnectPartnerHub(stale).catch(() => {});
    }
    connectingRef.current = connectPartnerHub({
      onOffer: () => jobsLoaderRef.current?.().catch(() => {}),
      onStatusUpdate: () => partnerApi.getActiveJob().then((data) => setActiveJob(data?.id ? data : null)).catch(() => {}),
      onStateChange: setSignalState,
      onReconnected: async () => {
        lastSentAtRef.current = 0;
        if (onlineRef.current && lastLocationRef.current) {
          await publishPosition(connectionRef.current, lastLocationRef.current);
        }
        await jobsLoaderRef.current?.().catch(() => {});
      },
    }).then((connection) => {
      if (!mountedRef.current) { disconnectPartnerHub(connection).catch(() => {}); return connection; }
      connectionRef.current = connection;
      return connection;
    }).finally(() => { connectingRef.current = null; });
    return connectingRef.current;
  }, []);

  async function closeRealtime() {
    const current = connectionRef.current;
    connectionRef.current = null;
    if (current) await disconnectPartnerHub(current).catch(() => {});
    setSignalState('disconnected');
  }

  const refreshInitial = useCallback(async (signal) => {
    setBackendError(''); setAvailabilityLoading(true);
    try {
      const status = await partnerApi.getAvailability(signal);
      if (typeof status?.online !== 'boolean') throw new ApiError('A API deve retornar o campo online (boolean).');
      if (signal?.aborted) return;
      setOnline(status.online); onlineRef.current = status.online;
      setActiveJob(status.atendimentoAtivo ?? null);
      if (status.online) {
        connect().catch(() => { if (mountedRef.current) setSignalState('disconnected'); });
        jobsLoaderRef.current?.().catch(() => {});
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !signal?.aborted) setBackendError(error.message);
    } finally { if (!signal?.aborted) setAvailabilityLoading(false); }
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    const aborter = new AbortController();
    refreshInitial(aborter.signal);
    partnerApi.getEarnings(aborter.signal).then((data) => {
      if (!aborter.signal.aborted) setEarnings(data);
    }).catch(() => {});
    return () => {
      mountedRef.current = false;
      aborter.abort();
      const connection = connectionRef.current;
      connectionRef.current = null;
      if (connection) disconnectPartnerHub(connection).catch(() => {});
    };
  }, [refreshInitial]);

  async function toggleOnline() {
    if (availabilityLoading || changeLoading || backendError) return;
    setNotice(''); setChangeLoading(true);
    try {
      if (online) {
        const job = await partnerApi.getActiveJob();
        if (job?.id || job?.ativo) {
          setActiveJob(job);
          setNotice('Há um atendimento em andamento. Finalize ou resolva o atendimento antes de sair.');
          return;
        }
        const result = await partnerApi.setAvailability(false);
        if (result?.online !== false) throw new ApiError('A API não confirmou o status offline.');
        setOnline(false); onlineRef.current = false;
        setJobs([]); setDrawer(null); setRoute(null);
        await closeRealtime();
        setNotice('Você está offline. Novas ofertas foram desativadas.');
      } else {
        const current = await getPosition();
        const result = await partnerApi.setAvailability(true);
        if (result?.online !== true) throw new ApiError('A API não confirmou o status online.');
        onlineRef.current = true; setOnline(true);
        try {
          const connection = await connect();
          await publishPosition(connection, current);
          lastSentAtRef.current = Date.now();
          await loadJobs().catch((error) => setPanelError(error.message));
          setNotice('Você está online e pronto para receber novos chamados.');
        } catch (connectionError) {
          // Nenhum botão declara ONLINE quando o Hub falha na ativação.
          try {
            const rollback = await partnerApi.setAvailability(false);
            if (rollback?.online === false) { onlineRef.current = false; setOnline(false); await closeRealtime(); }
          } catch { /* Estado incerto: reconsulta abaixo. */ }
          await refreshInitial();
          throw new ApiError(`Conexão em tempo real falhou: ${connectionError.message}. Estado atualizado a partir do servidor.`);
        }
      }
    } catch (error) { setNotice(error.message || 'Não foi possível alterar o status.'); }
    finally { setChangeLoading(false); }
  }

  async function openPanel(type) {
    setDrawer(type); setPanelError(''); setPanelLoading(true);
    try {
      if (type === 'ganhos') {
        const [summary, transactions] = await Promise.all([partnerApi.getEarnings(), partnerApi.getEarningsHistory()]);
        setEarnings(summary); setHistory(transactions);
      } else if (type === 'solicitacoes') await loadJobs();
    } catch (e) { setPanelError(e.message); }
    finally { setPanelLoading(false); }
  }

  async function selectJob(id) {
    setDrawer('detalhe'); setDetailLoading(true); setDetailError('');
    setSelectedJob(null); setRoute(null);
    try { setSelectedJob(await partnerApi.getJob(id)); }
    catch (e) { setDetailError(e.message); }
    finally { setDetailLoading(false); }
  }

  async function calculateRoute() {
    if (!selectedJob || !position) { setNotice('Obtenha a localização GPS para calcular a rota.'); return; }
    const target = normalizeLatLng(selectedJob.localizacao);
    if (!target) { setNotice('O servidor não retornou coordenadas válidas para este chamado.'); return; }
    setRouteBusy(true);
    try {
      const result = await partnerApi.getRoute(position, target);
      if (!Array.isArray(result?.coordinates) || result.coordinates.length < 2) throw new ApiError('Rota não retornada pela API.');
      setRoute(result);
      setDrawer(null);
      setNotice('Rota exibida no mapa. Volte aos chamados para aceitar a oferta.');
    } catch (e) { setNotice(e.message); }
    finally { setRouteBusy(false); }
  }

  async function acceptJob() {
    if (!online || !selectedJob) return;
    setAcceptBusy(true); setNotice('');
    try {
      const reply = await partnerApi.acceptJob(selectedJob.id);
      if (!reply?.id) throw new ApiError('O servidor não confirmou o aceite.');
      setActiveJob(reply); setDrawer(null); setRoute(null);
      await loadJobs().catch(() => {});
      setNotice(`Chamado ${reply.id} aceito. Acompanhe as próximas etapas pelo painel.`);
    } catch (e) { setNotice(e.message); }
    finally { setAcceptBusy(false); }
  }

  async function recenter() {
    try { await getPosition(); setRecenterIndex((n) => n + 1); }
    catch (e) { setNotice(e.message); }
  }

  const statusLabel = availabilityLoading ? 'Consultando disponibilidade...' : backendError
    ? 'Status indisponível' : online ? 'Você está online' : 'Você está offline';

  return <div className={`sos-map-app ${hidden ? 'sos-map-app--hidden' : ''}`} aria-hidden={hidden}>
    <GoogleDemandMap position={position} recenterIndex={recenterIndex} heatVisible={heatVisible} route={route}
      onHotspotClick={() => openPanel('solicitacoes')} onDemandInfo={setDemandInfo} onMapState={setMapWarning}/>

    <div className="sos-map-vignette" aria-hidden="true" />

    <header className="sos-floating-header">
      <button className="sos-round-top" aria-label="Abrir a Home e menu principal" title="Home do parceiro" onClick={onHome}><Home size={27}/></button>
      <button className="sos-earnings-pill" onClick={() => openPanel('ganhos')} aria-label="Abrir painel de ganhos">
        <span className="sos-earnings-symbol">R$</span>
        <strong>{earnings ? formatMoneyFromCents(earnings.totalRecebidoCentavos).replace('R$\u00a0', '').replace('R$ ', '') : '—'}</strong>
        <ChevronDown size={19}/>
      </button>
      <button className="sos-round-top" aria-label="Pesquisar solicitações" title="Chamados disponíveis" onClick={() => openPanel('solicitacoes')}><Search size={27}/></button>
    </header>

    <div className="sos-brand-label"><span className="sos-brand-tick"/> SOS <strong>TRÂNSITO</strong> <span>· PARCEIRO</span></div>

    <aside className="sos-map-right-tools" aria-label="Ferramentas do mapa">
      <button className={`sos-float-tool ${heatVisible ? 'sos-float-tool--active' : ''}`} aria-label={heatVisible ? 'Ocultar mapa de calor' : 'Mostrar mapa de calor'} title="Mapa de calor" aria-pressed={heatVisible} onClick={() => setHeatVisible(v => !v)}><Layers3 size={22}/></button>
      <button className="sos-float-tool" aria-label="Abrir menu principal" title="Menu do parceiro" onClick={onHome}><Menu size={24}/></button>
      <button className="sos-float-tool" aria-label="Centralizar localização GPS" title="Minha localização" onClick={recenter} disabled={gpsStatus === 'loading'}><LocateFixed size={24}/></button>
    </aside>

    <div className="sos-map-left-tools">
      <div className="sos-gps-tag"><span className={`sos-gps-bullet ${gpsStatus === 'ready' ? 'sos-gps-bullet--on' : ''}`}/>{gpsStatus === 'ready' ? 'LOCALIZAÇÃO ATIVA' : gpsStatus === 'loading' ? 'BUSCANDO GPS' : 'GPS INDISPONÍVEL'}</div>
      {demandInfo.count !== null && <div className="sos-heat-tag"><Activity size={15}/> {demandInfo.count} {demandInfo.count === 1 ? 'CHAMADO NA ÁREA VISÍVEL' : 'CHAMADOS NA ÁREA VISÍVEL'}</div>}
    </div>

    <div className="sos-start-position">
      <button className={`sos-start-button ${online ? 'sos-start-button--online' : ''}`} type="button"
        disabled={availabilityLoading || changeLoading || Boolean(backendError)} onClick={toggleOnline}
        aria-label={online ? 'Parar de receber chamados' : 'Iniciar e ficar online'}>
        {availabilityLoading || changeLoading ? <LoaderCircle className="sos-spin" size={30}/> : <Power size={29}/>}
        <strong>{availabilityLoading || changeLoading ? 'AGUARDE' : online ? 'PARAR' : 'INICIAR'}</strong>
      </button>
    </div>

    <footer className="sos-bottom-status">
      <button type="button" aria-label="Configurações e Home" onClick={onHome} title="Menu"><SlidersHorizontal size={29}/></button>
      <div className="sos-bottom-copy"><span className={`sos-bottom-indicator ${online ? 'is-online' : ''}`}/><strong>{statusLabel}</strong><small>{online ? signalState === 'connected' ? 'Recebendo chamados em tempo real' : signalState === 'reconnecting' ? 'Reconectando ao servidor...' : 'Aguardando conexão em tempo real' : 'Toque em INICIAR para ficar disponível'}</small></div>
      <button type="button" aria-label="Abrir lista de chamados" title="Chamados" onClick={() => openPanel('solicitacoes')}><List size={30}/></button>
    </footer>

    {(backendError || gpsError || demandInfo.error || mapWarning || (online && signalState === 'disconnected')) && <div className="sos-alert-line" role="alert">
      <CircleHelp size={17}/><span>{backendError || gpsError || demandInfo.error || mapWarning || 'Conexão em tempo real interrompida. Reconecte para continuar recebendo ofertas.'}</span>
      {backendError && <button onClick={() => refreshInitial()}><RefreshCw size={16}/> Tentar novamente</button>}
      {!backendError && online && signalState === 'disconnected' && <button onClick={() => connect().catch((e) => setNotice(e.message))}><RefreshCw size={16}/> Reconectar</button>}
    </div>}

    {notice && <div className="sos-toast" role="status"><span>{notice}</span><button aria-label="Fechar aviso" onClick={() => setNotice('')}><X size={17}/></button></div>}

    {!hidden && <PartnerDrawer type={drawer} onClose={() => { setDrawer(null); setRoute(null); }} earnings={earnings} history={history} jobs={jobs}
      loading={panelLoading} error={panelError} onRefresh={() => openPanel(drawer === 'ganhos' ? 'ganhos' : 'solicitacoes')}
      onSelectJob={selectJob} selectedJob={selectedJob} detailBusy={detailLoading} detailError={detailError}
      routeInfo={route} routeBusy={routeBusy} onRoute={calculateRoute}
      onAccept={acceptJob} acceptBusy={acceptBusy} isOnline={online} activeJob={activeJob}/>}
  </div>;
}
