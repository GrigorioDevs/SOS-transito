import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight,
  BadgeCheck, Bell, CalendarDays, CarFront, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleDollarSign, Clock3, Compass, CreditCard, Disc3, FileText,
  Fuel, Headphones, HelpCircle, History, Home, KeyRound, LifeBuoy, ListChecks,
  LocateFixed, Lock, Map, MapPin, Menu as MenuIcon, MessageCircle, Navigation,
  Phone, Power, Radio, Route, Send, Settings2, ShieldCheck, SlidersHorizontal,
  Sparkles, Star, Truck, UserRound, Wallet, Wrench, X, Zap,
} from 'lucide-react';
import { brl, demoChats, demoOffers, demoTransactions, serviceTypes } from './demoData.js';

const ICONS = { Truck, Zap, Disc3, Fuel, KeyRound };
const PRIMARY = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'solicitacoes', label: 'Solicitações', icon: Radio },
  { id: 'ganhos', label: 'Ganhos', icon: CircleDollarSign },
  { id: 'mensagens', label: 'Mensagens', icon: MessageCircle },
  { id: 'menu', label: 'Menu', icon: MenuIcon },
];
const SECONDARY = [
  { id: 'carteira', label: 'Carteira', sub: 'Saldo e repasses', icon: Wallet },
  { id: 'veiculo', label: 'Meu veículo', sub: 'Veículos cadastrados', icon: CarFront },
  { id: 'servicos', label: 'Meus serviços', sub: 'Atuação e raio de cobertura', icon: Wrench },
  { id: 'documentos', label: 'Verificações', sub: 'Identidade e documentos', icon: ShieldCheck },
  { id: 'perfil', label: 'Minha conta', sub: 'Dados do parceiro', icon: UserRound },
  { id: 'configuracoes', label: 'Configurações', sub: 'Preferências e notificações', icon: Settings2 },
  { id: 'ajuda', label: 'Central de ajuda', sub: 'Suporte e orientações', icon: LifeBuoy },
];
const PAGE_NAMES = {
  inicio: 'Visão geral', solicitacoes: 'Solicitações', ganhos: 'Ganhos', mensagens: 'Mensagens',
  menu: 'Seu espaço', carteira: 'Carteira', veiculo: 'Meu veículo', servicos: 'Meus serviços',
  documentos: 'Verificações', perfil: 'Minha conta', configuracoes: 'Configurações',
  ajuda: 'Central de ajuda', atendimento: 'Atendimento em andamento',
};

function Logo({ compact = false }) {
  return <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="SOS Trânsito">
    <span className="brand-mark"><Zap size={22} fill="currentColor" strokeWidth={1.7} /></span>
    {!compact && <span className="brand-words"><strong>SOS <span>TRÂNSITO</span></strong><small>PORTAL DO PARCEIRO</small></span>}
  </div>;
}

function Pill({ children, tone = 'neutral', icon: Icon }) {
  return <span className={`pill pill--${tone}`}>{Icon && <Icon size={13} />}{children}</span>;
}

function SectionHeading({ eyebrow, title, action, onAction, trailing }) {
  return <div className="section-heading">
    <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2></div>
    {trailing || (action && <button className="link-action" type="button" onClick={onAction}>{action} <ArrowUpRight size={15}/></button>)}
  </div>;
}

