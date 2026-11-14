import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { partnerApi, normalizeDemand, normalizeLatLng } from '../services/api.js';
import { darkMapStyle } from '../services/mapStyle.js';

const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
let loaderConfigured = false;

const HEAT_COLORS = [
  [78, 32, 131, 50], [111, 39, 190, 128], [166, 45, 188, 175],
  [226, 77, 159, 211], [253, 99, 93, 230], [251, 128, 49, 238], [231, 54, 64, 246],
];

function makeMapMarker(map, point, cssClass, childrenText, onClick) {
  class HtmlMarker extends google.maps.OverlayView {
    constructor() { super(); this.element = null; this.setMap(map); }
    onAdd() {
      const b = document.createElement('button');
      b.type = 'button'; b.className = cssClass; b.textContent = childrenText;
      b.title = cssClass.includes('location') ? 'Sua localização' : `${point.count} solicitações na região`;
      b.setAttribute('aria-label', b.title);
      b.addEventListener('click', (e) => { e.stopPropagation(); onClick?.(point); });
      this.getPanes()?.overlayMouseTarget.appendChild(b);
      this.element = b;
    }
    draw() {
      if (!this.element) return;
      const pixel = this.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(point.lat, point.lng));
      if (pixel) { this.element.style.left = `${pixel.x}px`; this.element.style.top = `${pixel.y}px`; }
    }
    onRemove() { this.element?.remove(); this.element = null; }
  }
  return new HtmlMarker();
}

