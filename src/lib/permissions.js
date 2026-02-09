const Roles = {
  ADMIN: "ADMIN",
  GERENTE: "GERENTE",
  RECEPCIONISTA: "RECEPCIONISTA",
  BARBEIRO: "BARBEIRO",
  USER: "USER"
};

const normalizeRole = (role) => String(role || "").trim().toUpperCase();

const isOneOf = (role, ...allowed) => {
  const normalized = normalizeRole(role);
  return allowed.includes(normalized);
};

const canAccessAdminPanel = (role) =>
  isOneOf(role, Roles.ADMIN, Roles.GERENTE, Roles.RECEPCIONISTA);

const canManageUsers = (role) => isOneOf(role, Roles.ADMIN, Roles.GERENTE);

const canManageUserRoles = (role) => isOneOf(role, Roles.ADMIN);

const canManageServices = (role) => isOneOf(role, Roles.ADMIN, Roles.GERENTE);

const canManageSchedule = (role) =>
  isOneOf(role, Roles.ADMIN, Roles.GERENTE, Roles.RECEPCIONISTA);

const canManageIndisponibilidade = (role) =>
  isOneOf(role, Roles.ADMIN, Roles.GERENTE);

const canManageCommissions = (role) => isOneOf(role, Roles.ADMIN, Roles.GERENTE);

const canManageCash = (role) => isOneOf(role, Roles.ADMIN, Roles.GERENTE);

const canViewBusinessDashboard = (role) => isOneOf(role, Roles.ADMIN, Roles.GERENTE);

const canAccessBarberPanel = (role) => isOneOf(role, Roles.ADMIN, Roles.BARBEIRO);

export {
  Roles,
  normalizeRole,
  canAccessAdminPanel,
  canManageUsers,
  canManageUserRoles,
  canManageServices,
  canManageSchedule,
  canManageIndisponibilidade,
  canManageCommissions,
  canManageCash,
  canViewBusinessDashboard,
  canAccessBarberPanel
};