function MapCanvas({ compact = false, online = false, radius = 15, onExplore }) {
  return <div className={`map-canvas ${compact ? 'map-canvas--compact' : ''}`}>
    <svg viewBox="0 0 780 465" preserveAspectRatio="xMidYMid slice" className="map-art" role="img" aria-label="Mapa esquemático decorativo da região oeste de São Paulo. Não representa geolocalização em tempo real.">
      <defs>
        <radialGradient id="heatA"><stop stopColor="#ed3640" stopOpacity=".38"/><stop offset=".43" stopColor="#ad1d3b" stopOpacity=".2"/><stop offset="1" stopColor="#8d1a36" stopOpacity="0"/></radialGradient>
        <radialGradient id="heatB"><stop stopColor="#f2c739" stopOpacity=".22"/><stop offset=".52" stopColor="#d64940" stopOpacity=".13"/><stop offset="1" stopColor="#852033" stopOpacity="0"/></radialGradient>
        <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="#262b2c" strokeWidth=".9" opacity=".6"/></pattern>
      </defs>
      <rect width="780" height="465" fill="#15191d"/><rect width="780" height="465" fill="url(#grid)"/>
      <path d="M20 0l114 80 79 26 69 89-17 72-91 50-45 148H0Z" fill="#1d2426"/>
      <path d="M780 0H527l-65 67 26 99 111 51 43 92 138-9Z" fill="#1b2125"/>
      <path d="M374 0l-16 105 55 53-38 110 91 77-60 120" fill="none" stroke="#343e40" strokeWidth="36" strokeLinejoin="round"/>
      <path d="M-40 171C91 157 156 221 255 216S431 180 525 192 687 253 835 198" stroke="#343a3d" strokeWidth="32" fill="none"/>
      <g fill="none" stroke="#3d4649" strokeWidth="9" strokeLinecap="round" opacity=".95">
        <path d="M-15 341Q165 272 262 335T520 317 800 370"/>
        <path d="M60-40 168 119 115 263 217 474"/>
        <path d="M485-30 512 88 643 175 609 490"/>
        <path d="M270-30 263 80 194 173 307 278 254 489"/>
        <path d="M760-40 685 86 718 193 671 320 731 500"/>
      </g>
      <g fill="none" stroke="#899095" strokeWidth="2" strokeLinecap="round" opacity=".21">
        <path d="M-15 341Q165 272 262 335T520 317 800 370"/>
        <path d="M60-40 168 119 115 263 217 474"/>
        <path d="M485-30 512 88 643 175 609 490"/>
        <path d="M270-30 263 80 194 173 307 278 254 489"/>
        <path d="M760-40 685 86 718 193 671 320 731 500"/>
        <path d="M-40 171C91 157 156 221 255 216S431 180 525 192 687 253 835 198" strokeWidth="2.5"/>
      </g>
      <g fill="none" stroke="#333a3c" strokeWidth="2" opacity=".95">
        <path d="M14 90 182 160 396 112 527 51M53 410l137-67 236 65 255-77M398 30l-91 126 159 72 152-10M140 30 234 100l8 183 102 100M549 0l-47 97 31 280M0 260l145-23 125 56 150-65 224 40 150-91"/>
        <path d="M35 22l57 71M42 240l85-103M114 461l34-162M343 4l-29 108M345 291l75 91M685 10l-41 129M720 280l-62 120"/>
      </g>
      <circle cx="250" cy="208" r="195" fill="url(#heatA)"/><circle cx="542" cy="217" r="194" fill="url(#heatB)"/><circle cx="404" cy="363" r="167" fill="url(#heatA)"/>
      <g fill="#8d959c" fontFamily="Inter, Arial, sans-serif" fontSize="15" fontWeight="600" opacity=".83">
        <text x="109" y="120">JANDIRA</text><text x="290" y="165">BARUERI</text>
        <text x="505" y="131">ALPHAVILLE</text><text x="540" y="332">OSASCO</text>
        <text x="172" y="382">CARAPICUÍBA</text>
      </g>
      <path d="M259 253 342 222 458 285" fill="none" stroke="#f2c739" strokeWidth="3" strokeDasharray="6 7" opacity=".8"/>
      <g><circle cx="342" cy="222" r="39" fill="#ed3640" opacity=".12"/><circle cx="342" cy="222" r="27" fill="#ed3640" opacity=".14"/><circle cx="342" cy="222" r="13" fill="#ed3640" stroke="#fff" strokeWidth="3"/><circle cx="342" cy="222" r="3" fill="white"/></g>
      <g><circle cx="259" cy="253" r="13" fill="#171b1e" stroke="#f2c739" strokeWidth="3"/><circle cx="259" cy="253" r="4" fill="#f2c739"/></g>
      <g><circle cx="458" cy="285" r="12" fill="#171b1e" stroke="#ed3640" strokeWidth="3"/><circle cx="458" cy="285" r="4" fill="#ed3640"/></g>
    </svg>
    <div className="map-canvas-top"><span className="map-legend"><span className="map-legend-dot"/>MAPA DE COBERTURA</span><span className="map-demo">ILUSTRATIVO</span></div>
    <div className="map-mini-bottom"><div className="map-range"><LocateFixed size={16}/><span><strong>Barueri e região</strong><small>Raio de {radius} km · exemplo</small></span></div>
      <button type="button" className="map-zoom-btn" onClick={onExplore} aria-label="Abrir mapa na visão geral"><ArrowUpRight size={18}/></button>
    </div>
    {online && <div className="map-online-dot" title="Status online nesta demonstração"/>}
  </div>;
}

function NavButton({ item, active, onClick, count, mobile = false }) {
  const Icon = item.icon;
  return <button type="button" className={`nav-button ${active ? 'is-selected' : ''} ${mobile ? 'is-mobile' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
    <span className="nav-icon"><Icon size={mobile ? 23 : 19} strokeWidth={active ? 2.3 : 1.9}/>{count ? <i className="nav-dot"/> : null}</span>
    <span>{item.label}</span>{!mobile && active && <span className="nav-active-bar"/>}
  </button>;
}

function OfferCard({ offer, online, onDetails, onAccept, onDecline, active = false, condensed = false }) {
  const Icon = ICONS[offer.icon] || Wrench;
  return <article className={`offer-card ${active ? 'offer-card--featured' : ''} ${condensed ? 'offer-card--condensed' : ''}`}>
    <div className="offer-topline"><span className="offer-category"><span className="service-emblem"><Icon size={20}/></span><span>{offer.type}<small>{offer.id}</small></span></span><Pill tone={active ? 'yellow' : 'neutral'} icon={active ? Sparkles : Clock3}>{offer.badge}</Pill></div>
    <div className="offer-price-line"><div><div className="offer-price">{brl(offer.price)}</div><div className="offer-price-caption">Valor estimado do atendimento</div></div><div className="offer-distance"><strong>{offer.distance}</strong><span>até o cliente</span></div></div>
    <div className="journey-lines"><div className="journey-row"><span className="journey-point journey-point--pickup"/><p><span>LOCAL DO SOCORRO</span><strong>{offer.pickup}</strong></p></div>{offer.destination ? <div className="journey-row"><span className="journey-point journey-point--drop"/><p><span>DESTINO DO GUINCHO</span><strong>{offer.destination}</strong></p></div> : <div className="journey-row"><span className="journey-point journey-point--drop"/><p><span>TIPO DE ATENDIMENTO</span><strong>{offer.length}</strong></p></div>}</div>
    <div className="offer-meta"><span><Clock3 size={14}/>{offer.eta} para chegar</span><span><CarFront size={15}/>{offer.vehicle}</span></div>
    <div className="offer-actions"><button className="btn btn--outline btn--small" type="button" onClick={() => onDetails(offer)}>Detalhes <ChevronRight size={16}/></button><button className="btn btn--red btn--grow" type="button" disabled={!online} onClick={() => onAccept(offer)}>{online ? 'ACEITAR CHAMADO' : 'FIQUE ONLINE PARA ACEITAR'} <ArrowRight size={17}/></button></div>
    {onDecline && online && <button type="button" className="text-decline" onClick={() => onDecline(offer.id)}>Recusar esta oferta</button>}
  </article>;
}

function EmptyState({ icon: Icon = Radio, title, description, children }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={28}/></span><h3>{title}</h3><p>{description}</p>{children}</div>;
}

function Modal({ title, onClose, children, width = 'normal' }) {
  useEffect(() => {
    function closeOnEscape(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return <div className="modal-overlay" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
    <section className={`modal modal--${width}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}><X size={19}/></button></div>{children}</section>
  </div>;
}

