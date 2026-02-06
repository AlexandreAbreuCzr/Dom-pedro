const defaultConfig = {
  baseUrl: "https://dom-pedro-api.onrender.com",
  endpoints: {
    login: "/auth/login",
    register: "/auth/register",
    passwordResetRequest: "/auth/password/forgot",
    passwordResetConfirm: "/auth/password/reset",
    services: "/servico",
    appointments: "/agendamento",
    myAppointments: "/agendamento/me",
    cancelAppointment: (id) => `/agendamento/${id}/cancelar`,
    acceptAppointment: (id) => `/agendamento/${id}/aceitar`,
    concludeAppointment: (id) => `/agendamento/${id}/concluir`,
    me: "/usuario/me",
    barbers: "/usuario/barbeiros",
    usersAdmin: "/usuario/admin",
    indisponibilidade: "/indisponibilidade",
    commissions: "/comissao",
    cash: "/caixa",
    reviews: "/avaliacao"
  },
  storageKeys: {
    token: "barberia_token",
    user: "barberia_user"
  },
  payloads: {
    login: ({ login, password }) => ({ login, password }),
    register: ({ username, name, email, telefone, password, role = "USER" }) => ({
      username,
      name,
      email,
      telefone,
      password,
      role
    }),
    passwordResetRequest: ({ email }) => ({ email }),
    passwordResetConfirm: ({ email, code, newPassword }) => ({ email, code, newPassword }),
    appointment: ({ clienteUsername, barbeiroUsername, servicoId, data, hora }) => ({
      clienteUsername,
      barbeiroUsername: barbeiroUsername || null,
      servicoId,
      data,
      hora
    }),
    appointmentUpdate: ({ data, hora }) => ({ data, hora }),
    userStatus: ({ status }) => ({ status }),
    userRole: ({ role }) => ({ role }),
    serviceCreate: ({ name, price, duracaoEmMinutos }) => ({
      name,
      price,
      duracaoEmMinutos
    }),
    serviceUpdate: ({ name, price, duracaoEmMinutos, status }) => ({
      name,
      price,
      duracaoEmMinutos,
      status
    }),
    indisponibilidadeCreate: ({ barbeiroUsername, tipo, inicio, fim }) => ({
      barbeiroUsername,
      tipo,
      inicio,
      fim
    }),
    meUpdate: ({ name, telefone, password }) => ({ name, telefone, password }),
    reviewCreate: ({ nome, nota, comentario }) => ({ nome, nota, comentario })
  }
};

const mergeConfig = (overrides = {}) => ({
  ...defaultConfig,
  ...overrides,
  endpoints: { ...defaultConfig.endpoints, ...(overrides.endpoints || {}) },
  storageKeys: { ...defaultConfig.storageKeys, ...(overrides.storageKeys || {}) },
  payloads: { ...defaultConfig.payloads, ...(overrides.payloads || {}) }
});

const config = mergeConfig({
  baseUrl: import.meta.env.VITE_API_BASE_URL || defaultConfig.baseUrl,
  ...(typeof window !== "undefined" ? window.BARBERIA_API_CONFIG : {})
});

const getToken = () => localStorage.getItem(config.storageKeys.token);
const setToken = (token) => {
  if (token) localStorage.setItem(config.storageKeys.token, token);
};
const clearToken = () => localStorage.removeItem(config.storageKeys.token);

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(config.storageKeys.user));
  } catch (error) {
    return null;
  }
};
const setUser = (user) => {
  if (user) localStorage.setItem(config.storageKeys.user, JSON.stringify(user));
};
const clearUser = () => localStorage.removeItem(config.storageKeys.user);
const clearSession = () => {
  clearToken();
  clearUser();
};

const parsePrice = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.,-]/g, "").trim();
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;

  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = cleaned.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatCurrency = (value) => {
  const parsed = parsePrice(value);
  const numberValue = parsed === null ? 0 : parsed;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(numberValue);
};

const formatDateBr = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
};

const normalizeService = (service = {}) => {
  const name = service.name || service.nome || service.titulo || service.descricao;
  const price = parsePrice(service.price ?? service.preco ?? service.valor) ?? 0;
  const status = service.status ?? service.ativo;
  return {
    id: service.id || service.codigo || service.servicoId || name,
    name,
    description: service.descricao || service.description || "Serviço premium Dom Pedro.",
    price,
    status,
    imageUrl: service.imageUrl || service.imagemUrl || service.image || service.imagem,
    duracaoEmMinutos:
      service.duracaoEmMinutos ||
      service.duracaoMediaEmMinutos ||
      service.duracao ||
      null
  };
};

