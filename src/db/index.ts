import { mkdirSync } from "fs";
import path from "path";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import { MEMORY_SCHEMA_SQL } from "./memory-schema";

// DATABASE_URL works with local Postgres or a Supabase connection string, e.g.
//   postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL is required");
}

// Hosted databases like Supabase require SSL.
const needsSsl =
  Boolean(databaseUrl) &&
  (databaseUrl!.includes("supabase.co") || databaseUrl!.includes("sslmode=require"));

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __prediktPglite?: PGlite;
  __prediktDb?: AppDb;
};

export type AppDb =
  | ReturnType<typeof drizzlePg>
  | ReturnType<typeof drizzlePglite>;

async function createDb(): Promise<AppDb> {
  if (globalForDb.__prediktDb) return globalForDb.__prediktDb;

  if (databaseUrl) {
    const pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
        ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }

    const instance = drizzlePg(pool);
    globalForDb.__prediktDb = instance;
    return instance;
  }

  // Dev / preview fallback: local WASM Postgres so demo login works
  // without a hosted database. Production still requires DATABASE_URL.
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dataDir, { recursive: true });

  const client =
    globalForDb.__prediktPglite ?? (await PGlite.create(dataDir));
  await client.waitReady;
  await client.exec(MEMORY_SCHEMA_SQL);
  globalForDb.__prediktPglite = client;

  const instance = drizzlePglite(client);
  globalForDb.__prediktDb = instance;
  return instance;
}

export const db = await createDb();
