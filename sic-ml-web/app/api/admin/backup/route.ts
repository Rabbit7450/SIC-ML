import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { spawnSync } from "node:child_process";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Backup completo de la base en SQL (pg_dump) como descarga .sql.
 * Solo admin. La URL de conexión nunca sale al cliente: se parsea aquí.
 */
export async function GET() {
  const id = (await cookies()).get("sic_user")?.value;
  if (!id) {
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  }
  let isAdmin = false;
  try {
    const rows = await getDb().execute(
      sql`SELECT role FROM profiles WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1`,
    );
    isAdmin = (rows[0] as { role?: string } | undefined)?.role === "admin";
  } catch {
    return NextResponse.json({ error: "No se pudo verificar el rol con PostgreSQL." }, { status: 503 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "Solo admin puede descargar backups." }, { status: 403 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL no configurada en el servidor." }, { status: 503 });
  }

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return NextResponse.json({ error: "DATABASE_URL inválida." }, { status: 500 });
  }
  const host = u.hostname || "127.0.0.1";
  const port = u.port || "5432";
  const user = decodeURIComponent(u.username || "postgres");
  const password = decodeURIComponent(u.password || "");
  const dbname = u.pathname.replace(/^\//, "") || "postgres";

  const res = spawnSync(
    "pg_dump",
    ["-h", host, "-p", port, "-U", user, "-d", dbname, "--no-owner", "--no-privileges", "--clean", "--if-exists"],
    { env: { ...process.env, PGPASSWORD: password }, maxBuffer: 64 * 1024 * 1024, encoding: "utf8" },
  );

  if (res.status !== 0 || !res.stdout) {
    console.error("[api/admin/backup] pg_dump falló:", res.stderr?.slice(0, 500));
    return NextResponse.json(
      { error: "pg_dump falló: " + (res.stderr?.split("\n")[0] ?? "error desconocido") },
      { status: 500 },
    );
  }

  const ts = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
  return new Response(res.stdout, {
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="sic_ml-backup-${ts}.sql"`,
      "Content-Length": String(Buffer.byteLength(res.stdout)),
    },
  });
}
