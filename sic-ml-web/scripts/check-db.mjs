/**
 * Verifica la conexión de sic-ml-web con PostgreSQL (la misma base que DBeaver).
 *
 *   npm run db:check            # usa DATABASE_URL del entorno o de .env.local
 *   DATABASE_URL=... npm run db:check
 *
 * Comprueba: conexión TCP, esquema (tablas/vistas) y login local con crypt().
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postgres from "postgres";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
  try {
    const content = readFileSync(path.join(root, ".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* sin .env.local */ }
}

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("FALLO: define DATABASE_URL (p. ej. postgresql://sicml:clave@127.0.0.1:5432/sic_ml)");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });
try {
  const server = await sql`SELECT version() AS v`;
  console.log("OK  conexión:", url.replace(/:[^:@]+@/, ":***@"));
  console.log("OK  servidor:", server[0].v.split(",")[0]);

  const tables = await sql`
    SELECT table_name, table_type FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%'
    ORDER BY table_type, table_name`;
  console.log(`OK  esquema public: ${tables.length} objetos`);
  for (const t of tables) console.log(`    - ${t.table_type === "VIEW" ? "vista " : "tabla "}${t.table_name}`);

  const counts = await sql`
    SELECT 'profiles' AS t, count(*)::int AS n FROM v_profiles_active
    UNION ALL SELECT 'alerts', count(*)::int FROM v_alerts_active
    UNION ALL SELECT 'devices', count(*)::int FROM v_devices_active
    UNION ALL SELECT 'scans', count(*)::int FROM v_scans_active
    UNION ALL SELECT 'models', count(*)::int FROM v_models_active
    UNION ALL SELECT 'reports', count(*)::int FROM v_reports_active
    UNION ALL SELECT 'audit_logs', count(*)::int FROM audit_logs WHERE deleted_at IS NULL
    ORDER BY 1`;
  for (const c of counts) console.log(`    · ${c.t}: ${c.n} activos`);

  const login = await sql`
    SELECT id, role FROM profiles
    WHERE lower(email) = lower('admin@lab.local') AND deleted_at IS NULL
      AND password_hash = crypt('Admin123!', password_hash) LIMIT 1`;
  console.log(login[0] ? `OK  login admin@lab.local → rol ${login[0].role}` : "AVISO login de prueba falló (cambia la contraseña inicial con 005_seed_operational_data.sql)");

  console.log("\nDBeaver: misma conexión → host 127.0.0.1, puerto 5432, base sic_ml, usuario sicml.");
} catch (err) {
  console.error("FALLO de conexión:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
