import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router";
import AuthLayout from "./components/AuthLayout.jsx";
import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPasswordPage.jsx";
import LoginPage from "./pages/Login/LoginPage.jsx";
import ResetPasswordPage from "./pages/ResetPassword/ResetPasswordPage.jsx";

function AuthRoutes({ onLogin }) {
  const [resetToken, setResetToken] = useState("");
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // O token vive apenas na memória enquanto a redefinição está em andamento.
  useEffect(() => {
    if (pathname !== "/reset-password") setResetToken("");
  }, [pathname]);

  function abrirRedefinicao(token) {
    setResetToken(token);
    navigate("/reset-password", { replace: true });
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLogin={onLogin} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage onVerified={abrirRedefinicao} />} />
      <Route path="/reset-password" element={<ResetPasswordPage resetToken={resetToken} onComplete={() => setResetToken("")} />} />

      {/* Se o cadastro já existir no seu projeto, mantenha a rota /register aqui. */}
      <Route path="*" element={(
        <AuthLayout eyebrow="SOS TRÂNSITO" title="Página não disponível.">
          <div className="ignicao-form-options"><Link to="/">Voltar ao login</Link></div>
        </AuthLayout>
      )} />
    </Routes>
  );
}

export default function App({ onLogin }) {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthRoutes onLogin={onLogin} />
    </BrowserRouter>
  );
}
