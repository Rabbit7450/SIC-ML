import Link from "next/link";
import { Activity, Cpu, FileBarChart, ShieldAlert, type LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { Card } from "@/components/ui/card";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  tone: string;
};

const FEATURES: Feature[] = [
  {
    icon: Activity,
    title: "IDS con red neuronal",
    description: "Suricata + ELK normalizan eventos y la MLP de NSL-KDD clasifica ataques en tiempo real (F1 validación 99.5%).",
    href: "/dashboard",
    linkLabel: "Ver dashboard",
    tone: "bg-primary/12 text-primary",
  },
  {
    icon: Cpu,
    title: "IoT seguro (ESP32 + MQTT)",
    description: "Nodos ESP32 publican por MQTT con HMAC y cifrado AES; el gateway valida cada mensaje antes de procesarlo.",
    href: "/devices",
    linkLabel: "Ver dispositivos",
    tone: "bg-secondary/12 text-secondary",
  },
  {
    icon: ShieldAlert,
    title: "Anti-phishing con ML",
    description: "Blocklist de 392k dominios + modelo híbrido (reglas + ML) detecta suplantación de marca y typosquatting.",
    href: "/phishing",
    linkLabel: "Probar analizador",
    tone: "bg-accent/12 text-accent",
  },
  {
    icon: FileBarChart,
    title: "Auditoría e informes",
    description: "Trail completo en PostgreSQL con soft delete, informes descargables en Excel y backups SQL desde el panel admin.",
    href: "/audit",
    linkLabel: "Ver auditoría",
    tone: "bg-warning/12 text-warning",
  },
];

/** Tarjetas de módulos con efecto 3D (tilt) al hover. */
export function FeatureCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {FEATURES.map((f, i) => {
        const Icon = f.icon;
        return (
          <FadeIn key={f.title} delay={i * 0.08}>
            <Card className="card-3d h-full">
              <div className={`card-3d-icon flex h-12 w-12 items-center justify-center rounded-2xl ${f.tone}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-lg">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{f.description}</p>
              <Link href={f.href} className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
                {f.linkLabel} →
              </Link>
            </Card>
          </FadeIn>
        );
      })}
    </div>
  );
}
