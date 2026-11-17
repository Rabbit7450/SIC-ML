import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute(sql`select current_database() as database, current_user as user`);
    const connection = result[0] as { database: string; user: string } | undefined;

    return NextResponse.json({ ok: true, connection });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo conectar a PostgreSQL local." },
      { status: 503 },
    );
  }
}
