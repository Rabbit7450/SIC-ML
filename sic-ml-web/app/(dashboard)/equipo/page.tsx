import { DatabaseBackup } from "lucide-react";
import { AccessDenied } from "@/components/layout/access-denied";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { UsersAdmin } from "@/components/team/users-admin";
import { getAppRole } from "@/lib/current-role";
import { canHardDelete } from "@/lib/roles";

export default async function TeamPage() {
  const { role } = await getAppRole();
  if (!canHardDelete(role)) return <AccessDenied title="Administración de usuarios" description="Solo una cuenta administradora puede crear, editar o dar de baja usuarios." />;
  return (
    <>
      <Topbar title="Administración de usuarios" subtitle="Gestiona cuentas locales, roles, contraseñas, bajas lógicas y backups." />
      <div className="space-y-5 p-6">
        <UsersAdmin />
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-display text-lg">
                <DatabaseBackup className="h-5 w-5 text-primary" aria-hidden="true" />
                Backup de PostgreSQL
              </p>
              <p className="mt-1 max-w-xl text-sm text-muted">
                Descarga un dump SQL completo de la base <code>sic_ml</code> (tablas, vistas, datos y soft delete).
                Para restaurar: <code>psql -d sic_ml -f backup.sql</code>.
              </p>
            </div>
            <a
              href="/api/admin/backup"
              download
              aria-label="Descargar backup completo de la base de datos en formato SQL"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-background-elevated focus-visible:outline-2 focus-visible:outline-primary"
            >
              <DatabaseBackup className="h-4 w-4" aria-hidden="true" />
              Descargar backup (.sql)
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}

