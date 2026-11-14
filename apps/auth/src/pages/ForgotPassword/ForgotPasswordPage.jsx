import { useEffect, useState } from "react";
import { Link } from "react-router";
import AuthField from "../../components/AuthField.jsx";
import AuthIcon from "../../components/AuthIcon.jsx";
import AuthLayout from "../../components/AuthLayout.jsx";
import RecoverySteps from "../../components/RecoverySteps.jsx";
import useRecoveryRequest from "../../hooks/useRecoveryRequest.js";
import { requestPasswordReset, verifyPasswordCode } from "../../services/passwordRecoveryApi.js";
import "../../styles/PasswordRecovery.css";

const INTERVALO_REENVIO = 30;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage({ onVerified }) {
  const [etapa, setEtapa] = useState("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [reenvioEm, setReenvioEm] = useState(0);
  const { acaoPendente, executar } = useRecoveryRequest();
  const esperandoCodigo = etapa === "codigo";
  const ocupado = Boolean(acaoPendente);

  // O efeito inicia um novo tick quando o contador muda e cancela o anterior ao sair.
  useEffect(() => {
    if (reenvioEm === 0) return;
    const timer = window.setTimeout(() => setReenvioEm((atual) => Math.max(0, atual - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [reenvioEm]);

  function solicitarCodigo(event) {
    event.preventDefault();
    setErro("");

    const emailInformado = email.trim();
    if (!FORMATO_EMAIL.test(emailInformado)) {
      setErro(emailInformado ? "Informe um e-mail válido." : "Informe seu e-mail.");
      return;
    }

    return executar("solicitar", async (signal) => {
      await requestPasswordReset(emailInformado, signal);
      if (signal.aborted) return;
      setEmail(emailInformado);
      setCodigo("");
      setReenvioEm(INTERVALO_REENVIO);
      setEtapa("codigo");
    }, setErro);
  }

  function validarCodigo(event) {
    event.preventDefault();
    setErro("");
    setAviso("");

    if (!/^\d{6}$/.test(codigo)) {
      setErro("Informe os seis dígitos do código.");
      return;
    }

    return executar("validar", async (signal) => {
      const token = await verifyPasswordCode(email, codigo, signal);
      if (!signal.aborted) onVerified(token);
    }, setErro);
  }

  function reenviarCodigo() {
    if (reenvioEm > 0 || ocupado) return;
    setErro("");
    setAviso("");

    return executar("reenviar", async (signal) => {
      await requestPasswordReset(email, signal);
      if (signal.aborted) return;
      setCodigo("");
      setReenvioEm(INTERVALO_REENVIO);
      setAviso("Se o e-mail estiver cadastrado, você receberá um novo código.");
    }, setErro);
  }

  function alterarEmail() {
    setEtapa("email");
    setCodigo("");
    setReenvioEm(0);
    setErro("");
    setAviso("");
  }

  return (
    <AuthLayout
      recovery
      eyebrow="RECUPERAÇÃO DE CONTA"
      title={esperandoCodigo ? "Confirme o código." : "Esqueceu sua senha?"}
      description={esperandoCodigo
        ? "Se o e-mail estiver cadastrado, você receberá um código de seis dígitos."
        : "Informe o e-mail da sua conta para solicitar um código de recuperação."}
    >
      <RecoverySteps current={esperandoCodigo ? 2 : 1} />

      <form className="ignicao-form" onSubmit={esperandoCodigo ? validarCodigo : solicitarCodigo} noValidate>
        {esperandoCodigo ? (
          <>
            <AuthField
              key="codigo"
              id="recovery-code"
              name="code"
              label="CÓDIGO DE VERIFICAÇÃO"
              icon="lock"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codigo}
              onChange={(event) => { setCodigo(event.target.value.replace(/\D/g, "").slice(0, 6)); setErro(""); }}
              placeholder="000000"
              disabled={ocupado}
              aria-describedby="recovery-email-hint"
              required
            />
            <p className="ignicao-recovery-hint" id="recovery-email-hint">E-mail informado: {email}</p>
          </>
        ) : (
          <AuthField
            key="email"
            id="recovery-email"
            name="email"
            label="E-MAIL CADASTRADO"
            icon="mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setErro(""); }}
            placeholder="seuemail@exemplo.com.br"
            disabled={ocupado}
            required
          />
        )}

        {erro && <p className="ignicao-notice" role="alert">{erro}</p>}
        {aviso && <p className="ignicao-recovery-success" role="status">{aviso}</p>}

        <button className="ignicao-login-btn" type="submit" disabled={ocupado}>
          <span>{acaoPendente === "validar" ? "VALIDANDO..." : acaoPendente === "solicitar" ? "ENVIANDO..." : esperandoCodigo ? "VALIDAR CÓDIGO" : "ENVIAR CÓDIGO"}</span>
          <AuthIcon name="arrow" size={19} />
        </button>

        {esperandoCodigo && (
          <div className="ignicao-recovery-actions">
            <button type="button" className="ignicao-recovery-link" onClick={reenviarCodigo} disabled={ocupado || reenvioEm > 0}>
              {acaoPendente === "reenviar" ? "Reenviando..." : reenvioEm > 0 ? `Reenviar em ${reenvioEm}s` : "Reenviar código"}
            </button>
            <button type="button" className="ignicao-recovery-link" onClick={alterarEmail} disabled={ocupado}>Alterar e-mail</button>
          </div>
        )}
      </form>

      <Link className="ignicao-recovery-link ignicao-recovery-back" to="/">
        <AuthIcon name="arrowLeft" size={15} /> Voltar ao login
      </Link>
    </AuthLayout>
  );
}
