"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { APP_ROLES, ROLE_META, type AppRole } from "@/lib/roles";
import { setDemoRole } from "@/lib/role-actions";

export function RoleSwitcher({ role }: { role: AppRole }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="block text-xs text-muted">
      Vista de rol
      <select
        aria-label="Cambiar vista de rol"
        className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        value={role}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as AppRole;
          startTransition(async () => {
            await setDemoRole(next);
            router.refresh();
          });
        }}
      >
        {APP_ROLES.map((item) => (
          <option key={item} value={item}>
            {ROLE_META[item].label}
          </option>
        ))}
      </select>
    </label>
  );
}
