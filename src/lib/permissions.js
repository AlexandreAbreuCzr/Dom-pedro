const Roles = {
  ADMIN: "ADMIN",
  DONO: "DONO",
  FUNCIONARIO: "FUNCIONARIO",
  USER: "USER"
};

const Permissions = {
  DASHBOARD_VISUALIZAR: "DASHBOARD_VISUALIZAR",
  USUARIOS_VISUALIZAR: "USUARIOS_VISUALIZAR",
  USUARIOS_GERIR: "USUARIOS_GERIR",
  USUARIOS_ALTERAR_ROLE: "USUARIOS_ALTERAR_ROLE",
  USUARIOS_ALTERAR_PERMISSOES: "USUARIOS_ALTERAR_PERMISSOES",
  AGENDA_GERIR: "AGENDA_GERIR",
  SERVICOS_GERIR: "SERVICOS_GERIR",
  INDISPONIBILIDADE_GERIR: "INDISPONIBILIDADE_GERIR",
  COMISSOES_GERIR: "COMISSOES_GERIR",
  CAIXA_GERIR: "CAIXA_GERIR"
};

const allPermissions = Object.values(Permissions);

const roleDefaults = {
  [Roles.ADMIN]: allPermissions,
  [Roles.DONO]: [
    Permissions.DASHBOARD_VISUALIZAR,
    Permissions.USUARIOS_VISUALIZAR,
    Permissions.USUARIOS_GERIR,
    Permissions.USUARIOS_ALTERAR_ROLE,
    Permissions.USUARIOS_ALTERAR_PERMISSOES,
    Permissions.AGENDA_GERIR,
    Permissions.SERVICOS_GERIR,
    Permissions.INDISPONIBILIDADE_GERIR,
    Permissions.COMISSOES_GERIR,
    Permissions.CAIXA_GERIR
  ],
  [Roles.FUNCIONARIO]: [Permissions.AGENDA_GERIR],
  [Roles.USER]: []
};

const normalizeRole = (role) => String(role || "").trim().toUpperCase();

const toPermissionList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim().toUpperCase())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
};

const resolveRole = (context) => {
  if (typeof context === "string") return normalizeRole(context);
  if (context && typeof context === "object") return normalizeRole(context.role);
  return "";
};

const resolvePermissionSet = (context) => {
  const role = resolveRole(context);
  const explicitList =
    context && typeof context === "object"
      ? toPermissionList(context.permissoes || context.permissions || [])
      : [];

  const source = explicitList.length ? explicitList : roleDefaults[role] || [];
  return new Set(source);
};

const getRoleDefaultPermissions = (context) => {
  const role = resolveRole(context);
  return [...(roleDefaults[role] || [])];
};

const hasPermission = (context, permission) =>
  resolvePermissionSet(context).has(String(permission || "").toUpperCase());

const isOneOf = (context, ...allowed) => {
  const role = resolveRole(context);
  return allowed.map(normalizeRole).includes(role);
};

const canAccessAdminPanel = (context) =>
  isOneOf(context, Roles.ADMIN, Roles.DONO, Roles.FUNCIONARIO);

const canManageUsers = (context) => hasPermission(context, Permissions.USUARIOS_GERIR);

const canManageUserRoles = (context) => hasPermission(context, Permissions.USUARIOS_ALTERAR_ROLE);

const canManageUserPermissions = (context) =>
  hasPermission(context, Permissions.USUARIOS_ALTERAR_PERMISSOES);

const canManageServices = (context) => hasPermission(context, Permissions.SERVICOS_GERIR);

const canManageSchedule = (context) => hasPermission(context, Permissions.AGENDA_GERIR);

const canManageIndisponibilidade = (context) =>
  hasPermission(context, Permissions.INDISPONIBILIDADE_GERIR);

const canManageCommissions = (context) => hasPermission(context, Permissions.COMISSOES_GERIR);

const canManageCash = (context) => hasPermission(context, Permissions.CAIXA_GERIR);

const canViewBusinessDashboard = (context) =>
  hasPermission(context, Permissions.DASHBOARD_VISUALIZAR);

const canAccessBarberPanel = (context) => canAccessAdminPanel(context);

export {
  Roles,
  Permissions,
  allPermissions,
  normalizeRole,
  getRoleDefaultPermissions,
  resolvePermissionSet,
  hasPermission,
  canAccessAdminPanel,
  canManageUsers,
  canManageUserRoles,
  canManageUserPermissions,
  canManageServices,
  canManageSchedule,
  canManageIndisponibilidade,
  canManageCommissions,
  canManageCash,
  canViewBusinessDashboard,
  canAccessBarberPanel
};
