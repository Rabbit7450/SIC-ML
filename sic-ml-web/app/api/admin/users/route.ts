import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { isMailConfigured, sendCredentialsEmail } from "@/lib/mail";

const role = z.enum(["admin", "analista", "viewer"]);
const createSchema = z.object({ full_name: z.string().trim().min(2).max(100), email: z.string().trim().email(), role, password: z.string().min(8).max(128) });
const updateSchema = z.object({ id: z.string().uuid(), full_name: z.string().trim().min(2).max(100).optional(), role: role.optional(), password: z.string().min(8).max(128).optional() });
const idSchema = z.object({ id: z.string().uuid() });

async function adminId() {
  const id = (await cookies()).get("sic_user")?.value;
  if (!id) return null;
  const result = await getDb().execute(sql`SELECT id FROM profiles WHERE id = ${id}::uuid AND role = 'admin' AND deleted_at IS NULL LIMIT 1`);
  return (result[0] as { id: string } | undefined)?.id ?? null;
}
async function forbidden() { return !(await adminId()); }

export async function GET() {
  try { if (await forbidden()) return NextResponse.json({ error: "Acceso restringido." }, { status: 403 });
    const users = await getDb().execute(sql`SELECT id, email, full_name, role, is_active, created_at FROM profiles WHERE deleted_at IS NULL ORDER BY created_at DESC`);
    return NextResponse.json({ users });
  } catch { return NextResponse.json({ error: "No se pudo consultar usuarios." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    const actor = await adminId();
    if (!actor) return NextResponse.json({ error: "Acceso restringido." }, { status: 403 });
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de la cuenta." }, { status: 400 });
    const u = parsed.data;

    const rows = await getDb().execute(sql`INSERT INTO profiles (email, full_name, role, password_hash) VALUES (${u.email}, ${u.full_name}, ${u.role}, crypt(${u.password}, gen_salt('bf'))) RETURNING id, email, full_name, role, is_active, created_at`);
    const user = rows[0] as { id: string; email: string | null; full_name: string | null };

    // Envío de credenciales al correo del usuario (SMTP). La contraseña no se
    // guarda en auditoría; si el correo no está configurado se devuelve una
    // sola vez al admin para que la comunique manualmente.
    let emailed = false;
    if (isMailConfigured() && user.email) {
      try {
        await sendCredentialsEmail({
          to: user.email,
          fullName: user.full_name ?? user.email,
          loginEmail: user.email,
          password: u.password,
          reason: "created",
        });
        emailed = true;
      } catch { emailed = false; }
    }
    await getDb().execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id, details) VALUES (${actor}::uuid, 'create', 'profiles', ${user.id}::uuid, jsonb_build_object('credentials_email', ${emailed ? "sent" : isMailConfigured() ? "failed" : "smtp_not_configured"}::text))`);

    return NextResponse.json(
      emailed ? { user, emailed } : { user, emailed, password: u.password },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/admin/users] error al crear:", err);
    const cause = err instanceof Error && "cause" in err ? (err as { cause?: { code?: string } }).cause : undefined;
    if (cause?.code === "23505") {
      return NextResponse.json({ error: "Ese email ya está registrado en una cuenta activa." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "No se pudo crear la cuenta.", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }
}
export async function PATCH(request: Request) {
  try { const actor = await adminId(); if (!actor) return NextResponse.json({ error: "Acceso restringido." }, { status: 403 }); const parsed = updateSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 }); const u = parsed.data;
    if (u.full_name !== undefined) await getDb().execute(sql`UPDATE profiles SET full_name = ${u.full_name}, updated_at = now() WHERE id = ${u.id}::uuid AND deleted_at IS NULL`);
    if (u.role !== undefined) await getDb().execute(sql`UPDATE profiles SET role = ${u.role}, updated_at = now() WHERE id = ${u.id}::uuid AND deleted_at IS NULL`);
    let emailed: boolean | undefined;
    if (u.password !== undefined) {
      await getDb().execute(sql`UPDATE profiles SET password_hash = crypt(${u.password}, gen_salt('bf')), updated_at = now() WHERE id = ${u.id}::uuid AND deleted_at IS NULL`);
      const target = await getDb().execute(sql`SELECT email, full_name FROM profiles WHERE id = ${u.id}::uuid AND deleted_at IS NULL`);
      const profile = target[0] as { email: string | null; full_name: string | null } | undefined;
      if (isMailConfigured() && profile?.email) {
        try {
          await sendCredentialsEmail({
            to: profile.email,
            fullName: profile.full_name ?? profile.email,
            loginEmail: profile.email,
            password: u.password,
            reason: "reset",
          });
          emailed = true;
        } catch { emailed = false; }
      }
    }
    const rows = await getDb().execute(sql`SELECT id, email, full_name, role, is_active, created_at FROM profiles WHERE id = ${u.id}::uuid AND deleted_at IS NULL`); if (!rows[0]) return NextResponse.json({ error: "Cuenta no encontrada." }, { status: 404 }); await getDb().execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id, details) VALUES (${actor}::uuid, 'update', 'profiles', ${u.id}::uuid, jsonb_build_object('password_reset', true, 'credentials_email', ${emailed === undefined ? "not_requested" : emailed ? "sent" : isMailConfigured() ? "failed" : "smtp_not_configured"}::text))`); return NextResponse.json(emailed !== undefined ? (emailed ? { user: rows[0], emailed } : { user: rows[0], emailed, password: u.password }) : { user: rows[0] });
  } catch { return NextResponse.json({ error: "No se pudo actualizar la cuenta." }, { status: 400 }); }
}
export async function DELETE(request: Request) {
  try { const actor = await adminId(); if (!actor) return NextResponse.json({ error: "Acceso restringido." }, { status: 403 }); const parsed = idSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Identificador inválido." }, { status: 400 }); if (parsed.data.id === actor) return NextResponse.json({ error: "No puedes dar de baja tu propia cuenta." }, { status: 400 });
    await getDb().execute(sql`UPDATE profiles SET deleted_at = now(), is_active = false, updated_at = now() WHERE id = ${parsed.data.id}::uuid AND deleted_at IS NULL`); await getDb().execute(sql`INSERT INTO audit_logs (actor_id, action, entity_table, entity_id) VALUES (${actor}::uuid, 'soft_delete', 'profiles', ${parsed.data.id}::uuid)`); return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No se pudo dar de baja la cuenta." }, { status: 400 }); }
}
