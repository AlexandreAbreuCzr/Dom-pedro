import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { MonthCalendar, calendarUtils } from "../components/MonthCalendar.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import {
  acceptAppointment,
  cancelAppointment,
  concludeAppointment,
  formatCurrency,
  formatDateBr,
  formatTime,
  getAppointments,
  getBarbers,
  getCommissions,
  getErrorMessage,
  getIndisponibilidades,
  getServices,
  normalizeAppointment,
  normalizeBarber,
  normalizeService,
  createIndisponibilidade,
  deleteIndisponibilidade
} from "../lib/api.js";

const canConclude = (appointment) => {
  if (!appointment?.date || !appointment?.time) return false;
  const time = formatTime(appointment.time);
  if (!time) return false;
  const target = new Date(`${appointment.date}T${time}`);
  if (Number.isNaN(target.getTime())) return false;
  const minAllowed = new Date(target.getTime() + 10 * 60 * 1000);
  return new Date() >= minAllowed;
};

const canCancel = (appointment, user) => {
  if (!appointment || !user) return false;
  if (user.role === "ADMIN") return true;
  return appointment.barbeiroUsername && appointment.barbeiroUsername === user.username;
};

const toMonthRange = (monthDate) => ({
  startDate: calendarUtils.toIso(calendarUtils.startOfMonth(monthDate)),
  endDate: calendarUtils.toIso(calendarUtils.endOfMonth(monthDate))
});

const statusClass = (status) => {
  if (status === "AGENDADO") return "tag--success";
  if (status === "CONCLUIDO") return "tag--info";
  if (status === "CANCELADO") return "tag--danger";
  return "";
};

