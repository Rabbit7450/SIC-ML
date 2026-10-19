import Link from "next/link";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.18),transparent_55%)]" />
      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary glow-amber">
          <TreePine className="h-8 w-8" />
        </div>
        <p className="font-display text-5xl tracking-tight text-primary sm:text-6xl">
          SIC-ML
        </p>
        <h1 className="mt-4 font-display text-2xl text-foreground sm:text-3xl">
          Amber Forest
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Panel unificado de IDS, IoT seguro, anti-phishing y modelos ML.
          Stack 100 % gratis: Next.js · Supabase · Vercel.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login">
            <Button size="lg">Entrar al laboratorio</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              Ver dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
