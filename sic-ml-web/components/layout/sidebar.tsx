"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  FileBarChart,
  Bell,
  Cpu,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  ShieldAlert,
  TreePine,
  Users,
} from "lucide-react";
import { navForRole, ROLE_META, type AppRole, type NavHref } from "@/lib/roles";
import { cn } from "@/lib/utils";

const icons: Record<NavHref, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/alerts": Bell,
  "/devices": Cpu,
  "/phishing": ShieldAlert,
  "/models": Activity,
  "/reports": FileBarChart,
  "/audit": ScrollText,
  "/equipo": Users,
  "/settings": Settings,
};

export function Sidebar({
  role,
}: {
  role: AppRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const links = navForRole(role);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 md:py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-[var(--on-primary)] shadow-sm">
          <TreePine className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg leading-none tracking-tight">SIC-ML</p>
          <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            {ROLE_META[role].label}
          </p>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col" aria-label="Secciones del rol">
        {links.map(({ href, label }) => {
          const Icon = icons[href];
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200",
                active
                  ? "bg-background-elevated font-medium text-primary shadow-[inset_3px_0_0_var(--primary)]"
                  : "text-muted hover:bg-background-elevated hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted">Rol de la cuenta: {ROLE_META[role].label}</p>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={busy}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background-elevated px-3 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {busy ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
