import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider.jsx";
import { getErrorMessage, register } from "../lib/api.js";
import "../styles/login.css";

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username")?.toString().trim();
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const telefoneRaw = formData.get("telefone")?.toString().trim();
    const telefone = telefoneRaw ? telefoneRaw.replace(/\D/g, "") : "";
    const password = formData.get("password")?.toString();

    if (!username || !name || !email || !password) {
      setFormError("Preencha todos os campos obrigatorios.");
      return;
    }

    try {
      setLoading(true);
      await register({
        username,
        name,
        email,
        telefone: telefone || null,
        password,
        role: "USER"
      });
      toast({ variant: "success", message: "Conta criada! FaÃ§a login para agendar." });
      navigate("/login");
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
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
          <p>Crie sua conta para agendar.</p>
        </div>

        <div className={`form-error ${formError ? "visible" : ""}`} role="alert">
          {formError}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">UsuÃ¡rio</label>
            <input type="text" id="username" name="username" placeholder="seu.usuario" required />
          </div>

          <div className="input-group">
            <label htmlFor="name">Nome</label>
            <input type="text" id="name" name="name" placeholder="Fulano Abreu" required />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="seu@email.com" required />
          </div>

          <div className="input-group">
            <label htmlFor="telefone">Telefone</label>
            <input type="tel" id="telefone" name="telefone" placeholder="(42) 99960-1678" />
          </div>

          <div className="input-group">
            <label htmlFor="password">Crie uma senha</label>
            <input type="password" id="password" name="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processando..." : "Cadastrar"}
          </button>
        </form>

        <div className="auth-link">
          JÃ¡ tem conta? <Link to="/login">Entre agora</Link>
        </div>
        <div className="back-home">
          <Link to="/">Voltar para o inÃ­cio</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

