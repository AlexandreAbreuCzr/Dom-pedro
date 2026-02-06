import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import {
  acceptAppointment,
  cancelAppointment,
  concludeAppointment,
  formatCurrency,
  formatDateBr,
  getAppointments,
  getBarbers,
  getCommissions,
  getErrorMessage,
  getIndisponibilidades,
  getMyAppointments,
  getServices,
  normalizeAppointment,
  normalizeBarber,
  normalizeService,
  createIndisponibilidade,
  deleteIndisponibilidade
} from "../lib/api.js";

const canConclude = (appointment) => {
  if (!appointment?.date || !appointment?.time) return false;
  const time = appointment.time?.slice(0, 5);
  if (!time) return false;
  const target = new Date(`${appointment.date}T${time}`);
  if (Number.isNaN(target.getTime())) return false;
  const minAllowed = new Date(target.getTime() + 10 * 60 * 1000);
  return new Date() >= minAllowed;
};

const canCancel = (appointment, user) => {
  if (!appointment) return false;
  if (user?.role === "ADMIN") return true;
  if (!appointment.barbeiroUsername || !user?.username) return false;
  return appointment.barbeiroUsername === user.username;
};

const Barber = () => {
  const { token, user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsEmpty, setAppointmentsEmpty] = useState(false);
  const [appointmentFilters, setAppointmentFilters] = useState({
    status: "",
    date: "",
    barber: ""
  });

  const [commissions, setCommissions] = useState([]);
  const [commissionsEmpty, setCommissionsEmpty] = useState(false);
  const [commissionFilters, setCommissionFilters] = useState({ inicio: "", fim: "" });

  const [indisponibilidades, setIndisponibilidades] = useState([]);
  const [indisponibilidadesEmpty, setIndisponibilidadesEmpty] = useState(false);
  const [indForm, setIndForm] = useState({ tipo: "FERIAS", inicio: "", fim: "" });

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=/barbeiro");
      return;
    }
    const checkRole = async () => {
      const me = user || (await refreshUser());
      if (!me || (me.role !== "BARBEIRO" && me.role !== "ADMIN")) {
        navigate("/");
        return;
      }
      await loadServices();
      if (me.role === "ADMIN") {
        await loadBarbers();
      }
      loadAppointments(me);
      loadCommissions();
      loadIndisponibilidades(me.username);
    };
    checkRole();
  }, [token]);

  const loadServices = async () => {
    try {
      const data = await getServices();
      const list = Array.isArray(data) ? data : data?.content || data?.servicos || [];
      setServices(list.map(normalizeService));
    } catch (error) {
      setServices([]);
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
    } catch (error) {
      setBarbers([]);
    }
  };

  const getServiceName = (serviceId) => {
    const service = services.find((item) => String(item.id) === String(serviceId));
    return service?.name || (serviceId ? `Servi�o #${serviceId}` : "Servi�o");
  };

  const loadAppointments = async (currentUser) => {
    try {
      const activeUser = currentUser || user;
      const baseFilters = {};
      if (appointmentFilters.status) baseFilters.status = appointmentFilters.status;
      if (appointmentFilters.date) baseFilters.data = appointmentFilters.date;

      if (!getAppointments) {
        const data = await getMyAppointments();
        const list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
        const normalized = list.map(normalizeAppointment);
        setAppointments(normalized);
        setAppointmentsEmpty(!normalized.length);
        return;
      }

      let list = [];
      if (activeUser?.role === "ADMIN") {
        const filters = { ...baseFilters };
        if (appointmentFilters.barber) filters.barbeiroUserName = appointmentFilters.barber;
        const data = await getAppointments(filters);
        list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
      } else {
        const mineFilters = { ...baseFilters, barbeiroUserName: activeUser?.username };
        const requests = [getAppointments(mineFilters)];
        if (!appointmentFilters.status || appointmentFilters.status === "REQUISITADO") {
          const openFilters = { ...baseFilters, semBarbeiro: true };
          requests.push(getAppointments(openFilters));
        }
        const results = await Promise.all(requests);
        const merged = [];
        const seen = new Set();
        results.forEach((data) => {
          const items = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
          items.forEach((item) => {
            const key = item?.id ?? JSON.stringify(item);
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(item);
          });
        });
        list = merged;
      }
      const normalized = list.map(normalizeAppointment);
      setAppointments(normalized);
      setAppointmentsEmpty(!normalized.length);
    } catch (error) {
      setAppointmentsEmpty(true);
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

  const loadIndisponibilidades = async (username) => {
    try {
      const data = await getIndisponibilidades({ barbeiroUsername: username });
      const list = Array.isArray(data) ? data : data?.content || data?.indisponibilidades || [];
      setIndisponibilidades(list);
      setIndisponibilidadesEmpty(!list.length);
    } catch (error) {
      setIndisponibilidadesEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const handleIndisponibilidadeSubmit = async (event) => {
    event.preventDefault();
    if (!indForm.tipo || !indForm.inicio || !indForm.fim) {
      toast({ variant: "warning", message: "Preencha todos os campos." });
      return;
    }
    try {
      await createIndisponibilidade({
        barbeiroUsername: user?.username,
        tipo: indForm.tipo,
        inicio: indForm.inicio,
        fim: indForm.fim
      });
      setIndForm({ tipo: "FERIAS", inicio: "", fim: "" });
      loadIndisponibilidades(user?.username);
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const commissionTotal = commissions.reduce((sum, item) => sum + Number(item.valor || 0), 0);

  const navLinks = [
    { label: "Serviços", href: "/#services" },
    { label: "Sobre", href: "/#about" },
    { label: "Informações", href: "/#info" },
    { label: "Avaliações", href: "/#reviews" },
    { label: "Barbeiro", href: "/barbeiro" }
  ];

  return (
    <>
      <Header highlight="Barbeiro" links={navLinks} />
      <main className="container barber-page">
        <section className="page-header" data-reveal>
          <h2>Painel do Barbeiro</h2>
          <p>Gerencie seus agendamentos e indisponibilidades.</p>
        </section>

        <section className="panel" data-reveal="delay-1">
          <div className="panel-header">
            <h3>Agendamentos</h3>
            <div className="panel-actions">
              <select
                value={appointmentFilters.status}
                onChange={(event) =>
                  setAppointmentFilters((prev) => ({ ...prev, status: event.target.value }))
                }
              >
                <option value="">Status</option>
                <option value="REQUISITADO">Requisitado</option>
                <option value="AGENDADO">Agendado</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="CONCLUIDO">Concluido</option>
              </select>
              <input
                type="date"
                value={appointmentFilters.date}
                onChange={(event) =>
                  setAppointmentFilters((prev) => ({ ...prev, date: event.target.value }))
                }
              />
              <select
                value={appointmentFilters.barber}
                onChange={(event) =>
                  setAppointmentFilters((prev) => ({ ...prev, barber: event.target.value }))
                }
                disabled={user?.role !== "ADMIN"}
              >
                <option value="">Profissional</option>
                {barbers.map((barber) => (
                  <option key={barber.username} value={barber.username}>
                    {barber.name ? `${barber.name} (${barber.username})` : barber.username}
                  </option>
                ))}
              </select>
              <button className="ghost-action" type="button" onClick={loadAppointments}>
                Filtrar
              </button>
              <button
                className="ghost-action"
                type="button"
                onClick={() =>
                  setAppointmentFilters({ status: "", date: "", barber: "" })
                }
              >
                Limpar
              </button>
            </div>
          </div>
          <div className="panel-body">
            <div className="panel-list">
              {appointments.map((appointment) => (
                <article key={appointment.id} className="row-card">
                  <div className="row-main">
                    <strong>{getServiceName(appointment.serviceId)}</strong>
                    <span>{formatDateBr(appointment.date)} às {appointment.time}</span>
                    <span>Barbeiro: {appointment.barbeiroUsername || "-"}</span>
                    <span>Cliente: {appointment.clienteUsername || "-"}</span>
                  </div>
                  <div className="row-meta">
                    <span className="tag">{appointment.status}</span>
                  </div>
                  <div className="row-actions">
                    {appointment.status === "REQUISITADO" ? (
                      <button
                        className="primary-action"
                        type="button"
                        onClick={async () => {
                          try {
                            await acceptAppointment(appointment.id);
                            loadAppointments();
                          } catch (error) {
                            toast({ variant: "error", message: getErrorMessage(error) });
                          }
                        }}
                      >
                        Aceitar
                      </button>
                    ) : null}
                    {appointment.status === "AGENDADO" && canConclude(appointment) ? (
                      <button
                        className="primary-action"
                        type="button"
                        onClick={async () => {
                          try {
                            await concludeAppointment(appointment.id);
                            loadAppointments();
                          } catch (error) {
                            toast({ variant: "error", message: getErrorMessage(error) });
                          }
                        }}
                      >
                        Concluir
                      </button>
                    ) : null}
                    {["AGENDADO", "REQUISITADO"].includes(appointment.status) &&
                    canCancel(appointment, user) ? (
                      <button
                        className="danger-action"
                        type="button"
                        onClick={async () => {
                          try {
                            await cancelAppointment(appointment.id);
                            loadAppointments();
                          } catch (error) {
                            toast({ variant: "error", message: getErrorMessage(error) });
                          }
                        }}
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
            {appointmentsEmpty ? <p className="muted">Nenhum agendamento encontrado.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-2">
          <div className="panel-header">
            <h3>Comissoes</h3>
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
              <button className="ghost-action" type="button" onClick={loadCommissions}>
                Filtrar
              </button>
            </div>
          </div>
          <div className="panel-body">
            <div className="panel-summary">
              <div className="summary-card">
                <span>Total</span>
                <strong>{formatCurrency(commissionTotal)}</strong>
              </div>
            </div>
            <div className="panel-list">
              {commissions.map((item) => (
                <article key={item.id} className="row-card">
                  <div className="row-main">
                    <strong>{item.servicoNome || "-"}</strong>
                    <span>{item.percentual}%</span>
                    <span>
                      {item.dataDeCriacao
                        ? new Date(item.dataDeCriacao).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short"
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="row-meta">
                    <span className="tag">{formatCurrency(item.valor)}</span>
                  </div>
                </article>
              ))}
            </div>
            {commissionsEmpty ? <p className="muted">Nenhuma comissão encontrada.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-3">
          <div className="panel-header">
            <h3>Indisponibilidades</h3>
            <p className="muted">Informe períodos em que você não atende.</p>
          </div>
          <div className="panel-body">
            <form className="panel-form" onSubmit={handleIndisponibilidadeSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="indisponibilidade-tipo">Tipo</label>
                  <select
                    id="indisponibilidade-tipo"
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
                  <label htmlFor="indisponibilidade-inicio">Início</label>
                  <input
                    id="indisponibilidade-inicio"
                    type="datetime-local"
                    value={indForm.inicio}
                    onChange={(event) => setIndForm((prev) => ({ ...prev, inicio: event.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="indisponibilidade-fim">Fim</label>
                  <input
                    id="indisponibilidade-fim"
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
                          loadIndisponibilidades(user?.username);
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
            {indisponibilidadesEmpty ? (
              <p className="muted">Nenhuma indisponibilidade cadastrada.</p>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Barber;



