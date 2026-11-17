import Link from "next/link";
import { desc, isNull } from "drizzle-orm";
import { Topbar } from "@/components/layout/topbar";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { EventsChart } from "@/components/dashboard/events-chart";
import { FadeIn } from "@/components/animations/fade-in";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAppRole } from "@/lib/current-role";
import { demoAlerts, demoDevices, demoModels, chartSeries } from "@/lib/demo-data";
import { ROLE_META } from "@/lib/roles";
import { severityClass } from "@/lib/utils";
import { DataState } from "@/components/layout/data-state";
import { getDb, alerts as alertsTable, devices as devicesTable, models as modelsTable } from "@/lib/db";

export default async function DashboardPage() {
  const connected = Boolean(process.env.DATABASE_URL);
  let alerts = connected ? [] : demoAlerts;
  let devices = connected ? [] : demoDevices;
  let models = connected ? [] : demoModels;
  let state: "demo" | "connected" | "error" = connected ? "connected" : "demo";

  if (connected) try {
    const db = getDb();
    const [a, d, m] = await Promise.all([
      db.select().from(alertsTable).where(isNull(alertsTable.deleted_at)).orderBy(desc(alertsTable.created_at)).limit(1000),
      db.select().from(devicesTable).where(isNull(devicesTable.deleted_at)),
      db.select().from(modelsTable).where(isNull(modelsTable.deleted_at)),
    ]);
    alerts = a as unknown as typeof demoAlerts;
    devices = d as unknown as typeof demoDevices;
    models = m as unknown as typeof demoModels;
  } catch {
    state = "error";
    alerts = [];
    devices = [];
    models = [];
  }

  const chartData = state === "demo" ? chartSeries : buildEventSeries(alerts);

  const online = devices.filter((d) => d.status === "online").length;
  const critical = alerts.filter((a) => a.severity === "critica").length;
  const deployed = models.filter((m) => m.is_deployed).length;
  const { role } = await getAppRole();
  const meta = ROLE_META[role];

  return (
    <>
      <Topbar
        title={`Dashboard · ${meta.label}`}
        subtitle={meta.summary}
      />
      <div className="space-y-6 overflow-y-auto p-6">
        <DataState state={state} />
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Enfoque del rol</p>
            <p className="mt-1 font-display text-lg">{meta.focus}</p>
          </div>
          {role === "admin" ? (
            <Link href="/equipo" className="text-sm text-primary hover:underline">
              Gestionar equipo
            </Link>
          ) : role === "analista" ? (
            <Link href="/alerts" className="text-sm text-primary hover:underline">
              Abrir cola de alertas
            </Link>
          ) : (
            <p className="text-sm text-muted">Las acciones de escritura están ocultas.</p>
          )}
        </Card>
        <KpiCards
          alerts={alerts.length}
          devicesOnline={online}
          modelsDeployed={deployed}
          critical={critical}
        />
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <FadeIn delay={0.1}>
              <EventsChart data={chartData} />
            </FadeIn>
          </div>
          <div className="xl:col-span-2">
            <FadeIn delay={0.16}>
              <Card className="h-full">
                <p className="mb-4 font-display text-lg">Feed de alertas</p>
                {alerts.length ? <ul className="space-y-3">
                  {alerts.slice(0, 6).map((alert) => (
                    <li
                      key={alert.id}
                      className="rounded-xl border border-border/80 bg-background-elevated/50 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <Badge className={severityClass(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {alert.module} · {alert.attack_type ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul> : <p className="text-sm text-muted">{state === "error" ? "No se pudo cargar el feed." : "No hay alertas recientes."}</p>}
              </Card>
            </FadeIn>
          </div>
        </div>
      </div>
    </>
  );
}

function buildEventSeries(alerts: typeof demoAlerts) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });

  return days.map((day) => {
    const key = day.toDateString();
    const point = { name: new Intl.DateTimeFormat("es", { weekday: "short" }).format(day), ids: 0, iot: 0, phishing: 0 };
    for (const alert of alerts) {
      if (new Date(alert.created_at).toDateString() !== key) continue;
      if (alert.module === "ids") point.ids += 1;
      else if (alert.module === "iot") point.iot += 1;
      else if (alert.module === "phishing") point.phishing += 1;
    }
    return point;
  });
}
