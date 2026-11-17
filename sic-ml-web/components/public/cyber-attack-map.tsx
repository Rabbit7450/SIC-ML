"use client";

import { useEffect, useState } from "react";
import { CircleDot, Pause, Play, Radio, ShieldAlert } from "lucide-react";

const events = [
  { date: "19 FEB 2025", label: "Ghost (Cring) ransomware", region: "América", tone: "bg-accent", href: "https://www.cisa.gov/news-events/alerts/2025/02/19/cisa-and-partners-release-advisory-ghost-cring-ransomware", x: 19, y: 53 },
  { date: "12 MAR 2025", label: "Medusa ransomware", region: "Europa", tone: "bg-accent", href: "https://www.cisa.gov/news-events/alerts/2025/03/12/cisa-and-partners-release-cybersecurity-advisory-medusa-ransomware", x: 47, y: 35 },
  { date: "03 ABR 2025", label: "Infraestructura fast-flux", region: "Oriente Medio", tone: "bg-warning", href: "https://www.cisa.gov/news-events/alerts/2025/04/03/nsa-cisa-fbi-and-international-partners-release-cybersecurity-advisory-fast-flux-national-security", x: 65, y: 49 },
  { date: "11 ABR 2025", label: "Técnica post-explotación Fortinet", region: "Asia-Pacífico", tone: "bg-primary", href: "https://www.cisa.gov/news-events/alerts/2025/04/11/fortinet-releases-advisory-new-post-exploitation-technique-known-vulnerabilities", x: 82, y: 59 },
] as const;

export function CyberAttackMap() {
  const [running, setRunning] = useState(true);
  const [active, setActive] = useState(0);
  useEffect(() => { if (!running) return; const id = setInterval(() => setActive((i) => (i + 1) % events.length), 2400); return () => clearInterval(id); }, [running]);
  const current = events[active];

  return <section aria-labelledby="map-title" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-primary"><Radio aria-hidden="true" className="h-4 w-4" />Threat intelligence</p><h2 id="map-title" className="mt-1 text-xl font-semibold">Mapa de actividad cibernética</h2></div>
      <button aria-label={running ? "Pausar rotación del mapa" : "Reanudar rotación del mapa"} aria-pressed={running} onClick={() => setRunning(!running)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-background-elevated focus-visible:outline-2 focus-visible:outline-primary">{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
    </header>
    <div className="grid lg:grid-cols-[1.55fr_.85fr]">
      <div className="relative min-h-[280px] overflow-hidden border-b border-border bg-[#09121b] p-5 text-white lg:border-b-0 lg:border-r">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(142,179,220,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(142,179,220,.3)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(49,91,134,.4),transparent_64%)]" />
        <div className="relative flex items-center justify-between text-[10px] font-mono uppercase tracking-[.18em] text-slate-300"><span>Global reference view</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f0b35a]" />Última referencia: abr 2025</span></div>
        <svg viewBox="0 0 100 50" className="relative mt-1 h-[204px] w-full" aria-hidden="true"><path d="M4 16l13-8 10 5 6 10-8 6-10-2-8 5-5-7zM37 9l12-3 10 6-2 10-9 2-7-5zM46 25l9 3 3 14-7 6-7-11zM60 14l14-5 16 8 5 12-13 5-10-7-12 3-5-8zM78 33l11 2 6 8-10 4-8-6z" fill="rgba(179,207,231,.18)" stroke="rgba(179,207,231,.4)" strokeWidth=".3" />{events.map((event, index) => <path key={event.label} d={`M50 25 Q ${(50 + event.x) / 2} ${Math.min(12, event.y - 12)} ${event.x} ${event.y}`} fill="none" stroke={index === active ? "#f0b35a" : "rgba(142,179,220,.35)"} strokeWidth={index === active ? "0.65" : "0.25"} strokeDasharray="1.3 1.3" />)}</svg>
        {events.map((event, index) => <button key={event.label} onClick={() => setActive(index)} aria-label={`Mostrar ${event.label}`} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${event.x}%`, top: `${event.y + 30}%` }}><span className={`block h-3.5 w-3.5 rounded-full border-2 border-white/90 ${event.tone} ${index === active && running ? "animate-ping" : ""}`} /><span className={`absolute inset-0 h-3.5 w-3.5 rounded-full ${event.tone}`} /></button>)}
        <div className="absolute bottom-4 left-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-200"><span className="flex items-center gap-1.5"><CircleDot className="h-3 w-3 text-[#f0b35a]" />Referencia destacada</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#e38b8b]" />Alta</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f0b35a]" />Media</span></div>
      </div>
      <aside className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Referencia seleccionada</p><div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2 text-primary"><ShieldAlert className="h-4 w-4" /><span className="font-mono text-xs">{current.date}</span></div><p className="mt-3 font-medium leading-snug">{current.label}</p><p className="mt-1 text-sm text-muted">Alcance: {current.region}</p><a href={current.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">Ver alerta original de CISA</a></div><p className="mt-4 text-xs leading-5 text-muted">Fuentes públicas fechadas. El mapa no representa ataques confirmados contra la infraestructura local.</p></aside>
    </div>
  </section>;
}
