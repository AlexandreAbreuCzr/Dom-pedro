
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { MonthCalendar, calendarUtils } from "../components/MonthCalendar.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import {
  createCashEntry,
  createCashClosing,
  createService,
  createServiceWithImage,
  createIndisponibilidade,
  deleteIndisponibilidade,
  deleteService,
  formatCurrency,
  formatDateBr,
  formatTime,
  emitCashClosingNfce,
  getAppointments,
  getBarbers,
  getCash,
  getCashClosingPreview,
  getCashClosings,
  getCommissionRate,
  getCommissions,
  getErrorMessage,
  getIndisponibilidades,
  getServices,
  getUsersAdmin,
  normalizeAppointment,
  normalizeBarber,
  normalizeService,
  updateCommission,
  updateCommissionRate,
  updateService,
  updateServiceImage,
  updateUserRole,
  updateUserStatus
} from "../lib/api.js";

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

const cashClosingPeriodLabels = {
  DIARIO: "Diario",
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
  PERSONALIZADO: "Personalizado"
};

const nfceStatusLabels = {
  NAO_SOLICITADA: "Nao solicitada",
  PENDENTE_INTEGRACAO: "Pendente",
  EMITIDA: "Emitida",
  FALHA: "Falha"
};

const nfceStatusClass = (status) => {
  if (status === "EMITIDA") return "tag--success";
  if (status === "FALHA") return "tag--danger";
  if (status === "PENDENTE_INTEGRACAO") return "tag--info";
  return "";
};

const todayIso = () => calendarUtils.toIso(new Date());

const parseDecimalInput = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const formatDateTimeBr = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
};

