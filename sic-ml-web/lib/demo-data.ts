/** El panel no inventa actividad: solo se muestran datos almacenados. */
export const demoAlerts: Array<{
  id: string; title: string; module: string; attack_type: string | null;
  severity: "critica" | "alta" | "media" | "baja"; score: number | null;
  source_ip: string | null; created_at: string;
}> = [];

export const demoDevices: Array<{
  id: string; name: string; node_id: string;
  status: "online" | "offline" | "unknown"; last_seen_at: string | null;
}> = [];

export const demoModels: Array<{
  id: string; name: string; version: string; algorithm: string;
  metrics: Record<string, number>; is_deployed: boolean;
}> = [];

export const chartSeries = [
  { name: "Lun", ids: 0, iot: 0, phishing: 0 }, { name: "Mar", ids: 0, iot: 0, phishing: 0 },
  { name: "Mié", ids: 0, iot: 0, phishing: 0 }, { name: "Jue", ids: 0, iot: 0, phishing: 0 },
  { name: "Vie", ids: 0, iot: 0, phishing: 0 }, { name: "Sáb", ids: 0, iot: 0, phishing: 0 },
  { name: "Dom", ids: 0, iot: 0, phishing: 0 },
];
