import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Avoid throwing on import; runtime will fail clearly if used without env
  // eslint-disable-next-line no-console
  console.warn("DATABASE_URL is not set. Drizzle client will fail if used.");
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool);