const Admin = () => {
  const { token, user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersEmpty, setUsersEmpty] = useState(false);
  const [userFilters, setUserFilters] = useState({ name: "", role: "", status: "" });

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

  const [barbers, setBarbers] = useState([]);

  const [calendarMonth, setCalendarMonth] = useState(calendarUtils.startOfMonth(new Date()));
  const [calendarBarberFilter, setCalendarBarberFilter] = useState("");
  const [calendarSelectedDate, setCalendarSelectedDate] = useState("");
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const [indisponibilidades, setIndisponibilidades] = useState([]);
  const [indisponibilidadesEmpty, setIndisponibilidadesEmpty] = useState(false);
  const [indForm, setIndForm] = useState({
    barbeiroUsername: "",
    tipo: "FERIAS",
    inicio: "",
    fim: ""
  });

  const [commissions, setCommissions] = useState([]);
  const [commissionsEmpty, setCommissionsEmpty] = useState(false);
  const [commissionFilters, setCommissionFilters] = useState({ inicio: "", fim: "" });
  const [commissionRate, setCommissionRate] = useState("");
  const [commissionApplyAll, setCommissionApplyAll] = useState(false);

  const [cashEntries, setCashEntries] = useState([]);
  const [cashEmpty, setCashEmpty] = useState(false);
  const [cashFilters, setCashFilters] = useState({ inicio: "", fim: "", tipo: "" });
  const [cashForm, setCashForm] = useState({
    tipo: "ENTRADA",
    descricao: "",
    valor: "",
    barbeiroUsername: ""
  });
  const [cashClosingForm, setCashClosingForm] = useState({
    periodo: "DIARIO",
    referencia: todayIso(),
    inicio: "",
    fim: "",
    saldoInformado: "",
    observacao: "",
    solicitarNfce: false
  });
  const [cashClosingPreview, setCashClosingPreview] = useState(null);
  const [cashClosingHistory, setCashClosingHistory] = useState([]);
  const [cashClosingHistoryEmpty, setCashClosingHistoryEmpty] = useState(false);
  const [cashClosingLoading, setCashClosingLoading] = useState(false);
  const [cashClosingNfceLoadingId, setCashClosingNfceLoadingId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=/admin");
      return;
    }

    const bootstrap = async () => {
      const me = user || (await refreshUser());
      if (!me || me.role !== "ADMIN") {
        navigate("/");
        return;
      }
      setReady(true);
    };

    bootstrap();
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
      setUsers([]);
      setUsersEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const loadServices = async () => {
    try {
      const data = await getServices();
      const list = Array.isArray(data) ? data : data?.content || data?.servicos || [];
      const normalized = list.map(normalizeService).map((service) => ({
        ...service,
        duration: service.duracaoEmMinutos || 0
      }));
      setServices(normalized);
      setServicesEmpty(!normalized.length);
    } catch (error) {
      setServices([]);
      setServicesEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const loadBarbers = async () => {
    try {
      const data = await getBarbers();
      const list = Array.isArray(data) ? data : data?.content || data?.usuarios || [];
      const normalized = list.map(normalizeBarber).filter((barber) => barber.username);
      setBarbers(normalized);

      if (!indForm.barbeiroUsername && normalized.length) {
        setIndForm((prev) => ({ ...prev, barbeiroUsername: normalized[0].username }));
      }

      return normalized;
    } catch (error) {
      setBarbers([]);
      return [];
    }
  };

  const loadCalendarAppointments = async () => {
    if (!ready) return;

    try {
      setCalendarLoading(true);

      const { startDate, endDate } = toMonthRange(calendarMonth);
      const filters = {
        dataInicio: startDate,
        dataFim: endDate
      };

      if (calendarBarberFilter) {
        filters.barbeiroUserName = calendarBarberFilter;
      }

      const data = await getAppointments(filters);
      const list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
      setCalendarAppointments(list.map(normalizeAppointment));
    } catch (error) {
      setCalendarAppointments([]);
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setCalendarLoading(false);
    }
  };

  const loadIndisponibilidades = async (barbeiroUsername) => {
    if (!barbeiroUsername) {
      setIndisponibilidades([]);
      setIndisponibilidadesEmpty(true);
      return;
    }

    try {
      const data = await getIndisponibilidades({ barbeiroUsername });
      const list = Array.isArray(data) ? data : data?.content || data?.indisponibilidades || [];
      setIndisponibilidades(list);
      setIndisponibilidadesEmpty(!list.length);
    } catch (error) {
      setIndisponibilidades([]);
      setIndisponibilidadesEmpty(true);
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
      setCommissions([]);
      setCommissionsEmpty(true);
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
      setCashEntries([]);
      setCashEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const loadCashClosings = async () => {
    try {
      const filters = {};
      if (cashFilters.inicio) filters.inicio = cashFilters.inicio;
      if (cashFilters.fim) filters.fim = cashFilters.fim;
      const items = await getCashClosings(filters);
      setCashClosingHistory(items || []);
      setCashClosingHistoryEmpty(!(items && items.length));
    } catch (error) {
      setCashClosingHistory([]);
      setCashClosingHistoryEmpty(true);
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  useEffect(() => {
    if (!ready) return;

    const initialize = async () => {
      loadUsers();
      loadServices();
      loadCommissions();
      loadCommissionRate();
      loadCash();
      loadCashClosings();

      const loadedBarbers = await loadBarbers();
      const defaultBarber = indForm.barbeiroUsername || loadedBarbers[0]?.username;
      loadIndisponibilidades(defaultBarber);
      loadCalendarAppointments();
    };

    initialize();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    loadCalendarAppointments();
  }, [calendarMonth, calendarBarberFilter]);

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
      toast({ variant: "warning", message: "Preencha nome, preco e duracao." });
      return;
    }

    try {
      if (serviceForm.id) {
        await updateService(serviceForm.id, {
          name,
          price,
          duracaoEmMinutos: duration,
          status
        });
        if (serviceForm.file) await updateServiceImage(serviceForm.id, serviceForm.file);
        toast({ variant: "success", message: "Servico atualizado." });
      } else {
        if (serviceForm.file) {
          await createServiceWithImage({ name, price, duracaoEmMinutos: duration }, serviceForm.file);
        } else {
          await createService({ name, price, duracaoEmMinutos: duration });
        }
        toast({ variant: "success", message: "Servico criado." });
      }

      resetServiceForm();
      loadServices();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const handleDeleteService = async (service) => {
    if (!service?.id) return;
    if (!confirm(`Excluir servico "${service.name}"?`)) return;

    try {
      await deleteService(service.id);
      toast({
        variant: "success",
        message: "Servico removido. Se tinha agendamento vinculado, foi desativado."
      });
      loadServices();
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
      toast({ variant: "warning", message: "Informe um percentual valido." });
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

  const buildCashClosingPayload = () => {
    const payload = {
      periodo: cashClosingForm.periodo
    };

    if (cashClosingForm.periodo === "PERSONALIZADO") {
      if (!cashClosingForm.inicio || !cashClosingForm.fim) {
        toast({
          variant: "warning",
          message: "Para fechamento personalizado, informe inicio e fim."
        });
        return null;
      }
      payload.inicio = cashClosingForm.inicio;
      payload.fim = cashClosingForm.fim;
    } else {
      payload.referencia = cashClosingForm.referencia || todayIso();
    }

    const saldoInformado = parseDecimalInput(cashClosingForm.saldoInformado);
    if (Number.isNaN(saldoInformado)) {
      toast({ variant: "warning", message: "Saldo informado invalido." });
      return null;
    }
    if (saldoInformado != null) payload.saldoInformado = saldoInformado;

    const observacao = cashClosingForm.observacao.trim();
    if (observacao) payload.observacao = observacao;
    payload.solicitarNfce = Boolean(cashClosingForm.solicitarNfce);

    return payload;
  };

  const handleCashClosingPreview = async () => {
    const payload = buildCashClosingPayload();
    if (!payload) return;
    const previewFilters = {
      periodo: payload.periodo
    };
    if (payload.referencia) previewFilters.referencia = payload.referencia;
    if (payload.inicio) previewFilters.inicio = payload.inicio;
    if (payload.fim) previewFilters.fim = payload.fim;

    try {
      setCashClosingLoading(true);
      const preview = await getCashClosingPreview(previewFilters);
      setCashClosingPreview(preview || null);
    } catch (error) {
      setCashClosingPreview(null);
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setCashClosingLoading(false);
    }
  };

  const handleCashClosingSubmit = async (event) => {
    event.preventDefault();

    const payload = buildCashClosingPayload();
    if (!payload) return;
    const previewFilters = {
      periodo: payload.periodo
    };
    if (payload.referencia) previewFilters.referencia = payload.referencia;
    if (payload.inicio) previewFilters.inicio = payload.inicio;
    if (payload.fim) previewFilters.fim = payload.fim;

    try {
      setCashClosingLoading(true);
      await createCashClosing(payload);
      toast({ variant: "success", message: "Fechamento de caixa registrado." });

      await Promise.all([loadCash(), loadCashClosings()]);
      const preview = await getCashClosingPreview(previewFilters);
      setCashClosingPreview(preview || null);
      setCashClosingForm((prev) => ({
        ...prev,
        saldoInformado: "",
        observacao: "",
        solicitarNfce: false
      }));
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setCashClosingLoading(false);
    }
  };

  const handleEmitCashClosingNfce = async (item) => {
    if (!item?.id) return;

    try {
      setCashClosingNfceLoadingId(item.id);
      const updated = await emitCashClosingNfce(item.id);

      setCashClosingHistory((prev) =>
        prev.map((entry) => (entry.id === item.id ? updated : entry))
      );

      toast({
        variant: "success",
        message:
          updated?.nfceStatus === "EMITIDA"
            ? "Nota fiscal emitida com sucesso."
            : "Solicitacao de nota fiscal enviada."
      });
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
      await loadCashClosings();
    } finally {
      setCashClosingNfceLoadingId(null);
    }
  };

  const handleCashSubmit = async (event) => {
    event.preventDefault();

    const valor = parseDecimalInput(cashForm.valor);
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

  const calendarDayMeta = useMemo(() => {
    const grouped = calendarAppointments.reduce((acc, item) => {
      if (!item.date) return acc;
      acc[item.date] = (acc[item.date] || 0) + 1;
      return acc;
    }, {});

    return Object.fromEntries(
      Object.entries(grouped).map(([date, count]) => [
        date,
        {
          state: "events",
          count,
          label: `${count} ag.`,
          disabled: false
        }
      ])
    );
  }, [calendarAppointments]);

  useEffect(() => {
    if (calendarSelectedDate && calendarDayMeta[calendarSelectedDate]) return;

    const firstDate = Object.keys(calendarDayMeta)
      .sort((a, b) => a.localeCompare(b))
      .find(Boolean);

    setCalendarSelectedDate(firstDate || "");
  }, [calendarDayMeta]);

  const appointmentsOfSelectedDay = useMemo(() => {
    if (!calendarSelectedDate) return [];

    return calendarAppointments
      .filter((item) => item.date === calendarSelectedDate)
      .sort((a, b) => {
        const left = formatTime(a.time || "");
        const right = formatTime(b.time || "");
        return left.localeCompare(right);
      });
  }, [calendarAppointments, calendarSelectedDate]);

  const cashSummary = cashEntries.reduce(
    (acc, item) => {
      const value = Number(item.valor || 0);
      if (item.tipo === "ENTRADA") acc.entrada += value;
      if (item.tipo === "SAIDA") acc.saida += value;
      return acc;
    },
    { entrada: 0, saida: 0 }
  );
  const saldo = cashSummary.entrada - cashSummary.saida;
  const isCustomClosingPeriod = cashClosingForm.periodo === "PERSONALIZADO";

  const handleCashFilter = () => {
    loadCash();
    loadCashClosings();
  };

  const navLinks = [
    { label: "Servicos", href: "/#services" },
    { label: "Sobre", href: "/#about" },
    { label: "Informacoes", href: "/#info" },
    { label: "Avaliacoes", href: "/#reviews" },
    { label: "Admin", href: "/admin" }
  ];

  return (
    <>
      <Header highlight="Admin" links={navLinks} />
      <main className="container admin-page">
        <section className="page-header" data-reveal>
          <h2>Painel Administrativo</h2>
          <p>Gestao completa de usuarios, agenda, servicos, comissoes e caixa.</p>
        </section>

        <section className="panel" data-reveal="delay-1">
          <div className="panel-header">
            <h3>Calendario global de agendamentos</h3>
            <div className="panel-actions">
              <select
                value={calendarBarberFilter}
                onChange={(event) => setCalendarBarberFilter(event.target.value)}
              >
                <option value="">Todos os barbeiros</option>
                {barbers.map((barber) => (
                  <option key={barber.username} value={barber.username}>
                    {barber.name ? `${barber.name} (${barber.username})` : barber.username}
                  </option>
                ))}
              </select>
              <button className="ghost-action" type="button" onClick={loadCalendarAppointments}>
                Atualizar
              </button>
            </div>
          </div>

          <div className="calendar-two-columns">
            <MonthCalendar
              monthDate={calendarMonth}
              onMonthChange={setCalendarMonth}
              selectedDate={calendarSelectedDate}
              onSelectDate={setCalendarSelectedDate}
              dayMeta={calendarDayMeta}
            />

            <div className="calendar-day-details">
              <h4>
                {calendarSelectedDate
                  ? `Agendamentos de ${formatDateBr(calendarSelectedDate)}`
                  : "Selecione um dia no calendario"}
              </h4>

              {calendarLoading ? <p className="muted">Carregando agendamentos...</p> : null}

              {!calendarLoading && !appointmentsOfSelectedDay.length ? (
                <p className="muted">Nenhum agendamento para o dia selecionado.</p>
              ) : (
                <div className="panel-list">
                  {appointmentsOfSelectedDay.map((appointment) => (
                    <article key={appointment.id} className="row-card">
                      <div className="row-main">
                        <strong>{appointment.serviceName || `Servico #${appointment.serviceId}`}</strong>
                        <span>
                          {formatDateBr(appointment.date)} as {formatTime(appointment.time)}
                        </span>
                        <span>Barbeiro: {appointment.barbeiroUsername || "-"}</span>
                        <span>Cliente: {appointment.clienteUsername || "-"}</span>
                      </div>
                      <div className="row-meta">
                        <span className={`tag ${statusClass(appointment.status)}`}>{appointment.status}</span>
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
            <h3>Usuarios</h3>
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
                <option value="">Todos os papeis</option>
                <option value="ADMIN">ADMIN</option>
                <option value="BARBEIRO">BARBEIRO</option>
                <option value="USER">USER</option>
              </select>
              <select
                value={userFilters.status}
                onChange={(event) => setUserFilters((prev) => ({ ...prev, status: event.target.value }))}
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
            {!users.length ? (
              <p className="muted">Nenhum usuario encontrado.</p>
            ) : (
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
            )}
            {usersEmpty ? <p className="muted">Sem resultados para os filtros.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-3">
          <div className="panel-header">
            <h3>Servicos</h3>
            <p className="muted">Cadastro, edicao e status dos servicos.</p>
          </div>

          <div className="panel-body">
            <form className="panel-form" onSubmit={handleServiceSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="service-name">Nome</label>
                  <input
                    id="service-name"
                    type="text"
                    placeholder="Corte classico"
                    required
                    value={serviceForm.name}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="service-price">Preco</label>
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
                  <label htmlFor="service-duration">Duracao (min)</label>
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
                    <option value="false">Nao</option>
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
                  {serviceForm.id ? "Salvar alteracoes" : "Salvar servico"}
                </button>
                {serviceForm.id ? (
                  <button className="ghost-action" type="button" onClick={resetServiceForm}>
                    Cancelar edicao
                  </button>
                ) : null}
              </div>
            </form>

            {!services.length ? (
              <p className="muted">Nenhum servico cadastrado.</p>
            ) : (
              <div className="panel-list">
                {services.map((service) => (
                  <article key={service.id} className="row-card">
                    <div className="row-main">
                      <strong>{service.name}</strong>
                      <span>{formatCurrency(service.price)}</span>
                      <span>Duracao: {service.duration || "-"} min</span>
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
                      <button
                        className="danger-action"
                        type="button"
                        onClick={() => handleDeleteService(service)}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {servicesEmpty ? <p className="muted">Falha ao carregar servicos.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-4">
          <div className="panel-header">
            <h3>Indisponibilidades</h3>
            <p className="muted">Registre periodos sem atendimento por barbeiro.</p>
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
                      const username = event.target.value;
                      setIndForm((prev) => ({ ...prev, barbeiroUsername: username }));
                      loadIndisponibilidades(username);
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
            )}
            {indisponibilidadesEmpty ? <p className="muted">Sem resultados para o barbeiro.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-5">
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
            {!commissions.length ? (
              <p className="muted">Nenhuma comissao encontrada.</p>
            ) : (
              <div className="panel-list">
                {commissions.map((item) => (
                  <article key={item.id} className="row-card">
                    <div className="row-main">
                      <strong>{item.barbeiroNome || item.barbeiroUsername || "-"}</strong>
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
                        title="Percentual da comissao"
                      />
                      <button
                        className="ghost-action"
                        type="button"
                        onClick={async (event) => {
                          const input = event.currentTarget.parentElement?.querySelector("input");
                          const percentual = Number(String(input?.value || "").replace(",", "."));
                          if (!Number.isFinite(percentual)) {
                            toast({ variant: "warning", message: "Informe um percentual valido." });
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
            )}
            {commissionsEmpty ? <p className="muted">Falha ao carregar comissoes.</p> : null}
          </div>
        </section>

        <section className="panel" data-reveal="delay-6">
          <div className="panel-header">
            <h3>Caixa</h3>
            <div className="panel-actions">
              <input
                type="date"
                value={cashFilters.inicio}
                onChange={(event) => setCashFilters((prev) => ({ ...prev, inicio: event.target.value }))}
              />
              <input
                type="date"
                value={cashFilters.fim}
                onChange={(event) => setCashFilters((prev) => ({ ...prev, fim: event.target.value }))}
              />
              <select
                value={cashFilters.tipo}
                onChange={(event) => setCashFilters((prev) => ({ ...prev, tipo: event.target.value }))}
              >
                <option value="">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saida</option>
              </select>
              <button className="ghost-action" type="button" onClick={handleCashFilter}>
                Filtrar
              </button>
            </div>
          </div>

          <div className="panel-body">
            <div className="cash-closing-grid">
              <form className="panel-form cash-closing-form" onSubmit={handleCashClosingSubmit}>
                <h4>Fechamento de caixa</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="closing-periodo">Periodo</label>
                    <select
                      id="closing-periodo"
                      value={cashClosingForm.periodo}
                      onChange={(event) =>
                        setCashClosingForm((prev) => ({
                          ...prev,
                          periodo: event.target.value
                        }))
                      }
                    >
                      <option value="DIARIO">Diario</option>
                      <option value="SEMANAL">Semanal</option>
                      <option value="MENSAL">Mensal</option>
                      <option value="PERSONALIZADO">Personalizado</option>
                    </select>
                  </div>

                  {!isCustomClosingPeriod ? (
                    <div className="form-field">
                      <label htmlFor="closing-referencia">Data de referencia</label>
                      <input
                        id="closing-referencia"
                        type="date"
                        value={cashClosingForm.referencia}
                        onChange={(event) =>
                          setCashClosingForm((prev) => ({
                            ...prev,
                            referencia: event.target.value
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <div className="form-field">
                        <label htmlFor="closing-inicio">Inicio</label>
                        <input
                          id="closing-inicio"
                          type="date"
                          value={cashClosingForm.inicio}
                          onChange={(event) =>
                            setCashClosingForm((prev) => ({
                              ...prev,
                              inicio: event.target.value
                            }))
                          }
                          required={isCustomClosingPeriod}
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="closing-fim">Fim</label>
                        <input
                          id="closing-fim"
                          type="date"
                          value={cashClosingForm.fim}
                          onChange={(event) =>
                            setCashClosingForm((prev) => ({
                              ...prev,
                              fim: event.target.value
                            }))
                          }
                          required={isCustomClosingPeriod}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-field">
                    <label htmlFor="closing-saldo">Saldo contado (opcional)</label>
                    <input
                      id="closing-saldo"
                      type="text"
                      placeholder="1500.00"
                      value={cashClosingForm.saldoInformado}
                      onChange={(event) =>
                        setCashClosingForm((prev) => ({
                          ...prev,
                          saldoInformado: event.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="closing-observacao">Observacao</label>
                    <textarea
                      id="closing-observacao"
                      rows={2}
                      placeholder="Resumo do turno, sangria, divergencias..."
                      value={cashClosingForm.observacao}
                      onChange={(event) =>
                        setCashClosingForm((prev) => ({
                          ...prev,
                          observacao: event.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={cashClosingForm.solicitarNfce}
                    onChange={(event) =>
                      setCashClosingForm((prev) => ({
                        ...prev,
                        solicitarNfce: event.target.checked
                      }))
                    }
                  />
                  Solicitar nota fiscal
                </label>

                <div className="form-actions">
                  <button
                    className="ghost-action"
                    type="button"
                    onClick={handleCashClosingPreview}
                    disabled={cashClosingLoading}
                  >
                    Previsualizar
                  </button>
                  <button className="primary-action" type="submit" disabled={cashClosingLoading}>
                    Fechar periodo
                  </button>
                </div>

                {cashClosingPreview?.resumo ? (
                  <div className="cash-closing-preview">
                    <div className="row-main">
                      <strong>
                        Preview {cashClosingPeriodLabels[cashClosingPreview.periodo] || cashClosingPreview.periodo}
                      </strong>
                      <span>
                        {formatDateTimeBr(cashClosingPreview.resumo.dataInicio)} ate{" "}
                        {formatDateTimeBr(cashClosingPreview.resumo.dataFim)}
                      </span>
                    </div>

                    <div className="panel-summary">
                      <div className="summary-card">
                        <span>Entradas</span>
                        <strong>{formatCurrency(cashClosingPreview.resumo.totalEntradas)}</strong>
                      </div>
                      <div className="summary-card">
                        <span>Saidas</span>
                        <strong>{formatCurrency(cashClosingPreview.resumo.totalSaidas)}</strong>
                      </div>
                      <div className="summary-card">
                        <span>Saldo apurado</span>
                        <strong>{formatCurrency(cashClosingPreview.resumo.saldoApurado)}</strong>
                      </div>
                      <div className="summary-card">
                        <span>Lancamentos</span>
                        <strong>{cashClosingPreview.resumo.totalLancamentos || 0}</strong>
                      </div>
                    </div>

                    {cashClosingPreview.resumo.porBarbeiro?.length ? (
                      <div className="panel-list">
                        {cashClosingPreview.resumo.porBarbeiro.map((barbeiro) => (
                          <article key={barbeiro.barbeiroUsername} className="row-card">
                            <div className="row-main">
                              <strong>
                                {barbeiro.barbeiroUsername === "sem_barbeiro"
                                  ? "Sem barbeiro"
                                  : `@${barbeiro.barbeiroUsername}`}
                              </strong>
                              <span>Lancamentos: {barbeiro.totalLancamentos || 0}</span>
                            </div>
                            <div className="row-meta">
                              <span className="tag">Entrada: {formatCurrency(barbeiro.entradas)}</span>
                              <span className="tag">Saida: {formatCurrency(barbeiro.saidas)}</span>
                              <span className="tag">Saldo: {formatCurrency(barbeiro.saldo)}</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">Sem lancamentos no periodo para detalhar por barbeiro.</p>
                    )}

                    {cashClosingPreview.nfceInfo ? (
                      <p className="muted">{cashClosingPreview.nfceInfo}</p>
                    ) : null}
                  </div>
                ) : null}
              </form>

              <div className="cash-closing-history">
                <h4>Historico de fechamentos</h4>
                {!cashClosingHistory.length ? (
                  <p className="muted">Nenhum fechamento registrado.</p>
                ) : (
                  <div className="panel-list">
                    {cashClosingHistory.map((item) => (
                      <article key={item.id} className="row-card">
                        <div className="row-main">
                          <strong>
                            {cashClosingPeriodLabels[item.periodo] || item.periodo}
                          </strong>
                          <span>
                            {formatDateTimeBr(item.dataInicio)} ate {formatDateTimeBr(item.dataFim)}
                          </span>
                          <span>Fechado por: {item.fechadoPorUsername ? `@${item.fechadoPorUsername}` : "-"}</span>
                        </div>

                        <div className="row-meta">
                          <span className="tag">Entradas: {formatCurrency(item.totalEntradas)}</span>
                          <span className="tag">Saidas: {formatCurrency(item.totalSaidas)}</span>
                          <span className="tag">Saldo: {formatCurrency(item.saldoApurado)}</span>
                          <span className={`tag ${nfceStatusClass(item.nfceStatus)}`}>
                            Nota: {nfceStatusLabels[item.nfceStatus] || item.nfceStatus || "-"}
                          </span>
                          {item.nfceChave ? <span className="tag">Chave: {item.nfceChave}</span> : null}
                        </div>

                        <div className="row-meta">
                          <span className="tag">
                            Criado em: {formatDateTimeBr(item.dataDeCriacao)}
                          </span>
                          {item.saldoInformado != null ? (
                            <span className="tag">
                              Contado: {formatCurrency(item.saldoInformado)}
                            </span>
                          ) : null}
                          {item.diferenca != null ? (
                            <span className={`tag ${Number(item.diferenca) === 0 ? "tag--success" : "tag--danger"}`}>
                              Diferenca: {formatCurrency(item.diferenca)}
                            </span>
                          ) : null}
                        </div>

                        {item.solicitarNfce &&
                        (item.nfceStatus === "PENDENTE_INTEGRACAO" || item.nfceStatus === "FALHA") ? (
                          <div className="row-actions">
                            <button
                              className="ghost-action"
                              type="button"
                              disabled={cashClosingNfceLoadingId === item.id}
                              onClick={() => handleEmitCashClosingNfce(item)}
                            >
                              {cashClosingNfceLoadingId === item.id ? "Emitindo..." : "Emitir nota"}
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
                {cashClosingHistoryEmpty ? (
                  <p className="muted">Falha ao carregar historico de fechamentos.</p>
                ) : null}
              </div>
            </div>

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
                    placeholder="Produto, aluguel, insumo..."
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
                  Adicionar lancamento
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

            {!cashEntries.length ? (
              <p className="muted">Nenhum lancamento encontrado.</p>
            ) : (
              <div className="panel-list">
                {cashEntries.map((item) => (
                  <article key={item.id} className="row-card">
                    <div className="row-main">
                      <strong>{item.descricao}</strong>
                      <span>{item.barbeiroUsername ? `@${item.barbeiroUsername}` : "Sem barbeiro"}</span>
                      <span>{item.agendamentoId ? `Agendamento ${item.agendamentoId}` : "Lancamento manual"}</span>
                    </div>
                    <div className="row-meta">
                      <span className={`tag ${item.tipo === "ENTRADA" ? "tag--success" : "tag--danger"}`}>
                        {item.tipo}
                      </span>
                      <span className="tag">{formatCurrency(item.valor)}</span>
                      {item.valorBarbeiro != null || item.valorBarbearia != null ? (
                        <span className="tag">
                          {[
                            item.valorBarbeiro != null
                              ? `Barbeiro: ${formatCurrency(item.valorBarbeiro)}`
                              : null,
                            item.valorBarbearia != null
                              ? `Barbearia: ${formatCurrency(item.valorBarbearia)}`
                              : null,
                            item.percentualComissao != null ? `Taxa: ${item.percentualComissao}%` : null
                          ]
                            .filter(Boolean)
                            .join(" | ")}
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
            )}
            {cashEmpty ? <p className="muted">Falha ao carregar lancamentos.</p> : null}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Admin;
