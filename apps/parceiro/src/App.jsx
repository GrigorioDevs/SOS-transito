import { useEffect, useState } from 'react';
import LegacyPartnerApp from './LegacyPartnerApp.jsx';
import PartnerMapPage from './features/mapa/PartnerMapPage.jsx';

/**
 * Nova tela como entrada do app. O dashboard entregue anteriormente está preservado
 * em LegacyPartnerApp.jsx, sem remover páginas, handlers ou estados existentes.
 * Navegação pelo hash evita interferir nas rotas já registradas no servidor.
 */
function viewFromHash() {
  return window.location.hash === '#/painel' ? 'painel' : 'mapa';
}

export default function App() {
  const [view, setView] = useState(viewFromHash);
  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return <>
    {/* Mantido montado enquanto navega ao painel: o GPS/SignalR não se interrompem. */}
    <PartnerMapPage hidden={view === 'painel'} onHome={() => { window.location.hash = '#/painel'; }}/>
    {view === 'painel' && <>
      <div className="sos-legacy-mode-label">PAINEL ANTERIOR · DADOS DE DEMONSTRAÇÃO</div>
      <button className="sos-return-map" onClick={() => { window.location.hash = '#/mapa'; }}>
        ◀ VOLTAR AO MAPA
      </button>
      <LegacyPartnerApp />
    </>}
  </>;
}
