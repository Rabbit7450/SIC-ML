import Link from "next/link";
import { count, desc, isNull } from "drizzle-orm";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/fade-in";
import { AttackMapOL } from "@/components/public/attack-map-ol";
import { HeroVisual } from "@/components/public/hero-visual";
import { HomeStats } from "@/components/public/home-stats";
import { FeatureCards } from "@/components/public/feature-cards";
import { AlertsTicker, type TickerAlert } from "@/components/public/alerts-ticker";
import { getDb, alerts as alertsTable, devices as devicesTable, models as modelsTable, scans as scansTable } from "@/lib/db";

export default async function HomePage() {
  // Datos públicos de resumen (solo conteos y últimas alertas; sin sesión).
  let alertCount = 0;
  let online = 0;
  let scanCount = 0;
  let deployedCount = 0;
  let f1 = "99.5%";
  let ticker: TickerAlert[] = [];
  try {
    const db = getDb();
    const [a, d, s, m, recent] = await Promise.all([
      db.select({ c: count() }).from(alertsTable).where(isNull(alertsTable.deleted_at)),
      db.select().from(devicesTable).where(isNull(devicesTable.deleted_at)),
      db.select({ c: count() }).from(scansTable).where(isNull(scansTable.deleted_at)),
      db.select().from(modelsTable).where(isNull(modelsTable.deleted_at)),
      db
        .select({ id: alertsTable.id, title: alertsTable.title, severity: alertsTable.severity, module: alertsTable.module })
        .from(alertsTable)
        .where(isNull(alertsTable.deleted_at))
        .orderBy(desc(alertsTable.created_at))
        .limit(6),
    ]);
    alertCount = Number((a[0] as { c: number | string }).c);
    online = d.filter((x) => x.status === "online").length;
    scanCount = Number((s[0] as { c: number | string }).c);
    const deployed = m.filter((x) => x.is_deployed);
    deployedCount = deployed.length;
    const active = deployed[0];
    const f1v = active?.metrics?.validation_f1 ?? active?.metrics?.f1;
    if (typeof f1v === "number") f1 = `${(f1v * 100).toFixed(1)}%`;
    ticker = recent.map((r) => ({ id: r.id, title: r.title, severity: r.severity, module: r.module }));
  } catch {
    // Sin DB: la home sigue mostrando los valores en cero.
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background px-6">
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-6rem] top-40 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" aria-hidden="true" />

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3 border-b border-border py-5">
        <div className="flex items-center gap-3">
          <div className="animate-glow flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-[var(--on-primary)]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-base leading-none">SIC-ML</p>
            <p className="mt-1 text-xs text-muted">Centro de seguridad</p>
          </div>
        </div>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Entrar →
        </Link>
      </header>

      <main className="relative mx-auto w-full max-w-7xl flex-1">
        {/* HERO */}
        <section className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <FadeIn>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" aria-hidden="true" />
                SOC con Machine Learning · en vivo
              </p>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Seguridad
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  que se anticipa.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
                IDS con red neuronal, IoT cifrado, anti-phishing con ML y auditoría sobre PostgreSQL:
                todo el laboratorio de ciberseguridad en un solo panel.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/login">
                  <Button size="lg">
                    Entrar al panel <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/preview">
                  <Button size="lg" variant="outline">Explorar vista previa</Button>
                </Link>
              </div>
              <HomeStats alerts={alertCount} devicesOnline={online} scans={scanCount} modelsDeployed={deployedCount} />
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <HeroVisual alerts={alertCount} nodes={online} f1={f1} />
          </FadeIn>
        </section>

        {/* TICKER de alertas */}
        <FadeIn delay={0.2}>
          <div className="pb-8">
            <AlertsTicker alerts={ticker} />
          </div>
        </FadeIn>

        {/* MAPA grande a todo ancho */}
        <FadeIn delay={0.1}>
          <section className="pb-14" aria-label="Mapa de actividad cibernética">
            <AttackMapOL />
          </section>
        </FadeIn>

        {/* Módulos */}
        <section className="pb-16">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Módulos del sistema</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Cuatro capas, una sola operación
            </h2>
          </FadeIn>
          <div className="mt-8">
            <FeatureCards />
          </div>
        </section>
      </main>

      <footer className="relative mx-auto w-full max-w-7xl border-t border-border py-5 text-xs text-muted">
        Plataforma integrada de monitoreo y análisis de seguridad · SIC-ML (laboratorio)
      </footer>
    </div>
  );
}
