import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import {
  createCashEntry,
  createService,
  createServiceWithImage,
  createIndisponibilidade,
  deleteIndisponibilidade,
  deleteService,
  formatCurrency,
  getCash,
  getBarbers,
  getCommissionRate,
  getCommissions,
  getErrorMessage,
  getIndisponibilidades,
  getServices,
  getUsersAdmin,
  normalizeBarber,
  normalizeService,
  updateCommission,
  updateCommissionRate,
  updateService,
  updateServiceImage,
  updateUserRole,
  updateUserStatus
} from "../lib/api.js";

const Admin = () => {
  const { token, user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [usersEmpty, setUsersEmpty] = useState(false);
  const [userFilters, setUserFilters] = useState({
    name: "",
    role: "",
    status: ""
  });

  const [services, setServices] = useState([]);
  const [servicesEmpty, setServicesEmpty] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    id: "",
    name: "",
    price: "",
    duration: "",
    status: "true",
    file: null
  });
  const serviceImageRef = useRef(null);

  const [commissions, setCommissions] = useState([]);
  const [commissionsEmpty, setCommissionsEmpty] = useState(false);
  const [commissionFilters, setCommissionFilters] = useState({ inicio: "", fim: "" });
  const [commissionRate, setCommissionRate] = useState("");
  const [commissionApplyAll, setCommissionApplyAll] = useState(false);

  const [barbers, setBarbers] = useState([]);
  const [indisponibilidades, setIndisponibilidades] = useState([]);
  const [indisponibilidadesEmpty, setIndisponibilidadesEmpty] = useState(false);
  const [indForm, setIndForm] = useState({
    barbeiroUsername: "",
    tipo: "FERIAS",
    inicio: "",
    fim: ""
  });

  const [cashEntries, setCashEntries] = useState([]);
  const [cashEmpty, setCashEmpty] = useState(false);
  const [cashFilters, setCashFilters] = useState({ inicio: "", fim: "", tipo: "" });
  const [cashForm, setCashForm] = useState({
    tipo: "ENTRADA",
    descricao: "",
    valor: "",
    barbeiroUsername: ""
  });

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=/admin");
      return;
    }
    const checkRole = async () => {
      const me = user || (await refreshUser());
      if (!me || me.role !== "ADMIN") {
        navigate("/");
        return;
      }
      loadUsers();
      loadServices();
      loadCommissions();
      loadCommissionRate();
      loadCash();
      const selected = await loadBarbers();
      loadIndisponibilidades(selected);
    };
    checkRole();
  }, [token]);

  const loadUsers = async () => {
    try {
      const filters = {};
      if (userFilters.name) filters.name = userFilters.name;
      if (userFilters.role) filters.userRole = userFilters.role;
      if (userFilters.status) filters.status = userFilters.status;
      const list = await getUsersAdmin(filters);
      setUsers(list || []);
      setUsersEmpty(!(list && list.length));
    } catch (error) {
      setUsersEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const loadServices = async () => {
    try {
      const data = await getServices();
      const list = Array.isArray(data) ? data : data?.content || data?.servicos || [];
      const normalized = list
        .map(normalizeService)
        .filter((service) => service.status !== false)
        .map((service) => ({ ...service, duration: service.duracaoEmMinutos || 0 }));
      setServices(normalized);
      setServicesEmpty(!normalized.length);
    } catch (error) {
      setServicesEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const resetServiceForm = () => {
    setServiceForm({
      id: "",
      name: "",
      price: "",
      duration: "",
      status: "true",
      file: null
    });
    if (serviceImageRef.current) serviceImageRef.current.value = "";
  };

  const fillServiceForm = (service) => {
    setServiceForm({
      id: service.id,
      name: service.name || "",
      price: service.price ?? "",
      duration: service.duration ?? "",
      status: service.status === false ? "false" : "true",
      file: null
    });
    if (serviceImageRef.current) serviceImageRef.current.value = "";
  };

  const handleServiceSubmit = async (event) => {
    event.preventDefault();
    const name = serviceForm.name.trim();
    const price = Number(String(serviceForm.price).replace(",", "."));
    const duration = Number(serviceForm.duration);
    const status = serviceForm.status === "true";
    if (!name || !price || !duration) {
      toast({ variant: "warning", message: "Preencha nome, preço e duração." });
      return;
    }

    try {
      if (serviceForm.id) {
        await updateService(serviceForm.id, { name, price, duracaoEmMinutos: duration, status });
        if (serviceForm.file) await updateServiceImage(serviceForm.id, serviceForm.file);
        toast({ variant: "success", message: "Serviço atualizado." });
      } else {
        if (serviceForm.file) {
          await createServiceWithImage({ name, price, duracaoEmMinutos: duration }, serviceForm.file);
        } else {
          await createService({ name, price, duracaoEmMinutos: duration });
        }
        toast({ variant: "success", message: "Serviço criado." });
      }
      resetServiceForm();
      loadServices();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const handleDeleteService = async (service) => {
    if (!confirm(`Excluir serviço "${service.name}"?`)) return;
    try {
      await deleteService(service.id);
      toast({
        variant: "success",
        message: "Serviço removido. Se havia agendamentos, ele foi desativado."
      });
      loadServices();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const loadCommissions = async () => {
    try {
      const filters = {};
      if (commissionFilters.inicio) filters.inicio = commissionFilters.inicio;
      if (commissionFilters.fim) filters.fim = commissionFilters.fim;
      const items = await getCommissions(filters);
      setCommissions(items || []);
      setCommissionsEmpty(!(items && items.length));
    } catch (error) {
      setCommissionsEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const loadBarbers = async () => {
    try {
      const data = await getBarbers();
      const list = Array.isArray(data) ? data : data?.content || data?.usuarios || [];
      const normalized = list
        .map(normalizeBarber)
        .filter((barber) => barber.username);
      setBarbers(normalized);
      if (!indForm.barbeiroUsername && normalized.length) {
        const selected = normalized[0].username;
        setIndForm((prev) => ({ ...prev, barbeiroUsername: selected }));
        return selected;
      }
      return indForm.barbeiroUsername;
    } catch (error) {
      setBarbers([]);
      return indForm.barbeiroUsername;
    }
  };

  const loadIndisponibilidades = async (barbeiroUsername) => {
    try {
      const filters = {};
      if (barbeiroUsername) filters.barbeiroUsername = barbeiroUsername;
      const data = await getIndisponibilidades(filters);
      const list = Array.isArray(data) ? data : data?.content || data?.indisponibilidades || [];
      setIndisponibilidades(list);
      setIndisponibilidadesEmpty(!list.length);
    } catch (error) {
      setIndisponibilidades([]);
      setIndisponibilidadesEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const loadCommissionRate = async () => {
    try {
      const data = await getCommissionRate();
      if (data?.percentual != null) setCommissionRate(String(data.percentual));
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const handleIndisponibilidadeSubmit = async (event) => {
    event.preventDefault();
    if (!indForm.barbeiroUsername || !indForm.tipo || !indForm.inicio || !indForm.fim) {
      toast({ variant: "warning", message: "Preencha todos os campos." });
      return;
    }
    try {
      await createIndisponibilidade({
        barbeiroUsername: indForm.barbeiroUsername,
        tipo: indForm.tipo,
        inicio: indForm.inicio,
        fim: indForm.fim
      });
      setIndForm((prev) => ({ ...prev, inicio: "", fim: "" }));
      loadIndisponibilidades(indForm.barbeiroUsername);
      toast({ variant: "success", message: "Indisponibilidade registrada." });
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const handleCommissionRateSave = async () => {
    const percentual = Number(String(commissionRate || "").replace(",", "."));
    if (!Number.isFinite(percentual)) {
      toast({ variant: "warning", message: "Informe um percentual válido." });
      return;
    }
    try {
      await updateCommissionRate({ percentual, aplicarEmTodas: Boolean(commissionApplyAll) });
      toast({ variant: "success", message: "Taxa global atualizada." });
      loadCommissions();
      loadCash();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const loadCash = async () => {
    try {
      const filters = {};
      if (cashFilters.tipo) filters.tipo = cashFilters.tipo;
      if (cashFilters.inicio) filters.inicio = cashFilters.inicio;
      if (cashFilters.fim) filters.fim = cashFilters.fim;
      const items = await getCash(filters);
      setCashEntries(items || []);
      setCashEmpty(!(items && items.length));
    } catch (error) {
      setCashEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const handleCashSubmit = async (event) => {
    event.preventDefault();
    const valor = Number(String(cashForm.valor).replace(",", "."));
    if (!cashForm.tipo || !cashForm.descricao.trim() || !valor) {
      toast({ variant: "warning", message: "Preencha tipo, descricao e valor." });
      return;
    }
    try {
      await createCashEntry({
        tipo: cashForm.tipo,
        descricao: cashForm.descricao,
        valor,
        barbeiroUsername: cashForm.barbeiroUsername || null
      });
      setCashForm({ tipo: "ENTRADA", descricao: "", valor: "", barbeiroUsername: "" });
      loadCash();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const cashSummary = cashEntries.reduce(
    (acc, item) => {
      const valor = Number(item.valor || 0);
      if (item.tipo === "ENTRADA") acc.entrada += valor;
      if (item.tipo === "SAIDA") acc.saida += valor;
      return acc;
    },
    { entrada: 0, saida: 0 }
  );
  const saldo = cashSummary.entrada - cashSummary.saida;

  const navLinks = [
    { label: "Serviços", href: "/#services" },
    { label: "Sobre", href: "/#about" },
    { label: "Informações", href: "/#info" },
    { label: "Avaliações", href: "/#reviews" },
    { label: "Admin", href: "/admin" }
  ];

  return (
    <>
      <Header highlight="Admin" links={navLinks} />
      <main className="container admin-page">
        <section className="page-header" data-reveal>
          <h2>Painel Administrativo</h2>
          <p>Gerencie usuários e serviços da barbearia.</p>
        </section>

        <section className="panel" data-reveal="delay-1">
          <div className="panel-header">
            <h3>Usuários</h3>
            <div className="panel-actions">
              <input
                type="text"
                placeholder="Buscar por nome"
                value={userFilters.name}
                onChange={(event) => setUserFilters((prev) => ({ ...prev, name: event.target.value }))}
              />
              <select
                value={userFilters.role}
                onChange={(event) => setUserFilters((prev) => ({ ...prev, role: event.target.value }))}
              >
                <option value="">Todos os papéis</option>
                <option value="ADMIN">Admin</option>
                <option value="BARBEIRO">Barbeiro</option>
                <option value="USER">Cliente</option>
              </select>
              <select
                value={userFilters.status}
                onChange={(event) =>
                  setUserFilters((prev) => ({ ...prev, status: event.target.value }))
                }
              >
                <option value="">Todos os status</option>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
              <button className="ghost-action" type="button" onClick={loadUsers}>
                Filtrar
              </button>
            </div>
          </div>
          <div className="panel-body">
            <div className="panel-list">
              {users.map((userItem) => (
                <article key={userItem.username} className="row-card">
                  <div className="row-main">
                    <strong>{userItem.name}</strong>
                    <span>@{userItem.username}</span>
                    <span>{userItem.email}</span>
                  </div>
                  <div className="row-meta">
                    <span className="tag">{userItem.role}</span>
                    <span className={`tag ${userItem.status ? "tag--success" : "tag--danger"}`}>
                      {userItem.status ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="row-actions">
                    <select
                      value={userItem.role}
                      onChange={async (event) => {
                        try {
                          await updateUserRole(userItem.username, event.target.value);
                          toast({ variant: "success", message: "Role atualizada." });
                          loadUsers();
                        } catch (error) {
                          toast({ variant: "error", message: getErrorMessage(error) });
                        }
                      }}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="BARBEIRO">BARBEIRO</option>
                      <option value="USER">USER</option>
                    </select>
                    <button
                      type="button"
                      className="ghost-action"
                      onClick={async () => {
                        try {
                          await updateUserStatus(userItem.username, !userItem.status);
                          loadUsers();
                        } catch (error) {
                          toast({ variant: "error", message: getErrorMessage(error) });
                        }
                      }}
                    >
                      {userItem.status ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {usersEmpty ? <p className="muted">Nenhum usuário encontrado.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-2">
          <div className="panel-header">
            <h3>Serviços</h3>
            <p className="muted">Crie, edite e ative/desative serviços.</p>
          </div>
          <div className="panel-body">
            <form className="panel-form" onSubmit={handleServiceSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="service-name">Nome</label>
                  <input
                    id="service-name"
                    type="text"
                    placeholder="Corte Masculino"
                    required
                    value={serviceForm.name}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="service-price">Preço</label>
                  <input
                    id="service-price"
                    type="text"
                    placeholder="45.00"
                    required
                    value={serviceForm.price}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, price: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="service-duration">Duração (min)</label>
                  <input
                    id="service-duration"
                    type="number"
                    min="5"
                    step="5"
                    placeholder="40"
                    required
                    value={serviceForm.duration}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, duration: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="service-status">Ativo</label>
                  <select
                    id="service-status"
                    value={serviceForm.status}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, status: event.target.value }))
                    }
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="service-image">Imagem</label>
                  <input
                    ref={serviceImageRef}
                    id="service-image"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))
                    }
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-action" type="submit">
                  {serviceForm.id ? "Salvar alterações" : "Salvar serviço"}
                </button>
                {serviceForm.id ? (
                  <button className="ghost-action" type="button" onClick={resetServiceForm}>
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </form>

            <div className="panel-list">
              {services.map((service) => (
                <article key={service.id} className="row-card">
                  <div className="row-main">
                    <strong>{service.name}</strong>
                    <span>{formatCurrency(service.price)}</span>
                    <span>Duração: {service.duration} min</span>
                  </div>
                  <div className="row-meta">
                    <span className={`tag ${service.status === false ? "tag--danger" : "tag--success"}`}>
                      {service.status === false ? "Inativo" : "Ativo"}
                    </span>
                  </div>
                  <div className="row-actions">
                    <button className="ghost-action" type="button" onClick={() => fillServiceForm(service)}>
                      Editar
                    </button>
                    <button className="danger-action" type="button" onClick={() => handleDeleteService(service)}>
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {servicesEmpty ? <p className="muted">Nenhum serviço cadastrado.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-3">
          <div className="panel-header">
            <h3>Indisponibilidades</h3>
            <p className="muted">Registre períodos em que barbeiros não atendem.</p>
          </div>
          <div className="panel-body">
            <form className="panel-form" onSubmit={handleIndisponibilidadeSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="ind-barbeiro">Barbeiro</label>
                  <select
                    id="ind-barbeiro"
                    value={indForm.barbeiroUsername}
                    onChange={(event) => {
                      const value = event.target.value;
                      setIndForm((prev) => ({ ...prev, barbeiroUsername: value }));
                      loadIndisponibilidades(value);
                    }}
                    required
                  >
                    <option value="">Selecione um barbeiro</option>
                    {barbers.map((barber) => (
                      <option key={barber.username} value={barber.username}>
                        {barber.name ? `${barber.name} (${barber.username})` : barber.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="ind-tipo">Tipo</label>
                  <select
                    id="ind-tipo"
                    value={indForm.tipo}
                    onChange={(event) => setIndForm((prev) => ({ ...prev, tipo: event.target.value }))}
                    required
                  >
                    <option value="FERIAS">Férias</option>
                    <option value="PAUSA">Pausa</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="ind-inicio">Início</label>
                  <input
                    id="ind-inicio"
                    type="datetime-local"
                    value={indForm.inicio}
                    onChange={(event) => setIndForm((prev) => ({ ...prev, inicio: event.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="ind-fim">Fim</label>
                  <input
                    id="ind-fim"
                    type="datetime-local"
                    value={indForm.fim}
                    onChange={(event) => setIndForm((prev) => ({ ...prev, fim: event.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-action" type="submit">
                  Adicionar indisponibilidade
                </button>
              </div>
            </form>

            <div className="panel-list">
              {indisponibilidades.map((item) => (
                <article key={item.id} className="row-card">
                  <div className="row-main">
                    <strong>{item.tipo}</strong>
                    <span>@{item.barbeiroUsername}</span>
                    <span>{new Date(item.inicio).toLocaleString("pt-BR")}</span>
                    <span>{new Date(item.fim).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="row-actions">
                    <button
                      className="danger-action"
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteIndisponibilidade(item.id);
                          loadIndisponibilidades(indForm.barbeiroUsername);
                        } catch (error) {
                          toast({ variant: "error", message: getErrorMessage(error) });
                        }
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {indisponibilidadesEmpty ? <p className="muted">Nenhuma indisponibilidade cadastrada.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-4">
          <div className="panel-header">
            <h3>Comissões</h3>
            <div className="panel-actions">
              <input
                type="date"
                value={commissionFilters.inicio}
                onChange={(event) =>
                  setCommissionFilters((prev) => ({ ...prev, inicio: event.target.value }))
                }
              />
              <input
                type="date"
                value={commissionFilters.fim}
                onChange={(event) =>
                  setCommissionFilters((prev) => ({ ...prev, fim: event.target.value }))
                }
              />
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Taxa global (%)"
                value={commissionRate}
                onChange={(event) => setCommissionRate(event.target.value)}
              />
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={commissionApplyAll}
                  onChange={(event) => setCommissionApplyAll(event.target.checked)}
                />
                Aplicar em todas
              </label>
              <button className="ghost-action" type="button" onClick={handleCommissionRateSave}>
                Atualizar taxa
              </button>
              <button className="ghost-action" type="button" onClick={loadCommissions}>
                Filtrar
              </button>
            </div>
          </div>
          <div className="panel-body">
            <div className="panel-list">
              {commissions.map((item) => (
                <article key={item.id} className="row-card">
                  <div className="row-main">
                    <strong>{item.barbeiroNome || item.barbeiroUsername}</strong>
                    <span>@{item.barbeiroUsername || "-"}</span>
                    <span>{item.servicoNome || "-"}</span>
                  </div>
                  <div className="row-meta">
                    <span className="tag">{formatCurrency(item.valor)}</span>
                    <span className="tag">{item.percentual}%</span>
                    <span className="tag">
                      {item.dataDeCriacao
                        ? new Date(item.dataDeCriacao).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short"
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="row-actions">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      defaultValue={item.percentual ?? ""}
                      title="Percentual da comissão"
                    />
                    <button
                      className="ghost-action"
                      type="button"
                      onClick={async (event) => {
                        const input = event.currentTarget.parentElement?.querySelector("input");
                        const percentual = Number(String(input?.value || "").replace(",", "."));
                        if (!Number.isFinite(percentual)) {
                          toast({ variant: "warning", message: "Informe um percentual válido." });
                          return;
                        }
                        try {
                          await updateCommission(item.id, { percentual });
                          toast({ variant: "success", message: "Taxa atualizada." });
                          loadCommissions();
                          loadCash();
                        } catch (error) {
                          toast({ variant: "error", message: getErrorMessage(error) });
                        }
                      }}
                    >
                      Atualizar taxa
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {commissionsEmpty ? <p className="muted">Nenhuma comissão encontrada.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-5">
          <div className="panel-header">
            <h3>Caixa</h3>
            <div className="panel-actions">
              <input
                type="date"
                value={cashFilters.inicio}
                onChange={(event) =>
                  setCashFilters((prev) => ({ ...prev, inicio: event.target.value }))
                }
              />
              <input
                type="date"
                value={cashFilters.fim}
                onChange={(event) =>
                  setCashFilters((prev) => ({ ...prev, fim: event.target.value }))
                }
              />
              <select
                value={cashFilters.tipo}
                onChange={(event) =>
                  setCashFilters((prev) => ({ ...prev, tipo: event.target.value }))
                }
              >
                <option value="">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saida</option>
              </select>
              <button className="ghost-action" type="button" onClick={loadCash}>
                Filtrar
              </button>
            </div>
          </div>
          <div className="panel-body">
            <form className="panel-form" onSubmit={handleCashSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="cash-tipo">Tipo</label>
                  <select
                    id="cash-tipo"
                    value={cashForm.tipo}
                    onChange={(event) => setCashForm((prev) => ({ ...prev, tipo: event.target.value }))}
                    required
                  >
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA">Saida</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="cash-descricao">Descricao</label>
                  <input
                    id="cash-descricao"
                    type="text"
                    placeholder="Produto, aluguel..."
                    required
                    value={cashForm.descricao}
                    onChange={(event) =>
                      setCashForm((prev) => ({ ...prev, descricao: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="cash-valor">Valor</label>
                  <input
                    id="cash-valor"
                    type="text"
                    placeholder="80.00"
                    required
                    value={cashForm.valor}
                    onChange={(event) => setCashForm((prev) => ({ ...prev, valor: event.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="cash-barbeiro">Barbeiro</label>
                  <input
                    id="cash-barbeiro"
                    type="text"
                    placeholder="username (opcional)"
                    value={cashForm.barbeiroUsername}
                    onChange={(event) =>
                      setCashForm((prev) => ({ ...prev, barbeiroUsername: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-action" type="submit">
                  Adicionar lançamento
                </button>
              </div>
            </form>

            <div className="panel-summary">
              <div className="summary-card">
                <span>Entradas</span>
                <strong>{formatCurrency(cashSummary.entrada)}</strong>
              </div>
              <div className="summary-card">
                <span>Saidas</span>
                <strong>{formatCurrency(cashSummary.saida)}</strong>
              </div>
              <div className="summary-card">
                <span>Saldo</span>
                <strong>{formatCurrency(saldo)}</strong>
              </div>
            </div>

            <div className="panel-list">
              {cashEntries.map((item) => (
                <article key={item.id} className="row-card">
                  <div className="row-main">
                    <strong>{item.descricao}</strong>
                    <span>{item.barbeiroUsername ? `@${item.barbeiroUsername}` : "Sem barbeiro"}</span>
                    <span>{item.agendamentoId ? `Agendamento ${item.agendamentoId}` : "Lançamento manual"}</span>
                  </div>
                  <div className="row-meta">
                    <span className={`tag ${item.tipo === "ENTRADA" ? "tag--success" : "tag--danger"}`}>
                      {item.tipo}
                    </span>
                    <span className="tag">{formatCurrency(item.valor)}</span>
                    {item.valorBarbeiro != null || item.valorBarbearia != null ? (
                      <span className="tag">
                        {[item.valorBarbeiro != null ? `Barbeiro: ${formatCurrency(item.valorBarbeiro)}` : null,
                        item.valorBarbearia != null ? `Barbearia: ${formatCurrency(item.valorBarbearia)}` : null,
                        item.percentualComissao != null ? `Taxa: ${item.percentualComissao}%` : null]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                    ) : null}
                    <span className="tag">
                      {item.dataDeCriacao
                        ? new Date(item.dataDeCriacao).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short"
                          })
                        : "-"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            {cashEmpty ? <p className="muted">Nenhum lançamento encontrado.</p> : null}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Admin;



