import { AlertTriangle, CircleCheck, Database } from "lucide-react";

type DataState = "demo" | "connected" | "error";

export function DataState({ state, message }: { state: DataState; message?: string }) {
  const copy = {
    demo: {
      Icon: Database,
      title: "Sin registros todavía",
      detail: "No se muestran datos ficticios. Crea registros o conecta un origen de telemetría.",
      style: "border-primary/25 bg-primary/5 text-primary",
    },
    connected: {
      Icon: CircleCheck,
      title: "Datos de PostgreSQL",
      detail: "Los registros de esta vista se consultan desde la base de datos local.",
      style: "border-secondary/25 bg-secondary/5 text-secondary",
    },
    error: {
      Icon: AlertTriangle,
      title: "No se pudo consultar PostgreSQL",
      detail: message ?? "Verifica el esquema y la conexión del servidor.",
      style: "border-warning/30 bg-warning/5 text-warning",
    },
  }[state];
  const Icon = copy.Icon;

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${copy.style}`} role="status">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium">{copy.title}</p>
        <p className="mt-0.5 text-foreground/75">{copy.detail}</p>
      </div>
    </div>
  );
}
