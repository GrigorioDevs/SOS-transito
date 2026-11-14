const apiBase = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
const basePath = `${apiBase}/api/auth/password-reset`;

async function postJson(action, body, signal, fallbackMessage) {
  let response;
  try {
    response = await fetch(`${basePath}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Não foi possível conectar. Tente novamente.");
  }

  if (response.status === 429) {
    throw new Error("Muitas tentativas. Aguarde um pouco e tente novamente.");
  }
  if (!response.ok || response.headers.get("content-type")?.includes("text/html")) {
    throw new Error(fallbackMessage);
  }

  return response;
}

export function requestPasswordReset(email, signal) {
  return postJson("request", { email }, signal, "Não foi possível solicitar o código. Tente novamente.");
}

export async function verifyPasswordCode(email, code, signal) {
  const response = await postJson("verify", { email, code }, signal, "Não foi possível validar o código. Confira se está correto ou solicite outro.");
  const data = await response.json().catch(() => null);

  if (typeof data?.resetToken !== "string" || !data.resetToken.trim()) {
    throw new Error("Não foi possível iniciar a redefinição. Tente validar o código novamente.");
  }
  return data.resetToken;
}

export function confirmPasswordReset({ resetToken, newPassword, confirmPassword }, signal) {
  return postJson("confirm", { resetToken, newPassword, confirmPassword }, signal,
    "Não foi possível salvar a senha. Confira os requisitos ou solicite um novo código.");
}
