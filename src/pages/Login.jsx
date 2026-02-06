import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import { getErrorMessage, requestPasswordReset, resetPassword } from "../lib/api.js";
import "../styles/login.css";

const Login = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [formError, setFormError] = useState("");
  const [resetError, setResetError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setFormError("");
    const formData = new FormData(event.currentTarget);
    const loginValue = formData.get("login")?.toString().trim();
    const password = formData.get("password")?.toString();
    if (!loginValue || !password) {
      setFormError("Informe usuario/email e senha.");
      return;
    }
    try {
      setLoading(true);
      await login({ login: loginValue, password });
      toast({ variant: "success", message: "Login realizado com sucesso." });
      navigate(redirect || "/");
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSend = async (event) => {
    event.preventDefault();
    setResetError("");
    const form = event.currentTarget.closest("form");
    const email = form?.querySelector("[name='reset-email']")?.value?.trim();
    if (!email) {
      setResetError("Informe o email para enviar o codigo.");
      return;
    }
    try {
      setResetLoading(true);
      await requestPasswordReset({ email });
      toast({ variant: "success", message: "Codigo enviado para o email informado." });
    } catch (error) {
      setResetError(getErrorMessage(error));
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setResetError("");
    const formData = new FormData(event.currentTarget);
    const email = formData.get("reset-email")?.toString().trim();
    const code = formData.get("reset-code")?.toString().trim();
    const newPassword = formData.get("reset-password")?.toString().trim();
    if (!email || !code || !newPassword) {
      setResetError("Preencha email, codigo e nova senha.");
      return;
    }
    try {
      setResetLoading(true);
      await resetPassword({ email, code, newPassword });
      toast({ variant: "success", message: "Senha atualizada. Faça login." });
      event.currentTarget.reset();
    } catch (error) {
      setResetError(getErrorMessage(error));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-card">
        <div className="brand">
          <h1>Dom Pedro</h1>
          <span>Barber Shop</span>
        </div>

        <div>
          <h2>Bem-vindo</h2>
          <p>Acesse sua conta para agendar.</p>
        </div>

        <div className={`form-error ${formError ? "visible" : ""}`} role="alert">
          {formError}
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="login">Usuário ou email</label>
            <input
              type="text"
              id="login"
              name="login"
              placeholder="seu.usuario ou seu@email.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input type="password" id="password" name="password" placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processando..." : "Entrar"}
          </button>
        </form>

        <div className="reset-card">
          <h3>Esqueceu a senha?</h3>
          <p>Receba um codigo por email e redefina sua senha.</p>
          <div className={`form-error ${resetError ? "visible" : ""}`} role="alert">
            {resetError}
          </div>
          <form className="login-form" onSubmit={handleResetSubmit}>
            <div className="input-group">
              <label htmlFor="reset-email">Email</label>
              <input
                type="email"
                id="reset-email"
                name="reset-email"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="reset-code">Codigo</label>
              <input type="text" id="reset-code" name="reset-code" placeholder="000000" />
            </div>

            <div className="input-group">
              <label htmlFor="reset-password">Nova senha</label>
              <input type="password" id="reset-password" name="reset-password" placeholder="••••••••" />
            </div>

            <div className="reset-actions">
              <button type="button" className="ghost-action" onClick={handleResetSend} disabled={resetLoading}>
                {resetLoading ? "Enviando..." : "Enviar codigo"}
              </button>
              <button type="submit" disabled={resetLoading}>
                {resetLoading ? "Atualizando..." : "Atualizar senha"}
              </button>
            </div>
          </form>
        </div>

        <div className="auth-link">
          Não tem conta? <Link to="/cadastro">Criar agora</Link>
        </div>
        <div className="back-home">
          <Link to="/">Voltar para o início</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;



