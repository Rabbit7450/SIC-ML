import { Topbar } from "@/components/layout/topbar";
import { AlertsTable } from "@/components/alerts/alerts-table";
import { createClient } from "@/lib/supabase/server";
import { demoAlerts } from "@/lib/demo-data";

export default async function AlertsPage() {
  let alerts = demoAlerts;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (data?.length) alerts = data as typeof demoAlerts;
  } catch {
    /* demo */
  }

  return (
    <>
      <Topbar
        title="Alertas IDS"
        subtitle="Soft delete · restauración · baja física solo admin"
      />
      <div className="p-6">
        <AlertsTable alerts={alerts} />
      </div>
    </>
  );
}
