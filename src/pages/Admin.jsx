
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { MonthCalendar, calendarUtils } from "../components/MonthCalendar.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import {
  createEmployee,
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
  getAppointments,
  getBarbers,
  getCash,
  getDashboardOverview,
  getCashClosingPreview,
  getCashClosings,
  getCommissions,
  getErrorMessage,
  getIndisponibilidades,
  getServices,
  getEmployeesAdmin,
  normalizeAppointment,
  normalizeBarber,
  normalizeService,
  updateCommission,
  updateService,
  updateServiceImage,
  updateUserPermissions,
  updateUserRole,
  updateUserStatus
} from "../lib/api.js";
import {
  Permissions,
  Roles,
  canAccessAdminPanel,
  canManageCash,
  canManageCommissions,
  canManageIndisponibilidade,
  canManageSchedule,
  canManageServices,
  canManageUserPermissions,
  canManageUserRoles,
  canManageUsers,
  canViewBusinessDashboard,
  getRoleDefaultPermissions,
  normalizeRole,
  resolvePermissionSet
} from "../lib/permissions.js";

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

const roleLabels = {
  ADMIN: "Administrador",
  DONO: "Dono",
  FUNCIONARIO: "Funcionario",
  USER: "Cliente"
};

const formatRoleLabel = (role) => roleLabels[normalizeRole(role)] || role || "-";

const permissionGroups = [
  {
    title: "Pessoas",
    items: [
      { key: Permissions.USUARIOS_VISUALIZAR, label: "Visualizar usuarios" },
      { key: Permissions.USUARIOS_GERIR, label: "Gerir usuarios" },
      { key: Permissions.USUARIOS_ALTERAR_ROLE, label: "Alterar cargos" },
      { key: Permissions.USUARIOS_ALTERAR_PERMISSOES, label: "Alterar acessos" }
    ]
  },
  {
    title: "Agenda e Cadastros",
    items: [
      { key: Permissions.AGENDA_GERIR, label: "Agenda / agendamentos" },
      { key: Permissions.SERVICOS_GERIR, label: "Servicos" },
      { key: Permissions.INDISPONIBILIDADE_GERIR, label: "Bloqueios / indisponibilidade" }
    ]
  },
  {
    title: "Financeiro",
    items: [
      { key: Permissions.DASHBOARD_VISUALIZAR, label: "Dashboard" },
      { key: Permissions.COMISSOES_GERIR, label: "Comissoes" },
      { key: Permissions.CAIXA_GERIR, label: "Caixa / fechamentos" }
    ]
  }
];

