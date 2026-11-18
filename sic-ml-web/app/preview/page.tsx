import Link from "next/link";
import { TreePine } from "lucide-react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoAlerts, demoDevices, demoModels } from "@/lib/demo-data";
import { ROLE_META } from "@/lib/roles";
import { severityClass } from "@/lib/utils";

export default function PreviewPage() {
  const online = demoDevices.filter((device) => device.status === "online").length;
  const critical = demoAlerts.filter((alert) => alert.severity === "critica").length;
  const deployed = demoModels.filter((model) => model.is_deployed).length;

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <TreePine className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-lg leading-none">SIC-ML</p>
            <p className="mt-1 text-xs text-muted">Vista previa · sin sesión</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              Inicio
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Entrar</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Laboratorio en lectura</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Muestra pública con datos de ejemplo. No guarda cambios ni abre auditoría, equipo ni bajas.
          </p>
        </div>

        <KpiCards
          items={[
            { label: "Alertas activas", value: demoAlerts.length, accent: "border-l-primary" },
            { label: "Nodos online", value: online, accent: "border-l-secondary" },
            { label: "Modelos desplegados", value: deployed, accent: "border-l-muted" },
            { label: "Severidad crítica", value: critical, accent: "border-l-accent" },
          ]}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {(["admin", "analista", "viewer"] as const).map((role) => (
            <Card key={role}>
              <p className="font-display text-lg">{ROLE_META[role].label}</p>
              <p className="mt-2 text-sm text-muted">{ROLE_META[role].summary}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <p className="mb-4 font-display text-lg">Alertas recientes</p>
            <ul className="space-y-3">
              {demoAlerts.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-xl border border-border/80 bg-background-elevated/50 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <Badge className={severityClass(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {alert.module} · {alert.attack_type}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
          <div className="space-y-6">
            <Card>
              <p className="mb-4 font-display text-lg">Nodos</p>
              <ul className="space-y-2 text-sm">
                {demoDevices.map((device) => (
                  <li key={device.id} className="flex items-center justify-between gap-3">
                    <span>
                      {device.name}
                      <span className="ml-2 font-mono text-xs text-muted">{device.node_id}</span>
                    </span>
                    <span className={device.status === "online" ? "text-secondary" : "text-accent"}>
                      {device.status}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <p className="mb-4 font-display text-lg">Modelos</p>
              <ul className="space-y-2 text-sm">
                {demoModels.map((model) => (
                  <li key={model.id} className="flex items-center justify-between gap-3">
                    <span>{model.name}</span>
                    <span className="text-xs text-muted">
                      {model.is_deployed ? "desplegado" : "en reserva"}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
