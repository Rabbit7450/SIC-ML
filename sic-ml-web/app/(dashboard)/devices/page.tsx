import { Topbar } from "@/components/layout/topbar";
import { DevicesPanel } from "@/components/devices/devices-panel";
import { createClient } from "@/lib/supabase/server";
import { demoDevices } from "@/lib/demo-data";

export default async function DevicesPage() {
  let devices = demoDevices;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("devices")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (data?.length) devices = data as typeof demoDevices;
  } catch {
    /* demo */
  }

  return (
    <>
      <Topbar title="Dispositivos IoT" subtitle="Nodos ESP32 con soft delete" />
      <div className="p-6">
        <DevicesPanel devices={devices} />
      </div>
    </>
  );
}