const normalizeAppointment = (appointment = {}) => {
  const service = appointment.servico || appointment.service || {};
  const dateTime = appointment.dataHora || appointment.dateTime || appointment.data_hora;
  const date = appointment.data || appointment.date || (dateTime ? dateTime.split("T")[0] : "");
  const time = appointment.hora || appointment.time || (dateTime ? dateTime.split("T")[1] : "");

  return {
    id: appointment.id || appointment.codigo || appointment.agendamentoId || appointment.uuid,
    serviceId: appointment.servicoId || appointment.serviceId || service.id,
    clienteUsername: appointment.clienteUsername || appointment.cliente || appointment.clienteUserName,
    barbeiroUsername: appointment.barbeiroUsername || appointment.barbeiro || appointment.barbeiroUserName,
    serviceName:
      appointment.servicoNome ||
      appointment.nomeServico ||
      appointment.serviceName ||
      service.nome ||
      service.name ||
      "Agendamento",
    date,
    time: formatTime(time),
    status:
      appointment.agendamentoStatus ||
      appointment.status ||
      appointment.situacao ||
      appointment.estado ||
      "REQUISITADO"
  };
};

const normalizeBarber = (user = {}) => ({
  username: user.username || user.userName || user.login,
  name: user.name || user.nome || user.username || user.userName || user.login || ""
});

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => "");
};

const apiRequest = async (path, options = {}) => {
  const url = `${config.baseUrl.replace(/\/$/, "")}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const token = getToken();
  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await parseResponse(response);
  if (!response.ok) {
    throw { status: response.status, data };
  }
  return data;
};

const apiRequestForm = async (path, formData, options = {}) => {
  const url = `${config.baseUrl.replace(/\/$/, "")}${path}`;
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method || "POST",
    headers,
    body: formData
  });

  const data = await parseResponse(response);
  if (!response.ok) {
    throw { status: response.status, data };
  }
  return data;
};

const extractToken = (data) => data?.token || data?.accessToken || data?.jwt || data?.data?.token;

const login = async (credentials) => {
  const payload = config.payloads.login(credentials);
  const data = await apiRequest(config.endpoints.login, {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false
  });
  const token = extractToken(data);
  if (token) setToken(token);
  try {
    const me = await apiRequest(config.endpoints.me, { method: "GET" });
    if (me) setUser(me);
  } catch (error) {
    if (credentials?.login) setUser({ username: credentials.login });
  }
  return data;
};

const register = async (payload) =>
  apiRequest(config.endpoints.register, {
    method: "POST",
    body: JSON.stringify(config.payloads.register(payload)),
    auth: false
  });

const requestPasswordReset = (payload) =>
  apiRequest(config.endpoints.passwordResetRequest, {
    method: "POST",
    body: JSON.stringify(config.payloads.passwordResetRequest(payload)),
    auth: false
  });

const resetPassword = (payload) =>
  apiRequest(config.endpoints.passwordResetConfirm, {
    method: "POST",
    body: JSON.stringify(config.payloads.passwordResetConfirm(payload)),
    auth: false
  });

const getServices = () => apiRequest(config.endpoints.services, { method: "GET", auth: false });

const getMe = () => apiRequest(config.endpoints.me, { method: "GET" });

const updateMe = (payload) =>
  apiRequest(config.endpoints.me, {
    method: "PATCH",
    body: JSON.stringify(config.payloads.meUpdate(payload))
  });

const getBarbers = async () => {
  const data = await apiRequest(config.endpoints.barbers, { method: "GET", auth: false });
  const list = Array.isArray(data) ? data : data?.content || data?.usuarios || [];
  return list;
};

const createAppointment = (payload) =>
  apiRequest(config.endpoints.appointments, {
    method: "POST",
    body: JSON.stringify(config.payloads.appointment(payload))
  });

const updateAppointment = (id, payload) =>
  apiRequest(`${config.endpoints.appointments}/${id}`, {
    method: "PUT",
    body: JSON.stringify(config.payloads.appointmentUpdate(payload))
  });

const cancelAppointment = (id) =>
  apiRequest(config.endpoints.cancelAppointment(id), { method: "PATCH" });

const getMyAppointments = () => apiRequest(config.endpoints.myAppointments, { method: "GET" });

const getAppointments = (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString();
  return apiRequest(`${config.endpoints.appointments}${query ? `?${query}` : ""}`, {
    method: "GET"
  });
};

const acceptAppointment = (id) =>
  apiRequest(config.endpoints.acceptAppointment(id), { method: "PATCH" });

const concludeAppointment = (id) =>
  apiRequest(config.endpoints.concludeAppointment(id), { method: "PATCH" });

const getUsersAdmin = (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString();
  return apiRequest(`${config.endpoints.usersAdmin}${query ? `?${query}` : ""}`, {
    method: "GET"
  });
};

const updateUserStatus = (username, status) =>
  apiRequest(`${config.endpoints.usersAdmin}/${username}/status`, {
    method: "PATCH",
    body: JSON.stringify(config.payloads.userStatus({ status }))
  });

const updateUserRole = (username, role) =>
  apiRequest(`${config.endpoints.usersAdmin}/${username}/role`, {
    method: "PATCH",
    body: JSON.stringify(config.payloads.userRole({ role }))
  });

const createService = (payload) =>
  apiRequest(config.endpoints.services, {
    method: "POST",
    body: JSON.stringify(config.payloads.serviceCreate(payload))
  });

const createServiceWithImage = (payload, file) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("price", payload.price);
  formData.append("duracaoEmMinutos", payload.duracaoEmMinutos);
  if (file) formData.append("image", file);
  return apiRequestForm(config.endpoints.services, formData, { method: "POST" });
};

const updateService = (id, payload) =>
  apiRequest(`${config.endpoints.services}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(config.payloads.serviceUpdate(payload))
  });

