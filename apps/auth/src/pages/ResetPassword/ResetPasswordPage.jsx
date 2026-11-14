import { useState } from "react";
import { Link } from "react-router";
import AuthField from "../../components/AuthField.jsx";
import AuthIcon from "../../components/AuthIcon.jsx";
import AuthLayout from "../../components/AuthLayout.jsx";
import RecoverySteps from "../../components/RecoverySteps.jsx";
import useRecoveryRequest from "../../hooks/useRecoveryRequest.js";
import { confirmPasswordReset } from "../../services/passwordRecoveryApi.js";
import "../../styles/PasswordRecovery.css";

export default function ResetPasswordPage({ resetToken, onComplete }) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);
  const { acaoPendente, executar } = useRecoveryRequest();
  const ocupado = Boolean(acaoPendente);

  function salvarSenha(event) {
    event.preventDefault();
    setErro("");

    if (novaSenha.length < 8) {
      setErro("Use pelo menos oito caracteres na nova senha.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }

    return executar("salvar", async (signal) => {
      await confirmPasswordReset({ resetToken, newPassword: novaSenha, confirmPassword: confirmacao }, signal);
      if (signal.aborted) return;
      setNovaSenha("");
      setConfirmacao("");
      setConcluido(true);
      onComplete();
    }, setErro);
  }

  if (concluido) {
    return (
      <AuthLayout recovery eyebrow="RECUPERAÇÃO DE CONTA" title="Senha redefinida.">
        <p className="ignicao-recovery-success" role="status">Você já pode entrar com a nova senha.</p>
        <Link className="ignicao-login-btn ignicao-recovery-complete" to="/" replace>
          <span>IR PARA O LOGIN</span><AuthIcon name="check" size={19} />
        </Link>
      </AuthLayout>
    );
  }

  if (!resetToken) {
    return (
      <AuthLayout recovery eyebrow="RECUPERAÇÃO DE CONTA" title="Valide seu código primeiro." description="Informe seu e-mail e valide o código para criar uma nova senha.">
        <Link className="ignicao-login-btn ignicao-recovery-complete" to="/forgot-password" replace>
          <span>SOLICITAR CÓDIGO</span><AuthIcon name="arrow" size={19} />
        </Link>
        <Link className="ignicao-recovery-link ignicao-recovery-back" to="/">Voltar ao login</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout recovery eyebrow="RECUPERAÇÃO DE CONTA" title="Crie uma nova senha." description="Use pelo menos oito caracteres e confirme a senha antes de salvar.">
      <RecoverySteps current={3} />

      <form className="ignicao-form" onSubmit={salvarSenha} noValidate>
        <AuthField
          id="recovery-new-password"
          name="newPassword"
          label="NOVA SENHA"
          icon="lock"
          type="password"
          autoComplete="new-password"
          value={novaSenha}
          onChange={(event) => { setNovaSenha(event.target.value); setErro(""); }}
          placeholder="Crie uma senha"
          disabled={ocupado}
          required
        />
        <AuthField
          id="recovery-confirm-password"
          name="confirmPassword"
          label="CONFIRMAR NOVA SENHA"
          icon="lock"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(event) => { setConfirmacao(event.target.value); setErro(""); }}
          placeholder="Repita a senha"
          disabled={ocupado}
          required
        />

        {erro && <p className="ignicao-notice" role="alert">{erro}</p>}

        <button className="ignicao-login-btn" type="submit" disabled={ocupado}>
          <span>{ocupado ? "SALVANDO..." : "SALVAR NOVA SENHA"}</span>
          <AuthIcon name="arrow" size={19} />
        </button>
      </form>

      <Link className="ignicao-recovery-link ignicao-recovery-back" to="/forgot-password" replace>
        <AuthIcon name="arrowLeft" size={15} /> Solicitar outro código
      </Link>
    </AuthLayout>
  );
}
