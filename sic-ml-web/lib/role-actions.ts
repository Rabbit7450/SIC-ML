"use server";

import { cookies } from "next/headers";
import { ROLE_COOKIE } from "@/lib/current-role";
import { isAppRole, type AppRole } from "@/lib/roles";

export async function setDemoRole(role: AppRole) {
  if (!isAppRole(role)) return { ok: false as const };
  if (process.env.NODE_ENV === "production") return { ok: false as const, locked: true as const };
  if (process.env.DATABASE_URL) return { ok: false as const, locked: true as const };
  const jar = await cookies();
  jar.set(ROLE_COOKIE, role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    sameSite: "lax",
  });
  return { ok: true as const };
}