const updateServiceImage = (id, file) => {
  const formData = new FormData();
  formData.append("image", file);
  return apiRequestForm(`${config.endpoints.services}/${id}/imagem`, formData, {
    method: "PATCH"
  });
};

const deleteService = (id) => apiRequest(`${config.endpoints.services}/${id}`, { method: "DELETE" });

const getIndisponibilidades = (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString();
  return apiRequest(`${config.endpoints.indisponibilidade}${query ? `?${query}` : ""}`, {
    method: "GET"
  });
};

const createIndisponibilidade = (payload) =>
  apiRequest(config.endpoints.indisponibilidade, {
    method: "POST",
    body: JSON.stringify(config.payloads.indisponibilidadeCreate(payload))
  });

const deleteIndisponibilidade = (id) =>
  apiRequest(`${config.endpoints.indisponibilidade}/${id}`, { method: "DELETE" });

const getCommissions = (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString();
  return apiRequest(`${config.endpoints.commissions}${query ? `?${query}` : ""}`, {
    method: "GET"
  });
};

const updateCommission = (id, payload) =>
  apiRequest(`${config.endpoints.commissions}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

const getCommissionRate = () =>
  apiRequest(`${config.endpoints.commissions}/taxa`, {
    method: "GET"
  });

const updateCommissionRate = (payload) =>
  apiRequest(`${config.endpoints.commissions}/taxa`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

const getCash = (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString();
  return apiRequest(`${config.endpoints.cash}${query ? `?${query}` : ""}`, {
    method: "GET"
  });
};

const createCashEntry = (payload) =>
  apiRequest(config.endpoints.cash, {
    method: "POST",
    body: JSON.stringify(payload)
  });

const getReviews = () =>
  apiRequest(config.endpoints.reviews, {
    method: "GET",
    auth: false
  });

const createReview = (payload) =>
  apiRequest(config.endpoints.reviews, {
    method: "POST",
    body: JSON.stringify(config.payloads.reviewCreate(payload)),
    auth: false
  });

const getErrorMessage = (error) => {
  if (!error) return "Erro inesperado.";
  if (typeof error === "string") return error;
  const data = error.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors)) {
    return data.errors.map((item) => item.message || item).join(", ");
  }
  return "Não foi possível concluir. Tente novamente.";
};

export {
  config,
  login,
  register,
  requestPasswordReset,
  resetPassword,
  getServices,
  getMe,
  updateMe,
  getBarbers,
  getUsersAdmin,
  updateUserStatus,
  updateUserRole,
  createService,
  updateService,
  createServiceWithImage,
  updateServiceImage,
  deleteService,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getMyAppointments,
  getAppointments,
  acceptAppointment,
  concludeAppointment,
  getIndisponibilidades,
  createIndisponibilidade,
  deleteIndisponibilidade,
  getCommissions,
  updateCommission,
  getCommissionRate,
  updateCommissionRate,
  getCash,
  createCashEntry,
  getReviews,
  createReview,
  getToken,
  setToken,
  clearSession,
  getUser,
  setUser,
  normalizeService,
  normalizeAppointment,
  normalizeBarber,
  formatCurrency,
  formatDateBr,
  formatTime,
  getErrorMessage
};
