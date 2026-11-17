import { ShieldCheck } from "lucide-react";

/**
 * Panel visual 3D para las pantallas de login/registro:
 * rejilla en perspectiva, anillos pulsantes, logo flotante con glow y partículas.
 */
export function AuthVisual() {
  const particles = [
    { left: "12%", top: "22%", delay: "0s", size: 6 },
    { left: "78%", top: "18%", delay: "1.4s", size: 5 },
    { left: "24%", top: "74%", delay: "2.6s", size: 7 },
    { left: "86%", top: "66%", delay: "0.8s", size: 4 },
    { left: "58%", top: "10%", delay: "3.2s", size: 5 },
    { left: "38%", top: "88%", delay: "2s", size: 6 },
  ];

  return (
    <div
      className="relative m-4 hidden overflow-hidden rounded-3xl border border-border bg-[#0b141d] lg:block"
      aria-hidden="true"
    >
      {/* fondo degradado */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_18%,rgba(49,91,134,.6),transparent_60%),radial-gradient(ellipse_at_82%_88%,rgba(55,124,105,.4),transparent_55%)]" />
      {/* rejilla 3D en el suelo */}
      <div className="absolute inset-x-[-20%] bottom-[-8%] h-[55%] opacity-40 [background-image:linear-gradient(rgba(142,179,220,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(142,179,220,.25)_1px,transparent_1px)] [background-size:44px_44px] [transform:perspective(650px)_rotateX(60deg)_scale(1.7)]" />
      {/* anillos 3D pulsantes */}
      <div className="animate-ring absolute left-1/2 top-[46%] h-72 w-72 -ml-36 -mt-36 rounded-full border-2 border-primary/60" />
      <div className="animate-ring absolute left-1/2 top-[46%] h-[26rem] w-[26rem] -ml-[13rem] -mt-[13rem] rounded-full border border-secondary/50 [animation-delay:1.7s]" />
      {/* logo central flotante con glow */}
      <div className="animate-float animate-glow absolute left-1/2 top-[46%] flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-primary text-[var(--on-primary)]">
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
      {/* texto */}
      <div className="absolute bottom-8 left-8 right-8 text-white">
        <p className="font-display text-3xl tracking-tight">SIC-ML</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
          Centro de operaciones de ciberseguridad: IDS con red neuronal, IoT seguro, anti-phishing con ML y auditoría sobre PostgreSQL.
        </p>
      </div>
    </div>
  );
}
