import { useCallback, useEffect, useRef, useState } from 'react';

const GEO_OPTIONS = { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 };

function geolocationMessage(error) {
  if (!error) return 'Não foi possível acessar a localização.';
  if (error.code === 1) return 'Localização negada. Autorize o GPS nas permissões do navegador.';
  if (error.code === 2) return 'GPS indisponível neste dispositivo.';
  if (error.code === 3) return 'O GPS demorou para responder. Tente novamente.';
  return error.message || 'Não foi possível obter sua posição.';
}

export function usePartnerPosition({ online, onLivePosition }) {
  const [position, setPosition] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('loading');
  const [gpsError, setGpsError] = useState('');
  const onLiveRef = useRef(onLivePosition);
  useEffect(() => { onLiveRef.current = onLivePosition; }, [onLivePosition]);

  const receive = useCallback((result, live = false) => {
    const coords = { lat: result.coords.latitude, lng: result.coords.longitude, accuracy: result.coords.accuracy };
    setPosition(coords);
    setGpsStatus('ready');
    setGpsError('');
    if (live) onLiveRef.current?.(coords);
    return coords;
  }, []);

  const getPosition = useCallback(() => new Promise((resolve, reject) => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      const message = 'O GPS exige HTTPS ou localhost.';
      setGpsStatus('error'); setGpsError(message); reject(new Error(message)); return;
    }
    if (!navigator.geolocation) {
      const message = 'Este navegador não oferece a API de geolocalização.';
      setGpsStatus('error'); setGpsError(message); reject(new Error(message)); return;
    }
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (result) => resolve(receive(result)),
      (error) => { const message = geolocationMessage(error); setGpsStatus('error'); setGpsError(message); reject(new Error(message)); },
      GEO_OPTIONS,
    );
  }), [receive]);

  useEffect(() => { getPosition().catch(() => {}); }, [getPosition]);
  useEffect(() => {
    if (!online || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (result) => receive(result, true),
      (error) => { setGpsStatus('error'); setGpsError(geolocationMessage(error)); },
      GEO_OPTIONS,
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [online, receive]);

  return { position, gpsStatus, gpsError, getPosition };
}
