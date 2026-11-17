import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(128),
});

/**
 * Registro local sobre PostgreSQL: crea el perfil con rol `viewer` y
 * contraseña hasheada con bcrypt (pgcrypto). Un admin puede promoverlo.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Nombre, email válido y contraseña (mín. 8 caracteres) son requeridos." }, { status: 400 });
  }
  try {
    const rows = await getDb().execute(sql`
      INSERT INTO profiles (email, full_name, role, password_hash)
      VALUES (${parsed.data.email.toLowerCase()}, ${parsed.data.full_name}, 'viewer', crypt(${parsed.data.password}, gen_salt('bf')))
      RETURNING id, email, full_name, role, created_at
    `);
    const user = rows[0];
    await getDb().execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id, details) VALUES (${(user as { id: string }).id}::uuid, 'register', 'profiles', ${(user as { id: string }).id}::uuid, jsonb_build_object('method', 'local_password'))`);
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear la cuenta. ¿El email ya está registrado?" }, { status: 409 });
  }
}
