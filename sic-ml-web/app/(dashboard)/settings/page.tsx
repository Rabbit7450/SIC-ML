import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { getAppRole } from "@/lib/current-role";
import { ROLE_META } from "@/lib/roles";

export default async function SettingsPage() {
  const { role } = await getAppRole();
  return (
    <>
      <Topbar
        title="Ajustes"
        subtitle={`Sesión como ${ROLE_META[role].label}. ${ROLE_META[role].focus}.`}
      />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <Card>
          <p className="font-display text-lg">Paleta</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ["Azul pizarra", "#315B86"],
              ["Azul profundo", "#26496F"],
              ["Verde estado", "#377C69"],
              ["Rojo alerta", "#B54747"],
              ["Fondo", "#F4F6F8"],
              ["Superficie", "#FFFFFF"],
            ].map(([name, hex]) => (
              <div
                key={hex}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <span
                  className="h-8 w-8 rounded-lg border border-border"
                  style={{ background: hex }}
                />
                <div>
                  <p>{name}</p>
                  <p className="font-mono text-xs text-muted">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="font-display text-lg">Soft delete</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Alta → INSERT</li>
            <li>Baja lógica → deleted_at + is_active=false</li>
            <li>Restaurar → deleted_at=null + is_active=true</li>
            <li>Baja física → DELETE (solo admin + confirmación)</li>
            <li>Consultas → WHERE deleted_at IS NULL</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