const Barber = () => {
  const { token, user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeUser, setActiveUser] = useState(null);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentFilters, setAppointmentFilters] = useState({ status: "", barber: "" });

  const [calendarMonth, setCalendarMonth] = useState(calendarUtils.startOfMonth(new Date()));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("");

  const [commissions, setCommissions] = useState([]);
  const [commissionFilters, setCommissionFilters] = useState({ inicio: "", fim: "" });

  const [indisponibilidades, setIndisponibilidades] = useState([]);
  const [indForm, setIndForm] = useState({ tipo: "FERIAS", inicio: "", fim: "" });

  const isAdmin = activeUser?.role === "ADMIN";

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
      const normalized = list.map(normalizeBarber).filter((barber) => barber.username);
      setBarbers(normalized);
    } catch (error) {
      setBarbers([]);
    }
  };

  const loadAppointments = async (currentUser = activeUser) => {
    if (!currentUser) return;

    try {
      setAppointmentsLoading(true);
      const { startDate, endDate } = toMonthRange(calendarMonth);
      const baseFilters = {
        dataInicio: startDate,
        dataFim: endDate
      };

      if (appointmentFilters.status) baseFilters.status = appointmentFilters.status;

      let rawAppointments = [];

      if (currentUser.role === "ADMIN") {
        const filters = { ...baseFilters };
        if (appointmentFilters.barber) {
          filters.barbeiroUserName = appointmentFilters.barber;
        }

        const data = await getAppointments(filters);
        rawAppointments = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
      } else {
        const mineFilters = {
          ...baseFilters,
          barbeiroUserName: currentUser.username
        };

        const requests = [getAppointments(mineFilters)];

        if (!appointmentFilters.status || appointmentFilters.status === "REQUISITADO") {
          requests.push(getAppointments({ ...baseFilters, semBarbeiro: true }));
        }

        const results = await Promise.all(requests);
        const merged = [];
        const seen = new Set();

        results.forEach((result) => {
          const list = Array.isArray(result) ? result : result?.content || result?.agendamentos || [];
          list.forEach((item) => {
            const key = item?.id ?? JSON.stringify(item);
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(item);
          });
        });

        rawAppointments = merged;
      }

      setAppointments(rawAppointments.map(normalizeAppointment));
    } catch (error) {
      setAppointments([]);
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const loadCommissions = async () => {
    try {
      const filters = {};
      if (commissionFilters.inicio) filters.inicio = commissionFilters.inicio;
      if (commissionFilters.fim) filters.fim = commissionFilters.fim;
      const items = await getCommissions(filters);
      setCommissions(items || []);
    } catch (error) {
      setCommissions([]);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const loadIndisponibilidades = async (username) => {
    if (!username) return;

    try {
      const data = await getIndisponibilidades({ barbeiroUsername: username });
      const list = Array.isArray(data) ? data : data?.content || data?.indisponibilidades || [];
      setIndisponibilidades(list);
    } catch (error) {
      setIndisponibilidades([]);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=/barbeiro");
      return;
    }

    const bootstrap = async () => {
      const me = user || (await refreshUser());
      if (!me || (me.role !== "BARBEIRO" && me.role !== "ADMIN")) {
        navigate("/");
        return;
      }

      setActiveUser(me);
    };

    bootstrap();
  }, [token]);

  useEffect(() => {
    if (!activeUser) return;

    loadServices();
    loadCommissions();
    loadAppointments(activeUser);

    if (activeUser.role === "ADMIN") {
      loadBarbers();
    }

    loadIndisponibilidades(activeUser.username);
  }, [activeUser]);

  useEffect(() => {
    if (!activeUser) return;
    loadAppointments(activeUser);
  }, [calendarMonth, appointmentFilters.status, appointmentFilters.barber]);

  const getServiceName = (serviceId) => {
    const found = services.find((item) => String(item.id) === String(serviceId));
    return found?.name || (serviceId ? `Servico #${serviceId}` : "Servico");
  };

  const acceptedAppointments = useMemo(
    () => appointments.filter((item) => item.status === "AGENDADO"),
    [appointments]
  );

  const calendarDayMeta = useMemo(() => {
    const counts = acceptedAppointments.reduce((acc, appointment) => {
      if (!appointment.date) return acc;
      acc[appointment.date] = (acc[appointment.date] || 0) + 1;
      return acc;
    }, {});

    return Object.fromEntries(
      Object.entries(counts).map(([date, count]) => [
        date,
        {
          state: "events",
          count,
          label: `${count} ag.`,
          disabled: false
        }
      ])
    );
  }, [acceptedAppointments]);

  useEffect(() => {
    if (selectedCalendarDate && calendarDayMeta[selectedCalendarDate]) return;

    const firstDate = Object.keys(calendarDayMeta)
      .sort((a, b) => a.localeCompare(b))
      .find(Boolean);

    setSelectedCalendarDate(firstDate || "");
  }, [calendarDayMeta]);

  const acceptedForDay = useMemo(() => {
    if (!selectedCalendarDate) return [];

    return acceptedAppointments
      .filter((appointment) => appointment.date === selectedCalendarDate)
      .sort((a, b) => formatTime(a.time).localeCompare(formatTime(b.time)));
  }, [acceptedAppointments, selectedCalendarDate]);

  const queueList = useMemo(
    () =>
      [...appointments].sort((a, b) => {
        const left = `${a.date || ""} ${formatTime(a.time || "")}`;
        const right = `${b.date || ""} ${formatTime(b.time || "")}`;
        return left.localeCompare(right);
      }),
    [appointments]
  );

  const commissionTotal = commissions.reduce((sum, item) => sum + Number(item.valor || 0), 0);

  const handleIndisponibilidadeSubmit = async (event) => {
    event.preventDefault();

    if (!activeUser?.username || !indForm.tipo || !indForm.inicio || !indForm.fim) {
      toast({ variant: "warning", message: "Preencha todos os campos de indisponibilidade." });
      return;
    }

    try {
      await createIndisponibilidade({
        barbeiroUsername: activeUser.username,
        tipo: indForm.tipo,
        inicio: indForm.inicio,
        fim: indForm.fim
      });

      setIndForm({ tipo: "FERIAS", inicio: "", fim: "" });
      loadIndisponibilidades(activeUser.username);
      toast({ variant: "success", message: "Indisponibilidade cadastrada." });
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const handleAppointmentAction = async (appointment, action) => {
    if (!appointment?.id) return;

    try {
      if (action === "accept") await acceptAppointment(appointment.id);
      if (action === "conclude") await concludeAppointment(appointment.id);
      if (action === "cancel") await cancelAppointment(appointment.id);
      loadAppointments(activeUser);
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const navLinks = [
    { label: "Servicos", href: "/#services" },
    { label: "Sobre", href: "/#about" },
    { label: "Informacoes", href: "/#info" },
    { label: "Avaliacoes", href: "/#reviews" },
    { label: "Barbeiro", href: "/barbeiro" }
  ];

  return (
    <>
      <Header highlight="Barbeiro" links={navLinks} />
      <main className="container barber-page">
        <section className="page-header" data-reveal>
          <h2>Painel do Barbeiro</h2>
          <p>
            {isAdmin
              ? "Visualize e opere a agenda de todos os barbeiros em formato de calendario."
              : "Visualize sua agenda aceita em calendario e gerencie os atendimentos."}
          </p>
        </section>

        <section className="panel" data-reveal="delay-1">
          <div className="panel-header">
            <h3>Calendario de agendamentos aceitos</h3>
            <p className="muted">Mostra apenas status AGENDADO no mes selecionado.</p>
          </div>

          <div className="calendar-two-columns">
            <MonthCalendar
              monthDate={calendarMonth}
              onMonthChange={setCalendarMonth}
              selectedDate={selectedCalendarDate}
              onSelectDate={setSelectedCalendarDate}
              dayMeta={calendarDayMeta}
            />

            <div className="calendar-day-details">
              <h4>
                {selectedCalendarDate
                  ? `Agenda de ${formatDateBr(selectedCalendarDate)}`
                  : "Selecione um dia no calendario"}
              </h4>

              {!acceptedForDay.length ? (
                <p className="muted">Nenhum agendamento aceito para este dia.</p>
              ) : (
                <div className="panel-list">
                  {acceptedForDay.map((appointment) => (
                    <article key={appointment.id} className="row-card">
                      <div className="row-main">
                        <strong>{getServiceName(appointment.serviceId)}</strong>
                        <span>{formatTime(appointment.time)}</span>
                        <span>Barbeiro: {appointment.barbeiroUsername || "-"}</span>
                        <span>Cliente: {appointment.clienteUsername || "-"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="panel" data-reveal="delay-2">
          <div className="panel-header">
            <h3>Fila e operacao de agendamentos</h3>
            <div className="panel-actions">
              <select
                value={appointmentFilters.status}
                onChange={(event) =>
                  setAppointmentFilters((prev) => ({ ...prev, status: event.target.value }))
                }
              >
                <option value="">Todos os status</option>
                <option value="REQUISITADO">Requisitado</option>
                <option value="AGENDADO">Agendado</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="CONCLUIDO">Concluido</option>
              </select>

              <select
                value={appointmentFilters.barber}
                onChange={(event) =>
                  setAppointmentFilters((prev) => ({ ...prev, barber: event.target.value }))
                }
                disabled={!isAdmin}
              >
                <option value="">Todos os barbeiros</option>
                {barbers.map((barber) => (
                  <option key={barber.username} value={barber.username}>
                    {barber.name ? `${barber.name} (${barber.username})` : barber.username}
                  </option>
                ))}
              </select>

              <button
                className="ghost-action"
                type="button"
                onClick={() => setAppointmentFilters({ status: "", barber: "" })}
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="panel-body">
            {appointmentsLoading ? <p className="muted">Carregando agenda...</p> : null}

            {!appointmentsLoading && !queueList.length ? (
              <p className="muted">Nenhum agendamento encontrado para o periodo.</p>
            ) : (
              <div className="panel-list">
                {queueList.map((appointment) => (
                  <article key={appointment.id} className="row-card">
                    <div className="row-main">
                      <strong>{getServiceName(appointment.serviceId)}</strong>
                      <span>
                        {formatDateBr(appointment.date)} as {formatTime(appointment.time)}
                      </span>
                      <span>Barbeiro: {appointment.barbeiroUsername || "-"}</span>
                      <span>Cliente: {appointment.clienteUsername || "-"}</span>
                    </div>

                    <div className="row-meta">
                      <span className={`tag ${statusClass(appointment.status)}`}>{appointment.status}</span>
                    </div>

                    <div className="row-actions">
                      {appointment.status === "REQUISITADO" ? (
                        <button
                          className="primary-action"
                          type="button"
                          onClick={() => handleAppointmentAction(appointment, "accept")}
                        >
                          Aceitar
                        </button>
                      ) : null}

                      {appointment.status === "AGENDADO" && canConclude(appointment) ? (
                        <button
                          className="primary-action"
                          type="button"
                          onClick={() => handleAppointmentAction(appointment, "conclude")}
                        >
                          Concluir
                        </button>
                      ) : null}

                      {["REQUISITADO", "AGENDADO"].includes(appointment.status) &&
                      canCancel(appointment, activeUser) ? (
                        <button
                          className="danger-action"
                          type="button"
                          onClick={() => handleAppointmentAction(appointment, "cancel")}
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel" data-reveal="delay-3">
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

          <div className="panel-summary">
            <div className="summary-card">
              <span>Total no periodo</span>
              <strong>{formatCurrency(commissionTotal)}</strong>
            </div>
          </div>

          {!commissions.length ? (
            <p className="muted">Nenhuma comissao encontrada.</p>
          ) : (
            <div className="panel-list">
              {commissions.map((item) => (
                <article key={item.id} className="row-card">
                  <div className="row-main">
                    <strong>{item.servicoNome || "Servico"}</strong>
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
          )}
        </section>

        <section className="panel" data-reveal="delay-4">
          <div className="panel-header">
            <h3>Indisponibilidades</h3>
            <p className="muted">Registre periodos sem atendimento.</p>
          </div>

          <form className="panel-form" onSubmit={handleIndisponibilidadeSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="ind-tipo">Tipo</label>
                <select
                  id="ind-tipo"
                  value={indForm.tipo}
                  onChange={(event) => setIndForm((prev) => ({ ...prev, tipo: event.target.value }))}
                  required
                >
                  <option value="FERIAS">Ferias</option>
                  <option value="PAUSA">Pausa</option>
                  <option value="MANUTENCAO">Manutencao</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="ind-inicio">Inicio</label>
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

          {!indisponibilidades.length ? (
            <p className="muted">Nenhuma indisponibilidade cadastrada.</p>
          ) : (
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
                          loadIndisponibilidades(activeUser?.username);
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
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Barber;
