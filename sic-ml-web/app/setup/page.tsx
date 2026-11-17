import Link from "next/link";
import { Database, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SetupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
      <Card className="w-full p-8 sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Database className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-primary">Configuración requerida</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Conecta SIC-ML con PostgreSQL</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          La instancia no tiene configurada la conexión a la base de datos local. El panel permanece cerrado para no mostrar datos vacíos como si fueran reales.
        </p>
        <ol className="mt-7 space-y-3 text-sm text-foreground">
          <li className="flex gap-3"><span className="font-mono text-primary">01</span><span>Crea la base <code>sic_ml</code> y el usuario <code>sicml</code> en PostgreSQL (ver <code>postgres-local/</code>).</span></li>
          <li className="flex gap-3"><span className="font-mono text-primary">02</span><span>Ejecuta en orden los scripts <code>postgres-local/001…006.sql</code> (esquema, auth local y datos de ejemplo).</span></li>
          <li className="flex gap-3"><span className="font-mono text-primary">03</span><span>Define <code>DATABASE_URL=postgresql://sicml:tu_clave@127.0.0.1:5432/sic_ml</code> en el entorno del servidor y vuelve a desplegar.</span></li>
        </ol>
        <div className="mt-8 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          DATABASE_URL solo vive en el servidor; nunca se expone al navegador. En DBeaver usa host 127.0.0.1, puerto 5432, base sic_ml.
        </div>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">Volver al inicio</Link>
      </Card>
    </main>
  );
}
