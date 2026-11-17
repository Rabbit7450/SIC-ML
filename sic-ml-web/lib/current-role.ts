import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { isAppRole, type AppRole } from "@/lib/roles";
import { getDb } from "@/lib/db";

export const ROLE_COOKIE = "sic_role";

/**
 * Rol efectivo de la sesión. La app usa PostgreSQL local (DATABASE_URL) con la
 * cookie de sesión `sic_user`; sin sesión válida cae a solo lectura (viewer).
 */
export async function getAppRole(): Promise<{ role: AppRole; source: "profile" | "demo" }> {
  if (process.env.DATABASE_URL) {
    try {
      const jar = await cookies();
      const userId = jar.get("sic_user")?.value;
      if (userId) {
        const rows = await getDb().execute(sql`SELECT role FROM profiles WHERE id = ${userId}::uuid AND deleted_at IS NULL LIMIT 1`);
        const profile = rows[0] as { role?: string } | undefined;
        if (isAppRole(profile?.role)) return { role: profile.role, source: "profile" };
      }
    } catch { /* La pantalla conserva el acceso de solo lectura. */ }
    return { role: "viewer", source: "demo" };
  }

  if (process.env.NODE_ENV === "production") {
    return { role: "viewer", source: "demo" };
  }

  const jar = await cookies();
  const stored = jar.get(ROLE_COOKIE)?.value;
  if (isAppRole(stored)) return { role: stored, source: "demo" };
  return { role: "analista", source: "demo" };
}
