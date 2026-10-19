import { Topbar } from "@/components/layout/topbar";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { EventsChart } from "@/components/dashboard/events-chart";
import { FadeIn } from "@/components/animations/fade-in";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { demoAlerts, demoDevices, demoModels } from "@/lib/demo-data";
import { severityClass } from "@/lib/utils";

export default async function DashboardPage() {
  let alerts = demoAlerts;
  let devices = demoDevices;
  let models = demoModels;
  let source = "demo";

  try {
    const supabase = await createClient();
    const [{ data: a }, { data: d }, { data: m }] = await Promise.all([
      supabase
        .from("alerts")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("devices").select("*").is("deleted_at", null),
      supabase.from("models").select("*").is("deleted_at", null),
    ]);
    if (a?.length) {
      alerts = a as typeof demoAlerts;
      source = "supabase";
    }
    if (d?.length) devices = d as typeof demoDevices;
    if (m?.length) models = m as typeof demoModels;
  } catch {
    /* modo demo */
  }

  const online = devices.filter((d) => d.status === "online").length;
  const critical = alerts.filter((a) => a.severity === "critica").length;
  const deployed = models.filter((m) => m.is_deployed).length;

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={`Vista unificada · fuente: ${source}`}
      />
      <div className="space-y-6 overflow-y-auto p-6">
        <KpiCards
          alerts={alerts.length}
          devicesOnline={online}
          modelsDeployed={deployed}
          critical={critical}
        />
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <FadeIn delay={0.1}>
              <EventsChart />
            </FadeIn>
          </div>
          <div className="xl:col-span-2">
            <FadeIn delay={0.16}>
              <Card className="h-full">
                <p className="mb-4 font-display text-lg">Feed de alertas</p>
                <ul className="space-y-3">
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
                        {alert.module} · {alert.attack_type ?? "n/a"}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            </FadeIn>
          </div>
        </div>
      </div>
    </>
  );
}
