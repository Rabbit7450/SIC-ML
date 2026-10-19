import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Ajustes" subtitle="Paleta Amber Forest y stack gratis" />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <Card>
          <p className="font-display text-lg">Paleta</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ["Primario", "#F59E0B"],
              ["Primario oscuro", "#D97706"],
              ["Secundario", "#10B981"],
              ["Acento", "#F43F5E"],
              ["Fondo dark", "#1C1917"],
              ["Fondo light", "#FFFBEB"],
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