function StatTile({ icon: Icon, label, value, note, variant = 'normal', onClick }) {
  return <button type="button" className={`stat-tile stat-tile--${variant}`} onClick={onClick}><span className="stat-tile-icon"><Icon size={19}/></span><div><span className="stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div><ArrowUpRight className="stat-arrow" size={17}/></button>;
}

function App() {
  const [page, setPage] = useState('inicio');
  const [online, setOnline] = useState(true);
  const [offers, setOffers] = useState(demoOffers);
  const [activeJob, setActiveJob] = useState(null);
  const [finishedJobs, setFinishedJobs] = useState([]);
  const [offerFilter, setOfferFilter] = useState('todos');
  const [modalOffer, setModalOffer] = useState(null);
  const [remaining, setRemaining] = useState(25);
  const [toast, setToast] = useState('');
  const [selectedServices, setSelectedServices] = useState(['guincho', 'eletrica', 'pneu', 'combustivel']);
  const [radius, setRadius] = useState(15);
  const [notifications, setNotifications] = useState(true);
  const [selectedChat, setSelectedChat] = useState('a');
  const [chats, setChats] = useState(demoChats);
  const [chatMessage, setChatMessage] = useState('');
  const [additionalModal, setAdditionalModal] = useState(false);
  const [extraReason, setExtraReason] = useState('');
  const [extraValue, setExtraValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!modalOffer) return;
    setRemaining(modalOffer.wait || 25);
    const id = window.setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [modalOffer]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const eligibleOffers = useMemo(() => offers.filter((o) => selectedServices.includes(o.category)), [offers, selectedServices]);
  const visibleOffers = useMemo(() => eligibleOffers.filter((o) =>
    (offerFilter === 'todos' || o.category === offerFilter) &&
    (!searchTerm || `${o.type} ${o.pickup} ${o.id}`.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [eligibleOffers, offerFilter, searchTerm]);
  const activeChat = chats.find((c) => c.id === selectedChat) || chats[0];

  function go(next) { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function switchOnline() {
    if (online && activeJob) { setToast('Finalize o atendimento antes de ficar offline.'); return; }
    setOnline((v) => !v); setToast(online ? 'Você está offline nesta demonstração.' : 'Você está online nesta demonstração.');
  }
  function accept(offer) {
    if (!online) { setToast('Fique online para aceitar ofertas.'); return; }
    if (activeJob) { setToast('Você já possui um atendimento em andamento.'); return; }
    setActiveJob({ ...offer, step: 0 });
    setOffers((v) => v.filter((o) => o.id !== offer.id));
    setModalOffer(null); setOfferFilter('todos'); go('atendimento');
    setToast('Chamado aceito na demonstração. Nenhuma API foi acionada.');
  }
  function decline(id) { setOffers((v) => v.filter((o) => o.id !== id)); setModalOffer(null); setToast('Oferta removida da lista de demonstração.'); }
  function advanceJob() {
    if (!activeJob) return;
    if (activeJob.step < 2) { setActiveJob((v) => ({ ...v, step: v.step + 1 })); setToast(['Você marcou a chegada ao local.', 'Atendimento iniciado.'][activeJob.step]); return; }
    setFinishedJobs((v) => [{ id: activeJob.id, title: `${activeJob.type} · ${activeJob.pickup.split(',')[1]?.trim() || 'Barueri'}`, date: 'Agora', amount: activeJob.price * 0.8, status: 'Concluído' }, ...v]);
    setActiveJob(null); setAdditionalModal(false); go('ganhos'); setToast('Atendimento concluído na demonstração.');
  }
  function sendChat(e) {
    e.preventDefault(); if (!chatMessage.trim()) return;
    setChats((previous) => previous.map((chat) => chat.id === selectedChat ? {
      ...chat, messages: [...chat.messages, { from: 'me', text: chatMessage.trim(), time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }], unread: 0,
    } : chat));
    setChatMessage('');
  }
  function toggleService(id) { setSelectedServices((v) => v.includes(id) ? v.filter((s) => s !== id) : [...v, id]); }

  const notificationCount = chats.reduce((sum, c) => sum + c.unread, 0);
  const transactions = [...finishedJobs, ...demoTransactions];

  return <div className="partner-shell">
    <aside className="desktop-sidebar" aria-label="Menu principal">
      <div className="side-brand"><Logo/><span className="side-brand-tag">ÁREA RESTRITA</span></div>
      <div className="sidebar-group-label">PAINEL</div>
      <nav className="sidebar-nav">{PRIMARY.map((item) => <NavButton key={item.id} item={item} active={page === item.id || (page === 'atendimento' && item.id === 'solicitacoes') || (SECONDARY.some(s => s.id === page) && item.id === 'menu')} onClick={() => go(item.id)} count={item.id === 'mensagens' && notificationCount}/>)}</nav>
      <div className="sidebar-group-label sidebar-group-label--secondary">FERRAMENTAS</div>
      <nav className="sidebar-nav sidebar-nav--small">{SECONDARY.slice(0, 4).map((item) => <NavButton key={item.id} item={item} active={page === item.id} onClick={() => go(item.id)}/>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-support"><span><Headphones size={19}/></span><div><strong>Precisa de ajuda?</strong><small>Estamos aqui por você.</small></div><button type="button" aria-label="Abrir ajuda" onClick={() => go('ajuda')}><ArrowUpRight size={19}/></button></div>
      <button type="button" className="sidebar-user" onClick={() => go('perfil')}><span className="user-avatar">PS</span><span><strong>Parceiro SOS</strong><small>Conta demonstrativa</small></span><ChevronDown size={16}/></button>
    </aside>

    <div className="workspace">
      <header className="top-header"><div className="top-header-left"><span className="mobile-logo"><Logo compact/></span><div><div className="top-breadcrumb"><span>PORTAL DO PARCEIRO</span><span className="crumb-divider">/</span><span>{PAGE_NAMES[page] || 'Painel'}</span></div><strong className="top-header-title">{page === 'inicio' ? 'Sua operação, em movimento.' : PAGE_NAMES[page]}</strong></div></div>
        <div className="header-right"><Pill tone="yellow" icon={Sparkles}>MODO DEMONSTRAÇÃO</Pill><button type="button" className="notification-btn" onClick={() => go('mensagens')} aria-label="Abrir mensagens"><Bell size={19}/>{notificationCount > 0 && <i/>}</button><button type="button" className="mini-avatar" onClick={() => go('perfil')} aria-label="Meu perfil">PS</button></div>
      </header>
      <div className="page-content">
      {page === 'inicio' && <>
        <section className="welcome-strip"><div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-line"/> A ESTRADA NÃO PARA. A GENTE TAMBÉM NÃO.</div><h1>Pronto para o<br/><span>próximo chamado?</span></h1><p>Esteja por perto quando alguém mais precisar. Controle sua disponibilidade e acompanhe suas oportunidades.</p><div className="welcome-actions"><button type="button" className={`status-cta ${online ? 'status-cta--online' : ''}`} onClick={switchOnline}><span className="status-cta-power"><Power size={20}/></span><span><strong>{online ? 'VOCÊ ESTÁ ONLINE' : 'FICAR ONLINE'}</strong><small>{online ? 'Pronto para receber solicitações' : 'Toque para começar a receber chamados'}</small></span><span className={`status-toggle ${online ? 'status-toggle--on' : ''}`}><i/></span></button></div></div>
          <div className="welcome-map"><MapCanvas compact online={online} radius={radius} onExplore={() => go('solicitacoes')}/></div>
        </section>
        <div className="stats-grid"><StatTile icon={Wallet} label="Ganhos de hoje" value={brl(248.50)} note="3 atendimentos · exemplo" variant="red" onClick={() => go('ganhos')}/><StatTile icon={Radio} label="Ofertas disponíveis" value={String(eligibleOffers.length).padStart(2,'0')} note={online ? 'Prontas para avaliar' : 'Ative seu status'} variant="yellow" onClick={() => go('solicitacoes')}/><StatTile icon={Star} label="Sua avaliação" value="4,96" note="124 avaliações · exemplo" onClick={() => go('perfil')}/></div>
        {activeJob && <div className="active-banner"><div className="active-banner-icon"><Navigation size={20}/></div><div><strong>Você tem um atendimento em andamento</strong><small>{activeJob.type} · {activeJob.person}</small></div><button type="button" className="btn btn--yellow" onClick={() => go('atendimento')}>Continuar <ArrowRight size={17}/></button></div>}
        <section className="home-lower"><div className="home-feed"><SectionHeading eyebrow="OPORTUNIDADES PERTO DE VOCÊ" title="Chamados em destaque" action="Ver todos" onAction={() => go('solicitacoes')}/>{eligibleOffers.length ? <OfferCard offer={eligibleOffers[0]} online={online && !activeJob} active onDetails={setModalOffer} onAccept={accept}/> : <EmptyState title="Nenhuma oferta no momento" description="As solicitações aparecerão aqui quando estiverem disponíveis nesta demonstração."/>}</div>
        <div className="home-aside"><div className="side-info-card"><div className="side-info-head"><span className="round-icon round-icon--yellow"><Compass size={21}/></span><Pill tone="yellow">SUA ÁREA</Pill></div><h3>Seu raio de atuação</h3><div className="big-distance">{radius}<span> km</span></div><p>Você escolhe até onde quer chegar para atender novos clientes.</p><button type="button" className="side-info-action" onClick={() => go('servicos')}>Ajustar cobertura <ArrowRight size={17}/></button></div><div className="tips-card"><div className="tips-icon"><ShieldCheck size={24}/></div><div><strong>Segurança em primeiro lugar.</strong><p>Confira os dados do veículo e do cliente antes de iniciar um atendimento.</p><button type="button" onClick={() => go('documentos')}>Ver verificações <ArrowRight size={15}/></button></div></div></div></section>
      </>}

      {page === 'solicitacoes' && <section className="content-sheet"><div className="page-intro"><div className="eyebrow">SUAS OPORTUNIDADES</div><h1>Solicitações<span className="red-dot">.</span></h1><p>Avalie a distância, o tipo de serviço e o valor estimado antes de aceitar.</p></div><div className="list-toolbar"><div className="filter-tabs" role="group" aria-label="Filtrar tipo de serviço">{[{id:'todos',label:'Todos'},...serviceTypes.map(s=>({id:s.id,label:s.label}))].map((s)=><button type="button" key={s.id} className={offerFilter===s.id?'selected':''} onClick={()=>setOfferFilter(s.id)}>{s.label}</button>)}</div><div className="search-wrap"><SlidersHorizontal size={17}/><input aria-label="Buscar solicitações" placeholder="Buscar oferta..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div></div><div className="result-bar"><span><Radio size={16}/>{visibleOffers.length} oferta(s) nesta demonstração</span><Pill tone={online?'green':'neutral'} icon={online?CheckCircle2:Power}>{online?'Online':'Offline'}</Pill></div>{!online && <div className="notice-banner"><AlertCircle size={19}/>Você está offline. Ative seu status para aceitar solicitações.<button type="button" onClick={switchOnline}>Ficar online</button></div>}{activeJob && <div className="notice-banner"><Navigation size={19}/>Você já tem um chamado aceito.<button type="button" onClick={() => go('atendimento')}>Ver atendimento</button></div>}<div className="offers-grid">{visibleOffers.map((offer)=><OfferCard key={offer.id} offer={offer} online={online && !activeJob} onDetails={setModalOffer} onAccept={accept} onDecline={decline}/>)}</div>{!visibleOffers.length && <EmptyState icon={Radio} title="Nenhum chamado encontrado" description="Tente outro filtro ou restaure os exemplos para continuar a explorar a interface."><button type="button" className="btn btn--outline" onClick={() => {setOffers(demoOffers);setOfferFilter('todos');setSearchTerm('');}}>Restaurar demonstração</button></EmptyState>}</section>}

      {page === 'atendimento' && (activeJob ? <section className="content-sheet"><div className="page-intro"><div className="eyebrow">CHAMADO {activeJob.id}</div><h1>Em atendimento<span className="red-dot">.</span></h1><p>Acompanhe a jornada de atendimento e marque cada etapa concluída.</p></div><div className="job-grid"><div className="job-main"><div className="job-status-head"><Pill tone="green" icon={CheckCircle2}>CHAMADO ACEITO</Pill><strong>{brl(activeJob.price)}</strong></div><div className="progress-steps">{['Aceito','Cheguei','Em atendimento','Concluído'].map((s,i)=><div key={s} className={`progress-step ${i<=activeJob.step?'done':''}`}><span>{i<=activeJob.step?<Check size={13}/>:i+1}</span><small>{s}</small></div>)}</div><div className="job-customer"><span className="user-avatar user-avatar--large">{activeJob.person.slice(0,1)}</span><div><small>CLIENTE</small><strong>{activeJob.person}</strong><span>{activeJob.vehicle}</span></div><Pill tone="yellow" icon={BadgeCheck}>Dados de exemplo</Pill></div><div className="job-address"><div className="route-info"><MapPin size={19}/><div><small>ORIGEM</small><strong>{activeJob.pickup}</strong></div></div>{activeJob.destination && <div className="route-info"><Navigation size={19}/><div><small>DESTINO</small><strong>{activeJob.destination}</strong></div></div>}</div><div className="job-buttons"><a className="btn btn--outline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeJob.pickup)}`}><Map size={18}/> Abrir no Google Maps</a><button type="button" className="btn btn--red" onClick={advanceJob}>{['MARCAR CHEGADA','INICIAR ATENDIMENTO','CONCLUIR ATENDIMENTO'][activeJob.step]}<ArrowRight size={18}/></button></div><button type="button" className="job-additional" onClick={() => setAdditionalModal(true)}><span>+ Solicitar serviço adicional</span><ChevronRight size={18}/></button></div><div className="job-side"><MapCanvas online={online} radius={radius} onExplore={() => setToast('Mapa ilustrativo. Rotas reais serão integradas à API de mapas.')}/><div className="tips-card"><div className="tips-icon"><Headphones size={22}/></div><div><strong>Precisa de apoio?</strong><p>A central será integrada à API e ao chat.</p><button type="button" onClick={() => go('mensagens')}>Abrir mensagens <ArrowRight size={15}/></button></div></div></div></div></section> : <EmptyState icon={CheckCircle2} title="Nenhum atendimento ativo" description="Aceite uma solicitação para iniciar o fluxo do serviço."><button type="button" className="btn btn--red" onClick={() => go('solicitacoes')}>Ver solicitações</button></EmptyState>)}

      {page === 'ganhos' && <section className="content-sheet"><div className="page-intro"><div className="eyebrow">SEU TRABALHO, SEUS RESULTADOS</div><h1>Ganhos<span className="red-dot">.</span></h1><p>Visão demonstrativa de faturamento, atendimentos e repasses.</p></div><div className="earnings-hero"><div><span>GANHOS DA SEMANA · EXEMPLO</span><strong>{brl(1248.50 + finishedJobs.reduce((a,j)=>a+j.amount,0))}</strong><p>Valores ilustrativos. A API financeira ainda não está conectada.</p><button type="button" className="btn btn--outline" onClick={() => go('carteira')}>Acessar carteira <ArrowUpRight size={17}/></button></div><div className="spark-chart" aria-hidden="true">{[26,46,34,72,59,90,80].map((n,i)=><span key={i} style={{height:`${n}%`}}/>)}</div></div><div className="stats-grid stats-grid--earn"><StatTile icon={Wallet} label="Hoje" value={brl(248.50)} note="3 serviços · exemplo" onClick={() => go('carteira')}/><StatTile icon={ListChecks} label="Atendimentos" value={String(18+finishedJobs.length).padStart(2,'0')} note="Este mês · exemplo" onClick={() => go('solicitacoes')}/><StatTile icon={Star} label="Avaliação média" value="4,96 / 5" note="124 avaliações · exemplo" onClick={() => go('perfil')}/></div><SectionHeading eyebrow="ÚLTIMAS ATIVIDADES" title="Histórico de ganhos" action="Ver carteira" onAction={()=>go('carteira')}/><TransactionList items={transactions}/></section>}

      {page === 'carteira' && <section className="content-sheet"><BackButton go={go}/><div className="page-intro"><div className="eyebrow">FINANCEIRO DO PARCEIRO</div><h1>Carteira<span className="red-dot">.</span></h1><p>Acompanhe seu saldo, pagamentos e previsão de repasses.</p></div><div className="wallet-hero"><span className="wallet-hero-label">SALDO DISPONÍVEL · DEMONSTRAÇÃO</span><strong>{brl(408.80 + finishedJobs.reduce((a,j)=>a+j.amount,0))}</strong><div className="wallet-bottom"><span><CalendarDays size={17}/> Próximo repasse: data de exemplo</span><button type="button" className="btn btn--yellow" onClick={()=>setToast('Saques e repasses ficarão disponíveis após integração financeira.')}>Solicitar saque <ArrowRight size={17}/></button></div></div><div className="payout-info"><ShieldCheck size={22}/><p><strong>Transações ilustrativas</strong><br/>Nenhum pagamento, transferência ou saque real é processado neste protótipo.</p></div><SectionHeading eyebrow="HISTÓRICO" title="Últimas movimentações"/><TransactionList items={transactions}/></section>}

      {page === 'mensagens' && <section className="content-sheet messages-page"><div className="page-intro"><div className="eyebrow">FALE COM A CENTRAL</div><h1>Mensagens<span className="red-dot">.</span></h1><p>Prévia de conversas. As mensagens ficam somente no estado local do navegador.</p></div><div className="chat-layout"><div className="chat-list">{chats.map((chat)=><button className={`chat-list-item ${chat.id===selectedChat?'selected':''}`} type="button" key={chat.id} onClick={()=>{setSelectedChat(chat.id);setChats(v=>v.map(c=>c.id===chat.id?{...c,unread:0}:c));}}><span className="chat-list-avatar"><Headphones size={21}/></span><span><strong>{chat.name}</strong><small>{chat.detail}</small></span>{chat.unread>0?<i className="unread-dot"/>:null}</button>)}</div><div className="chat-window"><div className="chat-header"><span className="chat-list-avatar"><Headphones size={21}/></span><span><strong>{activeChat.name}</strong><small>Conversa ilustrativa, sem envio real</small></span></div><div className="chat-bubbles">{activeChat.messages.map((msg,i)=><div key={`${activeChat.id}-${i}`} className={`chat-bubble chat-bubble--${msg.from}`}><p>{msg.text}</p><small>{msg.time}</small></div>)}</div><form className="chat-compose" onSubmit={sendChat}><input aria-label="Escrever mensagem" placeholder="Escreva uma mensagem de exemplo..." value={chatMessage} onChange={(e)=>setChatMessage(e.target.value)}/><button type="submit" aria-label="Adicionar mensagem local" disabled={!chatMessage.trim()}><Send size={19}/></button></form></div></div></section>}

      {page === 'menu' && <section className="content-sheet"><div className="page-intro"><div className="eyebrow">TUDO EM UM SÓ LUGAR</div><h1>Seu espaço<span className="red-dot">.</span></h1><p>Gerencie seu perfil, veículo, serviços e preferências.</p></div><div className="profile-summary"><span className="user-avatar user-avatar--xl">PS</span><div><div className="profile-name">Parceiro SOS <BadgeCheck size={19}/></div><p>Perfil demonstrativo <span>·</span> Nota 4,96 <Star size={13} fill="currentColor"/></p></div><button type="button" className="icon-btn" aria-label="Abrir perfil" onClick={()=>go('perfil')}><ChevronRight size={21}/></button></div><div className="menu-items">{SECONDARY.map((s)=><button key={s.id} type="button" className="menu-item" onClick={()=>go(s.id)}><span className="menu-item-icon"><s.icon size={21}/></span><span><strong>{s.label}</strong><small>{s.sub}</small></span><ChevronRight size={19}/></button>)}</div><div className="menu-footnote"><ShieldCheck size={17}/> Seus dados devem ser validados pela API antes da operação real.</div></section>}

      {page === 'servicos' && <section className="content-sheet"><BackButton go={go}/><div className="page-intro"><div className="eyebrow">SUA ÁREA DE ATUAÇÃO</div><h1>Meus serviços<span className="red-dot">.</span></h1><p>Configure quais categorias de chamados deseja atender. Alterações locais de demonstração.</p></div><div className="settings-panel"><div className="settings-head"><div><h2>Serviços habilitados</h2><p>Selecione as especialidades que deseja oferecer.</p></div><Pill tone="yellow">{selectedServices.length} ATIVOS</Pill></div>{serviceTypes.map((s)=>{const Icon=ICONS[s.icon];const isOn=selectedServices.includes(s.id);return <label className="service-config" key={s.id}><span className="service-emblem"><Icon size={21}/></span><span className="service-config-info"><strong>{s.label}</strong><small>{s.description}</small></span><input type="checkbox" checked={isOn} onChange={()=>toggleService(s.id)}/><span className={`simple-toggle ${isOn?'on':''}`} aria-hidden="true"/></label>;})}</div><div className="settings-panel radius-panel"><div className="settings-head"><div><h2>Raio de atendimento</h2><p>Distância máxima sugerida para receber ofertas.</p></div><strong className="radius-value">{radius} km</strong></div><input aria-label="Raio de atendimento em quilômetros" className="radius-slider" type="range" min="5" max="50" step="5" value={radius} onChange={(e)=>setRadius(Number(e.target.value))}/><div className="radius-ends"><span>5 km</span><span>50 km</span></div></div><div className="notice-banner"><AlertCircle size={18}/>Mudanças ficam neste protótipo. Persista as preferências na API quando conectar o backend.</div></section>}

      {page === 'veiculo' && <section className="content-sheet"><BackButton go={go}/><div className="page-intro"><div className="eyebrow">PERFIL OPERACIONAL</div><h1>Meu veículo<span className="red-dot">.</span></h1><p>Visualize o veículo usado para prestar seus serviços.</p></div><div className="vehicle-card"><div className="vehicle-art"><Truck size={130} strokeWidth={1.05}/><span>VEÍCULO DE EXEMPLO</span></div><div className="vehicle-info"><Pill tone="yellow" icon={ShieldCheck}>CADASTRO ILUSTRATIVO</Pill><h2>Guincho plataforma</h2><p>Veículo de atendimento · Dados de demonstração</p><div className="vehicle-details"><span><small>TIPO</small><strong>Guincho</strong></span><span><small>STATUS</small><strong>Não validado na API</strong></span></div><button type="button" className="btn btn--outline" onClick={()=>setToast('Cadastro e edição do veículo precisam de endpoints próprios na API.')}>Gerenciar veículo <ArrowRight size={18}/></button></div></div><div className="tips-card"><div className="tips-icon"><FileText size={21}/></div><div><strong>Mantenha os documentos em dia</strong><p>A plataforma precisa validar veículo e habilitação antes de liberar serviços reais.</p><button type="button" onClick={()=>go('documentos')}>Ver documentos <ChevronRight size={15}/></button></div></div></section>}

      {page === 'documentos' && <section className="content-sheet"><BackButton go={go}/><div className="page-intro"><div className="eyebrow">CONFIANÇA É O CAMINHO</div><h1>Verificações<span className="red-dot">.</span></h1><p>Conheça as verificações previstas para operar com segurança.</p></div><div className="verification-banner"><span className="verification-shield"><ShieldCheck size={33}/></span><div><Pill tone="yellow">PRÉVIA DO PROCESSO</Pill><h2>Segurança começa por você.</h2><p>Documentação e identidade só serão aprovadas de verdade por serviços integrados e pela equipe administrativa.</p></div></div><div className="checklist">{[{label:'Documento pessoal (CPF/CNPJ)',info:'Identificação do prestador',icon:UserRound},{label:'CNH e documento do veículo',info:'Validação cadastral e do veículo',icon:CarFront},{label:'Foto e prova de vida',info:'Somente com consentimento e provedor adequado',icon:ShieldCheck},{label:'Dados bancários ou chave Pix',info:'Verificação para futuros repasses',icon:CreditCard}].map((item,i)=>{const Icon=item.icon;return <div className="checklist-row" key={item.label}><span className="checklist-icon"><Icon size={22}/></span><div><strong>{item.label}</strong><small>{item.info}</small></div><span className="status-pending">A integrar</span></div>;})}</div><button className="btn btn--red" type="button" onClick={()=>setToast('Captura de documentos e biometria não estão implementadas. Use um serviço com conformidade à LGPD.')}>INICIAR VERIFICAÇÃO (PRÉVIA) <ArrowRight size={17}/></button></section>}

      {page === 'perfil' && <section className="content-sheet"><BackButton go={go}/><div className="page-intro"><div className="eyebrow">IDENTIDADE DO PARCEIRO</div><h1>Minha conta<span className="red-dot">.</span></h1><p>Informações exibidas exclusivamente para demonstrar o layout.</p></div><div className="profile-large"><span className="user-avatar user-avatar--xxl">PS</span><div><Pill tone="yellow">CONTA DEMONSTRATIVA</Pill><h2>Parceiro SOS</h2><p>Prestador de serviços automotivos</p><div className="profile-numbers"><span><Star size={17}/> <strong>4,96</strong> Avaliação</span><span><CheckCircle2 size={17}/> <strong>124</strong> Avaliações</span></div></div></div><div className="settings-panel"><div className="settings-head"><h2>Dados de cadastro</h2></div>{[['Tipo de perfil','Parceiro'],['Região','Barueri e região (exemplo)'],['Raio de atuação',`${radius} km`],['Categorias habilitadas',`${selectedServices.length} serviços`]].map(([l,v])=><div className="data-row" key={l}><span>{l}</span><strong>{v}</strong></div>)}</div></section>}

      {page === 'configuracoes' && <section className="content-sheet"><BackButton go={go}/><div className="page-intro"><div className="eyebrow">AJUSTE A SUA EXPERIÊNCIA</div><h1>Configurações<span className="red-dot">.</span></h1><p>Preferências locais para testar a experiência do parceiro.</p></div><div className="settings-panel"><div className="settings-head"><h2>Preferências</h2></div><label className="service-config"><span className="service-emblem"><Bell size={21}/></span><span className="service-config-info"><strong>Alertas de novos chamados</strong><small>Prévia de notificações na interface</small></span><input type="checkbox" checked={notifications} onChange={()=>setNotifications(v=>!v)}/><span className={`simple-toggle ${notifications?'on':''}`}/></label><button type="button" className="menu-item" onClick={()=>go('servicos')}><span className="menu-item-icon"><MapPin size={20}/></span><span><strong>Área de atuação</strong><small>Raio configurado: {radius} km</small></span><ChevronRight size={19}/></button><button type="button" className="menu-item" onClick={()=>go('documentos')}><span className="menu-item-icon"><Lock size={20}/></span><span><strong>Privacidade e documentos</strong><small>Conheça o processo de validação</small></span><ChevronRight size={19}/></button></div><button className="btn btn--outline" type="button" onClick={()=>{setOffers(demoOffers);setOnline(true);setOfferFilter('todos');setActiveJob(null);setFinishedJobs([]);setChats(demoChats);setRadius(15);setSelectedServices(['guincho','eletrica','pneu','combustivel']);setNotifications(true);setToast('Dados de demonstração restaurados.');go('inicio');}}>Restaurar demonstração</button></section>}

      {page === 'ajuda' && <section className="content-sheet"><BackButton go={go}/><div className="page-intro"><div className="eyebrow">VOCÊ NÃO ESTÁ SOZINHO</div><h1>Central de ajuda<span className="red-dot">.</span></h1><p>Orientações para operar com segurança na plataforma.</p></div><div className="help-grid">{[{icon:Radio,title:'Como chegam os chamados?',body:'No produto final, o SignalR envia ofertas aos parceiros online dentro do raio configurado.'},{icon:Navigation,title:'Como funciona o atendimento?',body:'Aceite a oferta, navegue até o cliente, marque chegada, início e conclusão do serviço.'},{icon:Wallet,title:'Quando recebo?',body:'O plano prevê extrato e repasses. Calendário e valores devem vir da API financeira.'},{icon:ShieldCheck,title:'Como validar documentos?',body:'O administrador confirma os documentos. Biometria deve ter tratamento adequado de privacidade.'}].map(h=>{const Icon=h.icon;return <div className="help-tile" key={h.title}><span className="round-icon round-icon--yellow"><Icon size={21}/></span><h3>{h.title}</h3><p>{h.body}</p></div>;})}</div><button className="btn btn--red" type="button" onClick={()=>go('mensagens')}>IR PARA MENSAGENS <ArrowRight size={18}/></button></section>}
      </div>
      <footer className="workspace-footer"><span>© 2026 SOS TRÂNSITO</span><span>PROTÓTIPO VISUAL · SEM DADOS REAIS</span></footer>
    </div>

    <nav className="bottom-navigation" aria-label="Navegação inferior">{PRIMARY.map((item)=><NavButton key={item.id} item={item} active={page===item.id || (page==='atendimento' && item.id==='solicitacoes') || (SECONDARY.some(s=>s.id===page)&&item.id==='menu')} onClick={()=>go(item.id)} count={item.id==='mensagens'&&notificationCount} mobile/>)}</nav>

    {modalOffer && <Modal title="Detalhes da solicitação" onClose={()=>setModalOffer(null)}><div className="offer-modal-intro"><Pill tone="yellow" icon={Clock3}>{remaining>0?`Tempo para decidir: ${remaining}s`:'Prazo de demonstração encerrado'}</Pill><div className="offer-modal-price">{brl(modalOffer.price)}</div><p>{modalOffer.type} · {modalOffer.id}</p></div><div className="modal-detail-grid"><div><span>CLIENTE</span><strong>{modalOffer.person}</strong></div><div><span>VEÍCULO</span><strong>{modalOffer.vehicle}</strong></div><div><span>DISTÂNCIA</span><strong>{modalOffer.distance}</strong></div><div><span>CHEGADA ESTIMADA</span><strong>{modalOffer.eta}</strong></div></div><div className="modal-address"><MapPin size={19}/><div><small>LOCAL</small><strong>{modalOffer.pickup}</strong>{modalOffer.destination && <p>Destino: {modalOffer.destination}</p>}</div></div><div className="modal-note"><strong>Observação:</strong> {modalOffer.note}</div><div className="modal-actions"><button className="btn btn--outline" type="button" onClick={()=>decline(modalOffer.id)}>Recusar</button><button className="btn btn--red" type="button" disabled={!online||!!activeJob||remaining<=0} onClick={()=>accept(modalOffer)}>ACEITAR CHAMADO <ArrowRight size={17}/></button></div><small className="modal-disclaimer">Este chamado é fictício e não gera contratação real.</small></Modal>}

    {additionalModal && <Modal title="Solicitar adicional" onClose={()=>setAdditionalModal(false)}><form className="additional-form" onSubmit={(e)=>{e.preventDefault();if(!extraReason.trim()||Number(extraValue)<=0){setToast('Informe a descrição e um valor maior que zero.');return;}setAdditionalModal(false);setToast('Proposta simulada. No produto real, o cliente precisará aprovar o adicional.');setExtraReason('');setExtraValue('');}}><label>DESCRIÇÃO DO ADICIONAL<input required placeholder="Ex.: troca de bateria" value={extraReason} onChange={e=>setExtraReason(e.target.value)}/></label><label>VALOR (R$)<input required type="number" min="0.01" step="0.01" placeholder="0,00" value={extraValue} onChange={e=>setExtraValue(e.target.value)}/></label><p>A proposta não será enviada de verdade. O cliente precisará aprovar adicionais por meio da API.</p><button className="btn btn--red" type="submit">REGISTRAR PROPOSTA DE EXEMPLO <ArrowRight size={17}/></button></form></Modal>}
    {toast && <div className="toast" role="status"><InfoIcon/><span>{toast}</span><button type="button" aria-label="Fechar mensagem" onClick={()=>setToast('')}><X size={16}/></button></div>}
  </div>;
}

function InfoIcon() { return <AlertCircle size={19}/>; }
function BackButton({ go }) { return <button type="button" className="back-button" onClick={()=>go('menu')}><ArrowLeft size={16}/> Voltar ao menu</button>; }
function TransactionList({ items }) { return <div className="transaction-list">{items.map((t)=> <div className="transaction" key={t.id}><span className="transaction-icon"><ArrowDownLeft size={20}/></span><div><strong>{t.title}</strong><small>{t.date} · {t.status}</small></div><strong className="transaction-value">+ {brl(t.amount)}</strong></div>)}</div>; }

export default App;
