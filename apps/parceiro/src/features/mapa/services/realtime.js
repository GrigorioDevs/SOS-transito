import * as signalR from '@microsoft/signalr';

const hubPath = import.meta.env.VITE_SIGNALR_HUB_URL || '/hubs/socorro';

/** Cada conexão pertence à sessão autenticada; o servidor deve validar o usuário. */
export async function connectPartnerHub({ onOffer, onStatusUpdate, onStateChange, onReconnected }) {
  const getAccessToken = window.__SOS_AUTH__?.getAccessToken;
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubPath, {
      withCredentials: true,
      ...(typeof getAccessToken === 'function' ? { accessTokenFactory: async () => (await getAccessToken()) || '' } : {}),
    })
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.on('OfertaRecebida', () => onOffer?.());
  connection.on('ChamadoCancelado', () => onOffer?.());
  connection.on('ChamadoExpirado', () => onOffer?.());
  connection.on('StatusAtualizado', (event) => onStatusUpdate?.(event));
  connection.onreconnecting(() => onStateChange?.('reconnecting'));
  connection.onreconnected(async () => {
    onStateChange?.('connected');
    await onReconnected?.();
  });
  connection.onclose(() => onStateChange?.('disconnected'));
  await connection.start();
  onStateChange?.('connected');
  return connection;
}

export async function publishPosition(connection, point) {
  if (connection?.state !== signalR.HubConnectionState.Connected) return false;
  await connection.invoke('AtualizarPosicao', point.lat, point.lng);
  return true;
}

export async function disconnectPartnerHub(connection) {
  if (connection) await connection.stop();
}
