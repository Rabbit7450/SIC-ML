export const APP_ROLES = ["admin", "analista", "viewer"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const roleLabel: Record<AppRole, string> = {
  admin: "Admin",
  analista: "Analista",
  viewer: "Viewer",
};

export type NavHref =
  | "/dashboard"
  | "/alerts"
  | "/devices"
  | "/phishing"
  | "/models"
  | "/reports"
  | "/audit"
  | "/equipo"
  | "/settings";

export const ROLE_META: Record<
  AppRole,
  { label: string; summary: string; focus: string }
> = {
  admin: {
    label: "Admin",
    summary: "Gobierno del laboratorio: equipo, bajas físicas y ajustes.",
    focus: "Usuarios, auditoría y borrado permanente",
  },
  analista: {
    label: "Analista",
    summary: "Triage y respuesta: alertas, nodos, escaneos y modelos.",
    focus: "Altas, bajas lógicas y análisis",
  },
  viewer: {
    label: "Viewer",
    summary: "Consulta de solo lectura del estado del laboratorio.",
    focus: "Dashboard, alertas y dispositivos",
  },
};

const NAV: Array<{ href: NavHref; label: string; roles: AppRole[] }> = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "analista", "viewer"] },
  { href: "/alerts", label: "Alertas IDS", roles: ["admin", "analista", "viewer"] },
  { href: "/devices", label: "Dispositivos IoT", roles: ["admin", "analista", "viewer"] },
  { href: "/phishing", label: "Phishing", roles: ["admin", "analista", "viewer"] },
  { href: "/models", label: "Modelos ML", roles: ["admin", "analista", "viewer"] },
  { href: "/reports", label: "Informes", roles: ["admin", "analista", "viewer"] },
  { href: "/audit", label: "Auditoría", roles: ["admin", "analista"] },
  { href: "/equipo", label: "Equipo", roles: ["admin"] },
  { href: "/settings", label: "Ajustes", roles: ["admin", "analista", "viewer"] },
];

export function isAppRole(value: string | undefined | null): value is AppRole {
  return value === "admin" || value === "analista" || value === "viewer";
}

export function navForRole(role: AppRole) {
  return NAV.filter((item) => item.roles.includes(role));
}

export function canAccess(role: AppRole, href: string) {
  const item = NAV.find((entry) => href === entry.href || href.startsWith(`${entry.href}/`));
  if (!item) return true;
  return item.roles.includes(role);
}

export function canWrite(role: AppRole) {
  return role === "admin" || role === "analista";
}

export function canHardDelete(role: AppRole) {
  return role === "admin";
}

export const DEMO_ACCOUNTS: Array<{
  role: AppRole;
  email: string;
  password: string;
  name: string;
}> = [
  { role: "admin", email: "admin@lab.local", password: "admin123", name: "Ada Admin" },
  { role: "analista", email: "analista@lab.local", password: "analista123", name: "Leo Analista" },
  { role: "viewer", email: "viewer@lab.local", password: "viewer123", name: "Vera Viewer" },
];

export function roleFromEmail(email: string): AppRole {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  if (local.startsWith("admin")) return "admin";
  if (local.startsWith("viewer") || local.startsWith("visita")) return "viewer";
  return "analista";
}
