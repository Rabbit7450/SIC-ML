"use client";

import { Activity, Cpu, ShieldCheck, ShieldAlert } from "lucide-react";

/**
 * Panel visual 3D del hero: escudo flotante con glow, anillos pulsantes,
 * rejilla en perspectiva, partículas y mini-tarjetas con datos en vivo.
 */
export function HeroVisual({
  alerts,
  nodes,
  f1,
}: {
  alerts: number;
  nodes: number;
  f1: string;
}) {
  const particles = [
    { left: "10%", top: "20%", delay: "0s", size: 6 },
    { left: "82%", top: "16%", delay: "1.2s", size: 5 },
    { left: "20%", top: "78%", delay: "2.4s", size: 7 },
    { left: "88%", top: "70%", delay: "0.7s", size: 4 },
    { left: "60%", top: "8%", delay: "3s", size: 5 },
    { left: "34%", top: "90%", delay: "1.8s", size: 6 },
  ];

  return (
    <div
      className="relative hidden h-[460px] overflow-hidden rounded-3xl border border-border bg-[#0b141d] lg:block"
      aria-hidden="true"
    >
      {/* fondo degradado */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_28%_16%,rgba(49,91,134,.65),transparent_60%),radial-gradient(ellipse_at_84%_90%,rgba(55,124,105,.45),transparent_55%)]" />
      {/* rejilla 3D suelo */}
      <div className="absolute inset-x-[-20%] bottom-[-10%] h-[60%] opacity-40 [background-image:linear-gradient(rgba(142,179,220,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(142,179,220,.25)_1px,transparent_1px)] [background-size:44px_44px] [transform:perspective(650px)_rotateX(60deg)_scale(1.7)]" />
      {/* anillos 3D */}
      <div className="animate-ring absolute left-1/2 top-[44%] h-72 w-72 -ml-36 -mt-36 rounded-full border-2 border-primary/60" />
      <div className="animate-ring absolute left-1/2 top-[44%] h-[26rem] w-[26rem] -ml-[13rem] -mt-[13rem] rounded-full border border-secondary/50 [animation-delay:1.7s]" />
      {/* escudo central flotante */}
      <div className="animate-float animate-glow absolute left-1/2 top-[44%] flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-primary text-[var(--on-primary)]">
        <ShieldCheck className="h-12 w-12" />
      </div>
      {/* partículas */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="animate-drift absolute rounded-full bg-primary-dark/80"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay }}
        />
      ))}
      {/* mini-tarjetas flotantes con datos */}
      <div className="animate-bob absolute left-6 top-8 flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/90 px-3.5 py-2.5 shadow-lg backdrop-blur">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-sm tabular-nums">{alerts}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted">alertas activas</p>
        </div>
      </div>
      <div
        className="animate-bob absolute bottom-24 right-6 flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/90 px-3.5 py-2.5 shadow-lg backdrop-blur [animation-delay:1.4s]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
          <Cpu className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-sm tabular-nums">{nodes}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted">nodos IoT</p>
        </div>
      </div>
      <div
        className="animate-bob absolute bottom-8 left-8 flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/90 px-3.5 py-2.5 shadow-lg backdrop-blur [animation-delay:2.2s]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Activity className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-sm tabular-nums">{f1}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted">F1 red neuronal</p>
        </div>
      </div>
    </div>
  );
}
