export async function listarServicos({ signal } = {}) {
  const response = await fetch('/api/servicos', { signal });
  if (!response.ok) {
    throw new Error(`Não foi possível consultar os serviços (HTTP ${response.status}).`);
  }
  return response.json();
}
