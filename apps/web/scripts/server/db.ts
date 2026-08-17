import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import pg from "pg";
import ws from "ws";
import * as schema from "@shared/schema";

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("NEON_DATABASE_URL or DATABASE_URL must be set");
}

/** Neon serverless WebSocket driver; everything else (Supabase, local, RDS) uses node-postgres. */
function isNeonConnectionString(url: string): boolean {
  return /neon\.tech|\.neon\./i.test(url);
}

function createDb() {
  if (isNeonConnectionString(connectionString)) {
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString });
    return drizzleNeon(pool, { schema });
  }

  const needsSsl =
    /supabase\.co|sslmode=require|amazonaws\.com/i.test(connectionString) ||
    process.env.PGSSLMODE === "require";

  const pool = new pg.Pool({
    connectionString,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  return drizzleNode(pool, { schema });
}

export const db = createDb();
