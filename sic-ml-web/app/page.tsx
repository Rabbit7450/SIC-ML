import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CyberAttackMap } from "@/components/public/cyber-attack-map";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background px-6">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3 border-b border-border py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-[var(--on-primary)]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-base leading-none">SIC-ML</p>
          <p className="mt-1 text-xs text-muted">Centro de seguridad</p>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 py-12 lg:grid-cols-2">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Seguridad · Datos · Respuesta</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Visibilidad clara para decisiones de seguridad más rápidas.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Un espacio de trabajo para supervisar alertas IDS, dispositivos IoT,
            análisis anti-phishing y modelos de aprendizaje automático.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/login"><Button size="lg">Entrar al panel</Button></Link>
            <Link href="/preview"><Button size="lg" variant="outline">Explorar vista previa</Button></Link>
          </div>
        </div>
        <CyberAttackMap />
      </main>
      <footer className="mx-auto w-full max-w-6xl border-t border-border py-5 text-xs text-muted">Plataforma integrada de monitoreo y análisis de seguridad</footer>
    </div>
  );
}