const Admin = () => {
  const { token, user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersEmpty, setUsersEmpty] = useState(false);
  const [userFilters, setUserFilters] = useState({ name: "", role: "", status: "" });
  const [employeeForm, setEmployeeForm] = useState({
    username: "",
    name: "",
    email: "",
    telefone: "",
    password: "",
    role: Roles.FUNCIONARIO
  });

  const [services, setServices] = useState([]);
  const [servicesEmpty, setServicesEmpty] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    id: "",
    name: "",
    price: "",
    duration: "",
    percentualComissao: "50",
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
    observacao: ""
  });
  const [cashClosingPreview, setCashClosingPreview] = useState(null);
  const [cashClosingHistory, setCashClosingHistory] = useState([]);
  const [cashClosingHistoryEmpty, setCashClosingHistoryEmpty] = useState(false);
  const [cashClosingLoading, setCashClosingLoading] = useState(false);

  const [dashboardFilters, setDashboardFilters] = useState({ inicio: "", fim: "" });
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const permissionContext = activeUser || user || null;
  const activeRole = normalizeRole(permissionContext?.role);
  const allowUsers = canManageUsers(permissionContext);
  const allowUserRoleChange = canManageUserRoles(permissionContext);
  const allowUserPermissionChange = canManageUserPermissions(permissionContext);
  const allowServices = canManageServices(permissionContext);
  const allowSchedule = canManageSchedule(permissionContext);
  const allowIndisponibilidade = canManageIndisponibilidade(permissionContext);
  const allowCommissions = canManageCommissions(permissionContext);
  const allowCash = canManageCash(permissionContext);
  const allowDashboard = canViewBusinessDashboard(permissionContext);

  const panelTabs = useMemo(() => {
    const tabs = [];

    const visaoItems = [
      allowDashboard ? { id: "dashboard", label: "Dashboard" } : null,
      allowSchedule ? { id: "agenda", label: "Agenda" } : null
    ].filter(Boolean);
    if (visaoItems.length) tabs.push({ id: "visao", label: "Visao", items: visaoItems });

    const equipeItems = [allowUsers ? { id: "funcionarios", label: "Funcionarios" } : null].filter(Boolean);
    if (equipeItems.length) tabs.push({ id: "equipe", label: "Equipe", items: equipeItems });

    const cadastroItems = [
      allowServices ? { id: "servicos", label: "Servicos" } : null,
      allowIndisponibilidade ? { id: "indisponibilidade", label: "Indisponibilidade" } : null
    ].filter(Boolean);
    if (cadastroItems.length) tabs.push({ id: "cadastros", label: "Cadastros", items: cadastroItems });

    const financeiroItems = [
      allowCommissions ? { id: "comissoes", label: "Comissoes" } : null,
      allowCash ? { id: "caixa", label: "Caixa" } : null
    ].filter(Boolean);
    if (financeiroItems.length) tabs.push({ id: "financeiro", label: "Financeiro", items: financeiroItems });

    return tabs;
  }, [
    allowDashboard,
    allowSchedule,
    allowUsers,
    allowServices,
    allowIndisponibilidade,
    allowCommissions,
    allowCash
  ]);

  const [activeTab, setActiveTab] = useState("");
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (!panelTabs.length) {
      setActiveTab("");
      setActiveSection("");
      return;
    }

    const currentTab = panelTabs.find((tab) => tab.id === activeTab) || panelTabs[0];
    const currentSectionExists = currentTab.items.some((item) => item.id === activeSection);

    if (currentTab.id !== activeTab) {
      setActiveTab(currentTab.id);
    }
    if (!currentSectionExists) {
      setActiveSection(currentTab.items[0]?.id || "");
    }
  }, [panelTabs, activeTab, activeSection]);

  const currentPanelTab = panelTabs.find((tab) => tab.id === activeTab) || null;
  const isSectionActive = (sectionId) => activeSection === sectionId;

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=/admin");
      return;
    }

    const bootstrap = async () => {
      const me = user || (await refreshUser());
      if (!me || !canAccessAdminPanel(me.role)) {
        navigate("/");
        return;
      }
      setActiveUser(me);
      setReady(true);
    };

    bootstrap();
  }, [token, user, refreshUser, navigate]);

  const loadUsers = async () => {
    try {
      const filters = {};
      if (userFilters.name) filters.name = userFilters.name;
      if (userFilters.role) filters.role = userFilters.role;
      if (userFilters.status) filters.status = userFilters.status;

      const list = await getEmployeesAdmin(filters);
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

  const loadDashboard = async () => {
    if (!allowDashboard) return;
    try {
      setDashboardLoading(true);
      const filters = {};
      if (dashboardFilters.inicio) filters.inicio = dashboardFilters.inicio;
      if (dashboardFilters.fim) filters.fim = dashboardFilters.fim;
      const data = await getDashboardOverview(filters);
      setDashboardData(data || null);
    } catch (error) {
      setDashboardData(null);
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setDashboardLoading(false);
    }
  };

  const getUserPermissionArray = (userItem) =>
    Array.from(resolvePermissionSet(userItem)).sort((left, right) => left.localeCompare(right));

  const handleUserPermissionToggle = async (userItem, permissionKey, checked) => {
    const current = new Set(getUserPermissionArray(userItem));
    if (checked) current.add(permissionKey);
    else current.delete(permissionKey);

    try {
      await updateUserPermissions(userItem.username, Array.from(current));
      toast({ variant: "success", message: "Permissoes atualizadas." });
      loadUsers();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  const handleEmployeeCreate = async (event) => {
    event.preventDefault();

    const payload = {
      username: employeeForm.username.trim().toLowerCase(),
      name: employeeForm.name.trim(),
      email: employeeForm.email.trim().toLowerCase(),
      telefone: employeeForm.telefone.trim().replace(/\D/g, ""),
      password: employeeForm.password,
      role: employeeForm.role || Roles.FUNCIONARIO
    };

    if (!payload.username || !payload.name || !payload.email || !payload.password) {
      toast({ variant: "warning", message: "Preencha os campos obrigatorios do funcionario." });
      return;
    }

    try {
      await createEmployee(payload);
      setEmployeeForm({
        username: "",
        name: "",
        email: "",
        telefone: "",
        password: "",
        role: Roles.FUNCIONARIO
      });
      toast({ variant: "success", message: "Funcionario cadastrado com sucesso." });
      loadUsers();
      loadBarbers();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    }
  };

  useEffect(() => {
    if (!ready) return;

    const initialize = async () => {
      if (allowUsers) loadUsers();
      if (allowServices) loadServices();
      if (allowCommissions) {
        loadCommissions();
      }
      if (allowCash) {
        loadCash();
        loadCashClosings();
      }
      if (allowDashboard) {
        loadDashboard();
      }

      if (allowSchedule || allowIndisponibilidade || allowCash) {
        const loadedBarbers = await loadBarbers();
        const defaultBarber = indForm.barbeiroUsername || loadedBarbers[0]?.username;

        if (allowIndisponibilidade) {
          loadIndisponibilidades(defaultBarber);
        }
      }

      if (allowSchedule) {
        loadCalendarAppointments();
      }
    };

    initialize();
  }, [
    ready,
    allowUsers,
    allowServices,
    allowCommissions,
    allowCash,
    allowDashboard,
    allowSchedule,
    allowIndisponibilidade
  ]);

  useEffect(() => {
    if (!ready || !allowSchedule) return;
    loadCalendarAppointments();
  }, [ready, allowSchedule, calendarMonth, calendarBarberFilter]);

  const resetServiceForm = () => {
    setServiceForm({
      id: "",
      name: "",
      price: "",
      duration: "",
      percentualComissao: "50",
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
      percentualComissao: service.percentualComissao ?? "50",
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
    const percentualComissao = Number(String(serviceForm.percentualComissao).replace(",", "."));
    const status = serviceForm.status === "true";

    if (!name || !price || !duration || !Number.isFinite(percentualComissao)) {
      toast({ variant: "warning", message: "Preencha nome, preco, duracao e comissao." });
      return;
    }
    if (percentualComissao < 0 || percentualComissao > 100) {
      toast({ variant: "warning", message: "Comissao deve estar entre 0 e 100." });
      return;
    }

    try {
      if (serviceForm.id) {
        await updateService(serviceForm.id, {
          name,
          price,
          duracaoEmMinutos: duration,
          percentualComissao,
          status
        });
        if (serviceForm.file) await updateServiceImage(serviceForm.id, serviceForm.file);
        toast({ variant: "success", message: "Servico atualizado." });
      } else {
        if (serviceForm.file) {
          await createServiceWithImage(
            { name, price, duracaoEmMinutos: duration, percentualComissao },
            serviceForm.file
          );
        } else {
          await createService({ name, price, duracaoEmMinutos: duration, percentualComissao });
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
        observacao: ""
      }));
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setCashClosingLoading(false);
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

  const dashboardSeries = useMemo(
    () => (dashboardData?.serieDiaria || []).slice(-14),
    [dashboardData]
  );

  const maxDashboardEntrada = useMemo(() => {
    const values = dashboardSeries.map((item) => Number(item.entradas || 0));
    const maxValue = Math.max(0, ...values);
    return maxValue > 0 ? maxValue : 1;
  }, [dashboardSeries]);

  const handleCashFilter = () => {
    if (allowCash) {
      loadCash();
      loadCashClosings();
    }
    if (allowDashboard) {
      loadDashboard();
    }
  };

  const handleDashboardFilter = () => {
    loadDashboard();
  };

  const navLinks = [
    { label: "Servicos", href: "/#services" },
    { label: "Sobre", href: "/#about" },
    { label: "Informacoes", href: "/#info" },
    { label: "Avaliacoes", href: "/#reviews" },
    { label: "Painel", href: "/admin" }
  ];

  const panelTitle =
    activeRole === Roles.DONO
      ? "Painel do Dono"
      : activeRole === Roles.FUNCIONARIO
        ? "Painel do Funcionario"
        : "Painel Administrativo";

  const panelDescription =
    activeRole === Roles.FUNCIONARIO
      ? "Acesse somente os modulos liberados para seu nivel de acesso."
      : "Gestao de equipe, agenda, servicos, comissoes, caixa e indicadores.";

  return (
    <>
      <Header highlight="Painel" links={navLinks} />
      <main className="container admin-page">
        <section className="page-header" data-reveal>
          <h2>{panelTitle}</h2>
          <p>{panelDescription}</p>
        </section>

        <div className="admin-workspace" data-reveal="delay-1">
          <aside className="admin-sidenav panel">
            <strong>Modulos</strong>
            <div className="admin-sidenav-tabs">
              {panelTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`admin-sidenav-tab ${tab.id === activeTab ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActiveSection(tab.items[0]?.id || "");
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="admin-sidenav-subtabs">
              {(currentPanelTab?.items || []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-sidenav-subtab ${item.id === activeSection ? "is-active" : ""}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="admin-content">
        {allowDashboard && isSectionActive("dashboard") ? (
          <section className="panel" data-reveal="delay-1">
            <div className="panel-header">
              <h3>Dashboard de gestao</h3>
              <div className="panel-actions">
                <input
                  type="date"
                  value={dashboardFilters.inicio}
                  onChange={(event) =>
                    setDashboardFilters((prev) => ({ ...prev, inicio: event.target.value }))
                  }
                />
                <input
                  type="date"
                  value={dashboardFilters.fim}
                  onChange={(event) =>
                    setDashboardFilters((prev) => ({ ...prev, fim: event.target.value }))
                  }
                />
                <button className="ghost-action" type="button" onClick={handleDashboardFilter}>
                  Atualizar
                </button>
              </div>
            </div>

            <div className="panel-body">
              {dashboardLoading ? <p className="muted">Carregando indicadores...</p> : null}

              {dashboardData ? (
                <>
                  <div className="panel-summary">
                    <div className="summary-card">
                      <span>Agendamentos</span>
                      <strong>{dashboardData.totalAgendamentos || 0}</strong>
                    </div>
                    <div className="summary-card">
                      <span>Concluidos</span>
                      <strong>{dashboardData.totalConcluidos || 0}</strong>
                    </div>
                    <div className="summary-card">
                      <span>Saldo caixa</span>
                      <strong>{formatCurrency(dashboardData.saldoCaixa)}</strong>
                    </div>
                    <div className="summary-card">
                      <span>Ticket medio</span>
                      <strong>{formatCurrency(dashboardData.ticketMedio)}</strong>
                    </div>
                  </div>

                  <div className="dashboard-grid">
                    <article className="dashboard-card">
                      <h4>Entradas dos ultimos dias</h4>
                      {!dashboardSeries.length ? (
                        <p className="muted">Sem dados de serie diaria.</p>
                      ) : (
                        <div className="dashboard-bars">
                          {dashboardSeries.map((item) => {
                            const value = Number(item.entradas || 0);
                            const height = Math.max(8, Math.round((value / maxDashboardEntrada) * 100));
                            return (
                              <div key={item.data} className="dashboard-bar-item">
                                <div
                                  className="dashboard-bar"
                                  style={{ height: `${height}%` }}
                                  title={`${formatDateBr(item.data)}: ${formatCurrency(value)}`}
                                />
                                <small>{formatDateBr(item.data).slice(0, 5)}</small>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </article>

                    <article className="dashboard-card">
                      <h4>Ranking de funcionarios</h4>
                      {!dashboardData.rankingBarbeiros?.length ? (
                        <p className="muted">Sem ranking no periodo.</p>
                      ) : (
                        <div className="panel-list">
                          {dashboardData.rankingBarbeiros.slice(0, 5).map((item) => (
                            <article key={item.barbeiroUsername} className="row-card">
                              <div className="row-main">
                                <strong>{item.barbeiroNome || item.barbeiroUsername}</strong>
                                <span>@{item.barbeiroUsername}</span>
                              </div>
                              <div className="row-meta">
                                <span className="tag">Ag.: {item.agendamentos || 0}</span>
                                <span className="tag">Concl.: {item.concluidos || 0}</span>
                                <span className="tag">Fat.: {formatCurrency(item.faturamento)}</span>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </article>
                  </div>
                </>
              ) : !dashboardLoading ? (
                <p className="muted">Sem dados para o periodo informado.</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {allowSchedule && isSectionActive("agenda") ? (
        <section className="panel" data-reveal="delay-1">
          <div className="panel-header">
            <h3>Calendario global de agendamentos</h3>
            <div className="panel-actions">
              <select
                value={calendarBarberFilter}
                onChange={(event) => setCalendarBarberFilter(event.target.value)}
              >
                <option value="">Todos os funcionarios</option>
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
                        <span>Funcionario: {appointment.barbeiroUsername || "-"}</span>
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
        ) : null}

        {allowUsers && isSectionActive("funcionarios") ? (
        <section className="panel" data-reveal="delay-2">
          <div className="panel-header">
            <h3>Funcionarios</h3>
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
                <option value="">Todos os cargos</option>
                <option value="DONO">DONO</option>
                <option value="FUNCIONARIO">FUNCIONARIO</option>
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
            <form className="panel-form" onSubmit={handleEmployeeCreate}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="employee-username">Username</label>
                  <input
                    id="employee-username"
                    type="text"
                    required
                    value={employeeForm.username}
                    onChange={(event) =>
                      setEmployeeForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="employee-name">Nome</label>
                  <input
                    id="employee-name"
                    type="text"
                    required
                    value={employeeForm.name}
                    onChange={(event) =>
                      setEmployeeForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="employee-email">Email</label>
                  <input
                    id="employee-email"
                    type="email"
                    required
                    value={employeeForm.email}
                    onChange={(event) =>
                      setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="employee-telefone">Telefone</label>
                  <input
                    id="employee-telefone"
                    type="tel"
                    value={employeeForm.telefone}
                    onChange={(event) =>
                      setEmployeeForm((prev) => ({ ...prev, telefone: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="employee-password">Senha inicial</label>
                  <input
                    id="employee-password"
                    type="password"
                    minLength={8}
                    required
                    value={employeeForm.password}
                    onChange={(event) =>
                      setEmployeeForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="employee-role">Cargo</label>
                  <select
                    id="employee-role"
                    value={employeeForm.role}
                    onChange={(event) =>
                      setEmployeeForm((prev) => ({ ...prev, role: event.target.value }))
                    }
                  >
                    {activeRole === Roles.ADMIN ? <option value="DONO">DONO</option> : null}
                    <option value="FUNCIONARIO">FUNCIONARIO</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="primary-action" type="submit">
                  Adicionar funcionario
                </button>
              </div>
            </form>

            {!users.length ? (
              <p className="muted">Nenhum funcionario encontrado.</p>
            ) : (
              <div className="panel-list">
                {users.map((userItem) => {
                  const userPermissions = getUserPermissionArray(userItem);
                  const roleDefaults = new Set(getRoleDefaultPermissions(userItem.role));
                  const editablePermissions =
                    allowUserPermissionChange && normalizeRole(userItem.role) !== Roles.ADMIN;

                  return (
                    <article key={userItem.username} className="row-card">
                      <div className="row-main">
                        <strong>{userItem.name}</strong>
                        <span>@{userItem.username}</span>
                        <span>{userItem.email}</span>
                      </div>

                      <div className="row-meta">
                        <span className="tag">{formatRoleLabel(userItem.role)}</span>
                        <span className={`tag ${userItem.status ? "tag--success" : "tag--danger"}`}>
                          {userItem.status ? "Ativo" : "Inativo"}
                        </span>
                        <span className="tag">Acessos: {userPermissions.length}</span>
                      </div>

                      <div className="row-actions">
                        {allowUserRoleChange ? (
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
                            <option value="DONO" disabled={activeRole !== Roles.ADMIN}>
                              DONO
                            </option>
                            <option value="FUNCIONARIO">FUNCIONARIO</option>
                          </select>
                        ) : (
                          <span className="tag">{formatRoleLabel(userItem.role)}</span>
                        )}

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

                      {editablePermissions ? (
                        <div className="permissions-grid">
                          {permissionGroups.map((group) => (
                            <div key={`${userItem.username}-${group.title}`} className="permissions-group">
                              <strong>{group.title}</strong>
                              <div className="permissions-checks">
                                {group.items.map((permission) => {
                                  const checked = userPermissions.includes(permission.key);
                                  const isRequiredByRole = roleDefaults.has(permission.key);
                                  return (
                                    <label key={`${userItem.username}-${permission.key}`} className="inline-check">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={isRequiredByRole}
                                        onChange={(event) =>
                                          handleUserPermissionToggle(
                                            userItem,
                                            permission.key,
                                            event.target.checked
                                          )
                                        }
                                      />
                                      {permission.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
            {usersEmpty ? <p className="muted">Sem resultados para os filtros de funcionarios.</p> : null}
          </div>
        </section>
        ) : null}

        {allowServices && isSectionActive("servicos") ? (
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
                  <label htmlFor="service-commission">Comissao (%)</label>
                  <input
                    id="service-commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="50"
                    required
                    value={serviceForm.percentualComissao}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, percentualComissao: event.target.value }))
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
                      <span>Comissao: {service.percentualComissao ?? 50}%</span>
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
        ) : null}

        {allowIndisponibilidade && isSectionActive("indisponibilidade") ? (
        <section className="panel" data-reveal="delay-4">
          <div className="panel-header">
            <h3>Indisponibilidades</h3>
            <p className="muted">Registre periodos sem atendimento por funcionario.</p>
          </div>

          <div className="panel-body">
            <form className="panel-form" onSubmit={handleIndisponibilidadeSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="ind-barbeiro">Funcionario</label>
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
                    <option value="">Selecione um funcionario</option>
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
            {indisponibilidadesEmpty ? <p className="muted">Sem resultados para o funcionario.</p> : null}
          </div>
        </section>
        ) : null}

        {allowCommissions && isSectionActive("comissoes") ? (
        <section className="panel" data-reveal="delay-5">
          <div className="panel-header">
            <h3>Comissoes</h3>
            <p className="muted">A taxa base e definida em cada servico.</p>
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
        ) : null}

        {allowCash && isSectionActive("caixa") ? (
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
                                  ? "Sem funcionario"
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
                      <p className="muted">Sem lancamentos no periodo para detalhar por funcionario.</p>
                    )}

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
                  <label htmlFor="cash-barbeiro">Funcionario</label>
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
                      <span>{item.barbeiroUsername ? `@${item.barbeiroUsername}` : "Sem funcionario"}</span>
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
                              ? `Funcionario: ${formatCurrency(item.valorBarbeiro)}`
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
        ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Admin;
