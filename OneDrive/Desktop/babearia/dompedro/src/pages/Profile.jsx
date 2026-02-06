import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import { getErrorMessage, updateMe } from "../lib/api.js";

const Profile = () => {
  const { token, user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    username: "",
    email: "",
    name: "",
    telefone: ""
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=/perfil");
      return;
    }
    const load = async () => {
      const me = await refreshUser();
      if (!me) {
        navigate("/login?redirect=/perfil");
        return;
      }
      setFormState({
        username: me.username || "",
        email: me.email || "",
        name: me.name || "",
        telefone: me.telefone || ""
      });
    };
    load();
  }, [token, refreshUser, navigate]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    const nameValue = formState.name.trim();
    const telefoneValue = formState.telefone.trim().replace(/\D/g, "");
    const payload = {
      name: nameValue || null,
      telefone: telefoneValue || null
    };

    if (!payload.name && !payload.telefone) {
      toast({ variant: "warning", message: "Altere pelo menos um campo." });
      return;
    }
    if (payload.name && payload.name.length < 3) {
      toast({ variant: "warning", message: "Nome deve ter pelo menos 3 caracteres." });
      return;
    }
    if (payload.telefone && payload.telefone.length < 10) {
      toast({ variant: "warning", message: "Telefone deve ter 10 a 15 dígitos." });
      return;
    }

    try {
      setLoading(true);
      await updateMe(payload);
      toast({ variant: "success", message: "Dados atualizados." });
      await refreshUser();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const passwordValue = formData.get("password")?.toString().trim() || "";
    const confirmValue = formData.get("passwordConfirm")?.toString().trim() || "";

    if (!passwordValue || !confirmValue) {
      toast({ variant: "warning", message: "Preencha os dois campos de senha." });
      return;
    }
    if (passwordValue.length < 8) {
      toast({ variant: "warning", message: "Senha deve ter pelo menos 8 caracteres." });
      return;
    }
    if (passwordValue !== confirmValue) {
      toast({ variant: "warning", message: "As senhas não conferem." });
      return;
    }

    try {
      setPasswordLoading(true);
      await updateMe({ password: passwordValue });
      toast({ variant: "success", message: "Senha atualizada." });
      event.currentTarget.reset();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const showAdmin = user?.role === "ADMIN";
  const showBarber = user?.role === "BARBEIRO" || user?.role === "ADMIN";

  const navLinks = [
    { label: "Serviços", href: "/#services" },
    { label: "Sobre", href: "/#about" },
    { label: "Informações", href: "/#info" },
    { label: "Avaliações", href: "/#reviews" },
    { label: "Perfil", href: "/perfil" }
  ];

  return (
    <>
      <Header highlight="Perfil" links={navLinks} />
      <main className="container profile-page">
        <section className="page-header" data-reveal>
          <h2>Meu Perfil</h2>
          <p>Atualize seus dados principais e sua senha.</p>
          <div className="profile-actions" hidden={!(showAdmin || showBarber)}>
            {showAdmin ? (
              <a className="primary-action" href="/admin">
                Ir para Admin
              </a>
            ) : null}
            {showBarber ? (
              <a className="ghost-action" href="/barbeiro">
                Ir para Barbeiro
              </a>
            ) : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-1">
          <div className="panel-header">
            <h3>Dados da conta</h3>
            <p className="muted">Username e email não podem ser alterados aqui.</p>
          </div>
          <div className="panel-body">
            <form className="panel-form" onSubmit={handleProfileSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="perfil-username">Usuario</label>
                  <input id="perfil-username" type="text" readOnly value={formState.username} />
                </div>
                <div className="form-field">
                  <label htmlFor="perfil-email">Email</label>
                  <input id="perfil-email" type="email" readOnly value={formState.email} />
                </div>
                <div className="form-field">
                  <label htmlFor="perfil-name">Nome</label>
                  <input
                    id="perfil-name"
                    type="text"
                    placeholder="Seu nome"
                    value={formState.name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="perfil-telefone">Telefone</label>
                  <input
                    id="perfil-telefone"
                    type="tel"
                    placeholder="(42) 99960-1678"
                    value={formState.telefone}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, telefone: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-action" type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar alteracoes"}
                </button>
                <button className="ghost-action" type="button" onClick={handleLogout}>
                  Sair
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="panel" id="profile-password" data-reveal="delay-2">
          <div className="panel-header">
            <h3>Alterar senha</h3>
            <p className="muted">Defina uma nova senha para sua conta.</p>
          </div>
          <div className="panel-body">
            <form className="panel-form" onSubmit={handlePasswordSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="perfil-senha-nova">Nova senha</label>
                  <input
                    id="perfil-senha-nova"
                    name="password"
                    type="password"
                    placeholder="minimo 8 caracteres"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="perfil-senha-confirm">Confirmar senha</label>
                  <input
                    id="perfil-senha-confirm"
                    name="passwordConfirm"
                    type="password"
                    placeholder="repita a nova senha"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-action" type="submit" disabled={passwordLoading}>
                  {passwordLoading ? "Salvando..." : "Atualizar senha"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Profile;



