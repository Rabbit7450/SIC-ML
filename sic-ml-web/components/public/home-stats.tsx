"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

function useCountUp(target: number, start: boolean, durationMs = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, durationMs]);
  return value;
}

function Stat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const n = useCountUp(value, inView);
  return (
    <div ref={ref} className="border-l-[3px] border-l-primary/60 pl-4">
      <p className="font-display text-3xl tabular-nums text-foreground">
        {n}
        {suffix}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
    </div>
  );
}

/** Estadísticas animadas (count-up) de la home, con datos reales de PostgreSQL. */
export function HomeStats({
  alerts,
  devicesOnline,
  scans,
  modelsDeployed,
}: {
  alerts: number;
  devicesOnline: number;
  scans: number;
  modelsDeployed: number;
}) {
  return (
    <div className="mt-10 grid max-w-xl grid-cols-2 gap-5 sm:grid-cols-4">
      <Stat label="Alertas activas" value={alerts} />
      <Stat label="Nodos online" value={devicesOnline} />
      <Stat label="Escaneos phishing" value={scans} />
      <Stat label="Modelos ML" value={modelsDeployed} />
    </div>
  );
}
