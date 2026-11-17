import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no configurada");
  }
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

export * from "./schema";
