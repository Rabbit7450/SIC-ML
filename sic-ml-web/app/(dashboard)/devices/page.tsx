import { desc, isNull } from "drizzle-orm";
import { Topbar } from "@/components/layout/topbar";
import { DevicesPanel } from "@/components/devices/devices-panel";
import { getAppRole } from "@/lib/current-role";
import { demoDevices } from "@/lib/demo-data";
import { canWrite } from "@/lib/roles";
import { DataState } from "@/components/layout/data-state";
import { getDb, devices as devicesTable } from "@/lib/db";

export default async function DevicesPage() {
  const connected = Boolean(process.env.DATABASE_URL);
  let devices = connected ? [] : demoDevices;
  let state: "demo" | "connected" | "error" = connected ? "connected" : "demo";
  if (connected) try {
    const rows = await getDb()
      .select()
      .from(devicesTable)
      .where(isNull(devicesTable.deleted_at))
      .orderBy(desc(devicesTable.created_at));
    devices = rows as unknown as typeof demoDevices;
  } catch {
    state = "error";
  }

  const { role } = await getAppRole();
  const write = canWrite(role);

  return (
    <>
      <Topbar
        title="Dispositivos IoT"
        subtitle={write ? "Alta y baja lógica de nodos ESP32" : "Inventario de solo lectura"}
      />
      <div className="space-y-4 p-6">
        <DataState state={state} />
        {state === "error" ? null : <DevicesPanel devices={devices} canWrite={write} />}
      </div>
    </>
  );
}
