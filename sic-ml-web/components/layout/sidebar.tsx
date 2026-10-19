"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Cpu,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldAlert,
  TreePine,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alerts", label: "Alertas IDS", icon: Bell },
  { href: "/devices", label: "Dispositivos IoT", icon: Cpu },
  { href: "/phishing", label: "Phishing / Auditoría", icon: ShieldAlert },
  { href: "/models", label: "Modelos ML", icon: Activity },
  { href: "/audit", label: "Auditoría", icon: ScrollText },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur-md">
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary glow-amber">
          <TreePine className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg leading-none tracking-tight">SIC-ML</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted">
            Amber Forest
          </p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)]"
                  : "text-muted hover:bg-background-elevated hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted">
        Stack gratis · Vercel + Supabase
      </div>
    </aside>
  );
}
