import Link from "next/link";
import { count, desc, isNull, sql } from "drizzle-orm";
import { Topbar } from "@/components/layout/topbar";
import { KpiCards, type KpiItem } from "@/components/dashboard/kpi-cards";
import { EventsChart } from "@/components/dashboard/events-chart";
import { SeverityChart, type SeverityPoint } from "@/components/dashboard/severity-chart";
import { AlertsFeed } from "@/components/dashboard/alerts-feed";
import { FadeIn } from "@/components/animations/fade-in";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAppRole } from "@/lib/current-role";
import { demoAlerts, demoDevices, demoModels, chartSeries } from "@/lib/demo-data";
import { ROLE_META } from "@/lib/roles";
import { severityClass } from "@/lib/utils";
import { DataState } from "@/components/layout/data-state";
import {
  getDb,
  alerts as alertsTable,
  devices as devicesTable,
  models as modelsTable,
  scans as scansTable,
  reports as reportsTable,
  auditLogs as auditLogsTable,
} from "@/lib/db";

type AlertRow = typeof demoAlerts;

export default async function DashboardPage() {
  const connected = Boolean(process.env.DATABASE_URL);
  let alerts: AlertRow = connected ? [] : demoAlerts;
  let devices = connected ? [] : demoDevices;
  let models = connected ? [] : demoModels;
  let scanCount = 0;
  let reportCount = 0;
  let auditRecent: Array<{ id: string; action: string; entity_table: string; created_at: Date; actor_email: string | null }> = [];
  let state: "demo" | "connected" | "error" = connected ? "connected" : "demo";

  if (connected) {
    try {
      const db = getDb();
      const [a, d, m, s, r, logs] = await Promise.all([
        db.select().from(alertsTable).where(isNull(alertsTable.deleted_at)).orderBy(desc(alertsTable.created_at)).limit(1000),
        db.select().from(devicesTable).where(isNull(devicesTable.deleted_at)),
        db.select().from(modelsTable).where(isNull(modelsTable.deleted_at)),
        db.select({ c: count() }).from(scansTable).where(isNull(scansTable.deleted_at)),
        db.select({ c: count() }).from(reportsTable).where(isNull(reportsTable.deleted_at)),
        db.execute(sql`
          SELECT a.id, a.action, a.entity_table, a.created_at, p.email AS actor_email
          FROM audit_logs a LEFT JOIN profiles p ON p.id = a.actor_id
          WHERE a.deleted_at IS NULL ORDER BY a.created_at DESC LIMIT 8
        `),
      ]);
      alerts = a as unknown as AlertRow;
      devices = d as unknown as typeof demoDevices;
      models = m as unknown as typeof demoModels;
      scanCount = Number((s[0] as { c: number | string }).c);
      reportCount = Number((r[0] as { c: number | string }).c);
      auditRecent = logs as unknown as typeof auditRecent;
    } catch {
      state = "error";
      alerts = [];
      devices = [];
      models = [];
    }
  }

  const chartData = state === "demo" ? chartSeries : buildEventSeries(alerts);
  const severityData: SeverityPoint[] = buildSeveritySeries(alerts);

  const online = devices.filter((d) => d.status === "online").length;
  const offline = devices.filter((d) => d.status === "offline").length;
  const critical = alerts.filter((a) => a.severity === "critica").length;
  const deployed = models.filter((m) => m.is_deployed);
  const activeModel = deployed[0];
  const audit24h = auditRecent.length;

  const kpis: KpiItem[] = [
    { label: "Alertas activas", value: alerts.length, accent: "border-l-primary" },
    { label: "Severidad crítica", value: critical, accent: "border-l-accent" },
    { label: "Nodos online", value: `${online}/${devices.length}`, accent: "border-l-secondary" },
    { label: "Nodos offline", value: offline, accent: "border-l-warning" },
    { label: "Modelos desplegados", value: deployed.length, accent: "border-l-muted" },
    { label: "Escaneos phishing", value: scanCount, accent: "border-l-primary" },
    { label: "Informes", value: reportCount, accent: "border-l-secondary" },
    { label: "Auditoría reciente", value: audit24h, accent: "border-l-warning" },
  ];

  const { role } = await getAppRole();
  const meta = ROLE_META[role];

  return (
    <>
      <Topbar title={`Dashboard · ${meta.label}`} subtitle={meta.summary} />
      <div className="space-y-6 overflow-y-auto p-6">
        <DataState state={state} />
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Enfoque del rol</p>
            <p className="mt-1 font-display text-lg">{meta.focus}</p>
            {activeModel ? (
              <p className="mt-1 text-xs text-muted">
                Modelo activo: <span className="font-medium text-foreground">{activeModel.name}</span> · {activeModel.algorithm} · F1 {formatMetric(activeModel.metrics)}
              </p>
            ) : null}
          </div>
          {role === "admin" ? (
            <Link href="/equipo" className="text-sm text-primary hover:underline">Gestionar equipo</Link>
          ) : role === "analista" ? (
            <Link href="/alerts" className="text-sm text-primary hover:underline">Abrir cola de alertas</Link>
          ) : (
            <p className="text-sm text-muted">Las acciones de escritura están ocultas.</p>
          )}
        </Card>

        <KpiCards items={kpis} />

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <FadeIn delay={0.1}>
              <EventsChart data={chartData} />
            </FadeIn>
          </div>
          <div className="xl:col-span-2">
            <FadeIn delay={0.16}>
              <AlertsFeed
                alerts={alerts.slice(0, 100).map((a) => ({
                  id: a.id, title: a.title, severity: a.severity, module: a.module, attack_type: a.attack_type,
                }))}
              />
            </FadeIn>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <FadeIn delay={0.2}>
              <SeverityChart data={severityData} />
            </FadeIn>
          </div>
          <div className="xl:col-span-3">
            <FadeIn delay={0.26}>
              <Card className="h-[340px]">
                <div className="mb-4 flex items-baseline justify-between">
                  <p className="font-display text-lg">Actividad reciente</p>
                  <Link href="/audit" className="text-xs text-primary hover:underline">Ver auditoría</Link>
                </div>
                {auditRecent.length ? (
                  <ul className="space-y-3">
                    {auditRecent.map((log) => (
                      <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-background-elevated/50 px-3 py-2.5 text-sm">
                        <span>
                          <Badge className={severityClass("baja")}>{log.action}</Badge>{" "}
                          <span className="font-mono text-xs text-muted">{log.entity_table}</span>
                          {log.actor_email ? <span className="ml-2 text-xs text-muted">por {log.actor_email}</span> : null}
                        </span>
                        <time className="text-xs text-muted">{new Date(log.created_at).toLocaleString("es-BO")}</time>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Sin actividad de auditoría reciente.</p>
                )}
              </Card>
            </FadeIn>
          </div>
        </div>
      </div>
    </>
  );
}

function formatMetric(metrics: Record<string, number> | null | undefined): string {
  if (!metrics) return "—";
  const f1 = metrics.f1 ?? metrics.validation_f1 ?? metrics.test_f1;
  return typeof f1 === "number" ? `${(f1 * 100).toFixed(2)}%` : "—";
}

/**
 * Serie temporal con picos: ventana de 30 días por día; si no hay alertas en la
 * ventana, cae a las últimas 12 semanas agrupadas por semana (usa solo datos
 * reales de la base, nunca datos inventados).
 */
function buildEventSeries(alerts: AlertRow) {
  const now = new Date();
  const fmtDay = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" });

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (29 - i));
    return d;
  });
  const byDay = new Map(days.map((d) => [d.toDateString(), { name: fmtDay.format(d), ids: 0, iot: 0, phishing: 0, otros: 0 }]));
  let any = false;
  for (const a of alerts) {
    const d = new Date(a.created_at);
    if (Number.isNaN(+d)) continue;
    const p = byDay.get(d.toDateString());
    if (!p) continue;
    any = true;
    if (a.module === "ids") p.ids += 1;
    else if (a.module === "iot") p.iot += 1;
    else if (a.module === "phishing") p.phishing += 1;
    else p.otros += 1;
  }
  if (any) return [...byDay.values()];

  // Fallback: últimas 12 semanas con los datos históricos reales (picos).
  const fmtWeek = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" });
  const mondayOf = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  };
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (11 - i) * 7);
    return mondayOf(d);
  });
  const byWeek = new Map(weeks.map((w) => [w.toDateString(), { name: `sem ${fmtWeek.format(w)}`, ids: 0, iot: 0, phishing: 0, otros: 0 }]));
  for (const a of alerts) {
    const d = new Date(a.created_at);
    if (Number.isNaN(+d)) continue;
    const p = byWeek.get(mondayOf(d).toDateString());
    if (!p) continue;
    if (a.module === "ids") p.ids += 1;
    else if (a.module === "iot") p.iot += 1;
    else if (a.module === "phishing") p.phishing += 1;
    else p.otros += 1;
  }
  return [...byWeek.values()];
}

function buildSeveritySeries(alerts: AlertRow): SeverityPoint[] {
  const order: Array<[string, string]> = [
    ["critica", "var(--accent)"],
    ["alta", "var(--primary)"],
    ["media", "var(--warning)"],
    ["baja", "var(--secondary)"],
  ];
  return order.map(([name, fill]) => ({
    name,
    value: alerts.filter((a) => a.severity === name).length,
    fill,
  }));
}
