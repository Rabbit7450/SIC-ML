/** Datos demo cuando Supabase aún no tiene tablas migradas. */
export const demoAlerts = [
  {
    id: "a1",
    title: "Tráfico anómalo detectado",
    module: "ids",
    attack_type: "probe",
    severity: "alta",
    score: 0.91,
    source_ip: "192.168.1.45",
    created_at: new Date().toISOString(),
  },
  {
    id: "a2",
    title: "Replay MQTT bloqueado",
    module: "iot",
    attack_type: "replay",
    severity: "critica",
    score: 1,
    source_ip: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "a3",
    title: "URL sospechosa clasificada",
    module: "phishing",
    attack_type: "phish",
    severity: "alta",
    score: 0.94,
    source_ip: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "a4",
    title: "Cabecera CSP ausente",
    module: "web",
    attack_type: "misconfig",
    severity: "media",
    score: 0.6,
    source_ip: null,
    created_at: new Date().toISOString(),
  },
];

export const demoDevices = [
  {
    id: "d1",
    name: "Sensor pasillo",
    node_id: "esp32-01",
    status: "online",
    last_seen_at: new Date().toISOString(),
  },
  {
    id: "d2",
    name: "Sensor almacén",
    node_id: "esp32-02",
    status: "offline",
    last_seen_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "d3",
    name: "Nodo laboratorio",
    node_id: "esp32-sim",
    status: "online",
    last_seen_at: new Date().toISOString(),
  },
];

export const demoModels = [
  {
    id: "m1",
    name: "NSL-KDD Binary RF",
    version: "1.0.0",
    algorithm: "random_forest",
    metrics: { f1: 0.9992, accuracy: 0.9991 },
    is_deployed: true,
  },
  {
    id: "m2",
    name: "NSL-KDD Linear SVM",
    version: "1.0.0",
    algorithm: "svm_linear",
    metrics: { f1: 0.9778, accuracy: 0.9762 },
    is_deployed: false,
  },
];

export const chartSeries = [
  { name: "Lun", ids: 12, iot: 4, phishing: 7 },
  { name: "Mar", ids: 18, iot: 6, phishing: 5 },
  { name: "Mié", ids: 9, iot: 8, phishing: 11 },
  { name: "Jue", ids: 22, iot: 3, phishing: 9 },
  { name: "Vie", ids: 15, iot: 10, phishing: 6 },
  { name: "Sáb", ids: 7, iot: 2, phishing: 3 },
  { name: "Dom", ids: 11, iot: 5, phishing: 4 },
];