/** Mapa real do Google Maps. Não usa imagem, screenshot ou dados de demonstração. */
export default function GoogleDemandMap({ position, recenterIndex, heatVisible, route, onHotspotClick, onDemandInfo, onMapState }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const selfMarkerRef = useRef(null);
  const hotspotsRef = useRef([]);
  const routeRef = useRef(null);
  const demandRef = useRef([]);
  const mountedRef = useRef(false);
  const centeredRef = useRef(false);
  const heatVisibleRef = useRef(heatVisible);
  const callbacksRef = useRef({ onDemandInfo, onHotspotClick, onMapState });
  const [state, setState] = useState(key ? 'loading' : 'missing-key');
  const [error, setError] = useState('');
  useEffect(() => { callbacksRef.current = { onDemandInfo, onHotspotClick, onMapState }; }, [onDemandInfo, onHotspotClick, onMapState]);
  useEffect(() => { heatVisibleRef.current = heatVisible; }, [heatVisible]);

  function renderHeat(points, enabled) {
    if (!overlayRef.current) return;
    try {
      overlayRef.current.setProps({ layers: enabled && points.length ? [new HeatmapLayer({
        id: 'sos-demand-heatmap', data: points,
        getPosition: (p) => [p.lng, p.lat], getWeight: (p) => p.count,
        radiusPixels: 75, intensity: 1.2, threshold: 0.035, opacity: 0.82,
        colorRange: HEAT_COLORS,
      })] : [] });
    } catch {
      callbacksRef.current.onMapState?.('O mapa de calor não pôde ser desenhado neste dispositivo.');
    }
  }

  function drawHotspots(map, points) {
    hotspotsRef.current.forEach((marker) => marker.setMap(null));
    hotspotsRef.current = points.slice(0, 60).map((p) => makeMapMarker(
      map, p, 'sos-hotspot-marker', `👤 ${p.count}`,
      (point) => callbacksRef.current.onHotspotClick?.(point),
    ));
  }

  // Cria Google Maps apenas uma vez por montagem; cleanup protege React StrictMode.
  useEffect(() => {
    if (!key) { setState('missing-key'); return undefined; }
    if (!loaderConfigured) {
      setOptions({ key, v: 'weekly', language: 'pt-BR', region: 'BR' });
      loaderConfigured = true;
    }
    let disposed = false;
    let idleListener;
    let timeoutId;
    let currentRequest;
    mountedRef.current = true;
    setState('loading');

    async function load() {
      try {
        const { Map } = await importLibrary('maps');
        if (disposed || !containerRef.current) return;
        const options = {
          center: { lat: -14.24, lng: -51.93 }, zoom: 4, minZoom: 3,
          mapTypeControl: false, fullscreenControl: false, streetViewControl: false,
          zoomControl: false, clickableIcons: false, gestureHandling: 'greedy',
          backgroundColor: '#20232b', disableDefaultUI: true,
          ...(mapId ? { mapId } : { styles: darkMapStyle }),
        };
        const map = new Map(containerRef.current, options);
        mapRef.current = map;
        overlayRef.current = new GoogleMapsOverlay({ interleaved: false, layers: [] });
        overlayRef.current.setMap(map);
        setState('ready');

        const update = async () => {
          const bounds = map.getBounds();
          if (!bounds || disposed) return;
          const sw = bounds.getSouthWest(); const ne = bounds.getNorthEast();
          currentRequest?.abort(); currentRequest = new AbortController();
          try {
            const response = await partnerApi.getDemand({
              south: sw.lat().toFixed(6), west: sw.lng().toFixed(6),
              north: ne.lat().toFixed(6), east: ne.lng().toFixed(6),
            }, currentRequest.signal);
            if (disposed) return;
            const points = normalizeDemand(response);
            demandRef.current = points;
            renderHeat(points, heatVisibleRef.current);
            drawHotspots(map, points);
            callbacksRef.current.onDemandInfo?.({ count: points.reduce((s, p) => s + p.count, 0), error: '' });
          } catch (e) {
            if (disposed || e.name === 'AbortError') return;
            demandRef.current = []; renderHeat([], false); drawHotspots(map, []);
            callbacksRef.current.onDemandInfo?.({ count: null, error: e.message });
          }
        };
        idleListener = map.addListener('idle', () => {
          clearTimeout(timeoutId); timeoutId = setTimeout(update, 550);
        });
      } catch (e) {
        if (disposed) return;
        setError(e?.message || 'Não foi possível carregar o Google Maps.');
        setState('error');
      }
    }
    load();
    return () => {
      disposed = true; mountedRef.current = false;
      clearTimeout(timeoutId); currentRequest?.abort();
      if (idleListener) google.maps.event.removeListener(idleListener);
      hotspotsRef.current.forEach((marker) => marker.setMap(null)); hotspotsRef.current = [];
      selfMarkerRef.current?.setMap(null); selfMarkerRef.current = null;
      routeRef.current?.setMap(null); routeRef.current = null;
      overlayRef.current?.finalize(); overlayRef.current = null;
      mapRef.current = null; centeredRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || state !== 'ready') return;
    renderHeat(demandRef.current, heatVisible);
  }, [heatVisible, state]);

  useEffect(() => {
    const map = mapRef.current;
    const valid = normalizeLatLng(position);
    if (!map || state !== 'ready' || !valid) return;
    selfMarkerRef.current?.setMap(null);
    selfMarkerRef.current = makeMapMarker(map, valid, 'sos-location-marker', '➤');
    if (!centeredRef.current) { map.setZoom(13); map.panTo(valid); centeredRef.current = true; }
  }, [position?.lat, position?.lng, state]);

  useEffect(() => {
    const valid = normalizeLatLng(position);
    if (recenterIndex > 0 && mapRef.current && valid) {
      mapRef.current.panTo(valid); mapRef.current.setZoom(Math.max(mapRef.current.getZoom() || 0, 13));
    }
  }, [recenterIndex, position?.lat, position?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== 'ready') return;
    routeRef.current?.setMap(null); routeRef.current = null;
    const path = route?.coordinates?.map(normalizeLatLng).filter(Boolean);
    if (path?.length > 1) {
      routeRef.current = new google.maps.Polyline({ map, path, strokeColor: '#f2c739', strokeWeight: 5, strokeOpacity: 0.95 });
      const bounds = new google.maps.LatLngBounds(); path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 74);
    }
  }, [route, state]);

  return <div className="sos-map-container" role="region" aria-label="Mapa de localização e demanda">
    <div className="sos-map-google" ref={containerRef} />
    {state !== 'ready' && <div className="sos-map-empty" role="status">
      <div className="sos-map-empty-bg" aria-hidden="true" />
      <div className="sos-map-empty-content">
        <span className="sos-map-empty-symbol">✦</span>
        <strong>{state === 'loading' ? 'Carregando Google Maps' : 'Mapa indisponível'}</strong>
        <p>{state === 'missing-key' ? 'Configure VITE_GOOGLE_MAPS_API_KEY no .env para exibir o mapa real.'
          : state === 'error' ? error : 'Buscando ruas, cidades e rodovias...'}</p>
      </div>
    </div>}
  </div>;
}
