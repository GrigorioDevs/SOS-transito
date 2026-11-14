/**
 * Adaptador HTTP do FRONT-END. O servidor ASP.NET Core é a única fonte de verdade.
 * Os nomes de rotas abaixo são um CONTRATO PROPOSTO, documentado em docs/CONTRATO_API.md.
 * Não há fixtures, modo demo, valores ou coordenadas inventadas nesta tela.
 */
const ROOT = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'ApiError'; this.status = status; }
}

async function getAuthHeaders() {
  // Integração opcional com o mecanismo de JWT já existente no seu projeto.
  // NÃO salvar token em localStorage neste módulo.
  const accessToken = await window.__SOS_AUTH__?.getAccessToken?.();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const authHeaders = await getAuthHeaders();
  let response;
  try {
    response = await fetch(`${ROOT}${path}`, {
      method, credentials: 'include', signal,
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...authHeaders },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('Sem conexão com o servidor. Verifique sua internet ou a API.');
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    if (response.status === 401) throw new ApiError('Sua sessão expirou. Entre novamente na sua conta.', 401);
    if (response.status === 403) throw new ApiError('Seu perfil não está autorizado a executar esta operação.', 403);
    throw new ApiError(typeof detail?.message === 'string' ? detail.message : `Não foi possível concluir a operação (HTTP ${response.status}).`, response.status);
  }
  if (response.status === 204) return {};
  return response.json().catch(() => { throw new ApiError('A API retornou um JSON inválido.', response.status); });
}

function items(result) {
  if (!Array.isArray(result?.items)) throw new ApiError('Resposta inesperada da API: lista de itens ausente.');
  return result.items;
}

export const partnerApi = {
  getAvailability: (signal) => request('/parceiro/disponibilidade', { signal }),
  setAvailability: (online) => request('/parceiro/disponibilidade', { method: 'POST', body: { online } }),
  getActiveJob: () => request('/parceiro/chamados/ativo'),
  getEarnings: (signal) => request('/parceiro/ganhos/resumo', { signal }),
  getEarningsHistory: async (signal) => items(await request('/parceiro/ganhos/historico', { signal })),
  getAvailableJobs: async (signal) => items(await request('/parceiro/chamados/disponiveis', { signal })),
  getJob: (id, signal) => request(`/parceiro/chamados/${encodeURIComponent(id)}`, { signal }),
  acceptJob: (id) => request(`/parceiro/chamados/${encodeURIComponent(id)}/aceitar`, { method: 'POST' }),
  getDemand: (bounds, signal) => request(`/parceiro/mapa/demanda?${new URLSearchParams(bounds)}`, { signal }),
  // O segredo da Google Routes API não deve estar no front: a API .NET faz o proxy.
  getRoute: (origin, destination, signal) => request(`/parceiro/rotas?${new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`, destination: `${destination.lat},${destination.lng}`,
  })}`, { signal }),
};

export function normalizeLatLng(point) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function normalizeDemand(data) {
  if (!Array.isArray(data?.points)) throw new ApiError('Resposta de demanda inválida: esperado {points:[...]}.');
  return data.points.map((item) => {
    const position = normalizeLatLng(item);
    const count = Number(item?.count);
    return position && Number.isInteger(count) && count > 0 ? { ...position, count: Math.min(count, 100000) } : null;
  }).filter(Boolean);
}

export function formatMoneyFromCents(value) {
  if (!Number.isSafeInteger(value) || value < 0) return 'R$ —';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
}

export function formatDistanceKm(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)} km` : 'A calcular';
}
