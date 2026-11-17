import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  if (!body?.email || !body.password) return NextResponse.json({ error: "Email y contraseña son requeridos." }, { status: 400 });
  try {
    const rows = await getDb().execute(sql`
      SELECT id, role, full_name FROM profiles
      WHERE lower(email) = lower(${body.email.trim()})
        AND deleted_at IS NULL
        AND password_hash = crypt(${body.password}, password_hash)
      LIMIT 1
    `);
    const user = rows[0] as { id: string; role: string; full_name: string | null } | undefined;
    if (!user) return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    await getDb().execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id, details) VALUES (${user.id}::uuid, 'login', 'profiles', ${user.id}::uuid, jsonb_build_object('method', 'password', 'occurred_at', now()))`);
    const response = NextResponse.json({ ok: true, user: { role: user.role, name: user.full_name } });
    response.cookies.set("sic_user", user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo validar la sesión local." }, { status: 503 });
  }
}
