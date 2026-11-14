import { useState } from "react";
import { Link } from "react-router";
import AuthField from "../../components/AuthField.jsx";
import AuthIcon from "../../components/AuthIcon.jsx";
import AuthLayout from "../../components/AuthLayout.jsx";
import "./LoginPage.css";

// onLogin continua sendo a função que integra o formulário com a API do login.
export default function LoginPage({ onLogin }) {
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(event) {
    event.preventDefault();
    setMensagem("");
    if (!identificador.trim() || !senha) {
      setMensagem("Informe seu e-mail ou CPF e sua senha para continuar.");
      return;
    }
    if (typeof onLogin !== "function") {
      setMensagem("Interface pronta. Conecte a função onLogin à API para autenticar.");
      return;
    }
    try {
      setEnviando(true);
      await onLogin({ identificador: identificador.trim(), senha, lembrar });
    } catch (erro) {
      setMensagem(erro?.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout eyebrow="CONECTE-SE AO SEU CAMINHO" title={<>Bom ter você<br />de volta.</>}>
      <form className="ignicao-form" onSubmit={enviar} noValidate>
        <AuthField
          id="ignicao-user"
          label="USUÁRIO"
          icon="user"
          type="text"
          value={identificador}
          onChange={(event) => { setIdentificador(event.target.value); setMensagem(""); }}
          placeholder="Seu e-mail ou CPF"
          autoComplete="username"
          required
        />

        <AuthField
          id="ignicao-password"
          label="SENHA"
          icon="lock"
          type={mostrarSenha ? "text" : "password"}
          value={senha}
          onChange={(event) => { setSenha(event.target.value); setMensagem(""); }}
          placeholder="Sua senha"
          autoComplete="current-password"
          required
        >
          <button className="ignicao-eye-button" type="button" onClick={() => setMostrarSenha((valor) => !valor)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}>
            <AuthIcon name={mostrarSenha ? "eye" : "eyeOff"} size={17} />
          </button>
        </AuthField>

        <div className="ignicao-form-options">
          <label className="ignicao-remember" htmlFor="ignicao-remember">
            <input id="ignicao-remember" type="checkbox" checked={lembrar} onChange={(event) => setLembrar(event.target.checked)} />
            <span>Lembrar de mim</span>
          </label>
          <Link to="/forgot-password">Esqueci minha senha</Link>
        </div>

        {mensagem && <p className="ignicao-notice" role="alert">{mensagem}</p>}

        <button className="ignicao-login-btn" type="submit" disabled={enviando}>
          <span>{enviando ? "ENTRANDO..." : "ENTRAR NA MINHA CONTA"}</span>
          <AuthIcon name="arrow" size={19} />
        </button>
      </form>

      <div className="ignicao-signup">Ainda não faz parte? <Link to="/register">Crie sua conta <span aria-hidden="true">↗</span></Link></div>
    </AuthLayout>
  );
}
