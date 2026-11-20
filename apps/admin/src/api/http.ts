// Cliente HTTP do painel admin. Fala com a API .NET pelo proxy do Vite (/api → http://127.0.0.1:5080).
// Converte respostas de erro (ProblemDetails do ASP.NET) em mensagens legíveis para as telas.

export class ErroHttp extends Error {
  constructor(mensagem: string, readonly status: number) {
    super(mensagem);
  }
}

interface ProblemDetails { title?: string; detail?: string; errors?: Record<string, string[]> }

async function mensagemDeErro(r: Response): Promise<string> {
  try {
    const p = (await r.json()) as ProblemDetails;
    if (p.detail) return p.detail;
    const erros = p.errors ? Object.values(p.errors).flat() : [];
    if (erros.length) return erros.join(' ');
    if (p.title) return p.title;
  } catch { /* corpo vazio ou não-JSON */ }
  return `O servidor respondeu com erro (HTTP ${r.status}).`;
}

// 204 (sem conteúdo) → null.
export async function pedir<T>(metodo: 'GET' | 'POST' | 'PUT', rota: string, corpo?: unknown): Promise<T | null> {
  let r: Response;
  try {
    r = await fetch(rota, {
      method: metodo,
      headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroHttp('Não foi possível falar com o servidor. Verifique se a API está rodando.', 0);
  }
  if (!r.ok) throw new ErroHttp(await mensagemDeErro(r), r.status);
  if (r.status === 204) return null;
  return (await r.json()) as T;
}

export function consulta(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
}
