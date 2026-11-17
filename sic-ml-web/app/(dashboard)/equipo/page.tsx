import { AccessDenied } from "@/components/layout/access-denied";
import { Topbar } from "@/components/layout/topbar";
import { UsersAdmin } from "@/components/team/users-admin";
import { getAppRole } from "@/lib/current-role";
import { canHardDelete } from "@/lib/roles";

export default async function TeamPage() {
  const { role } = await getAppRole();
  if (!canHardDelete(role)) return <AccessDenied title="Administración de usuarios" description="Solo una cuenta administradora puede crear, editar o dar de baja usuarios." />;
  return <><Topbar title="Administración de usuarios" subtitle="Gestiona cuentas locales, roles, contraseñas y bajas lógicas." /><div className="space-y-5 p-6"><UsersAdmin /></div></>;
}
