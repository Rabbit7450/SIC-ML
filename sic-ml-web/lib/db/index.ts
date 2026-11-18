import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Pool ÚNICO compartido por toda la app (singleton en globalThis para sobrevivir
 * al hot-reload de dev). Antes se creaba un cliente por llamada y nunca se cerraba,
 * lo que agotaba max_connections de PostgreSQL ("remaining connection slots are
 * reserved..."). Con max: 5 el servidor nunca se queda sin ranuras.
 */
const globalForDb = globalThis as unknown as {
  __sicmlDb?: ReturnType<typeof drizzle>;
};

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no configurada");
  }
  if (!globalForDb.__sicmlDb) {
    const client = postgres(url, {
      prepare: false,
      max: 5, // pool acotado: nunca agota las conexiones del servidor
      idle_timeout: 30, // cierra conexiones inactivas tras 30 s
      max_lifetime: 30 * 60, // recicla conexiones cada 30 min
      connect_timeout: 10,
    });
    globalForDb.__sicmlDb = drizzle(client, { schema });
  }
  return globalForDb.__sicmlDb;
}

export * from "./schema";
