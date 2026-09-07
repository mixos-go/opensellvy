import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { schema } from '@opensellvy/db-pg';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type Db = NodePgDatabase<typeof schema>;

export function createDatabase(url: string): Db {
  const pool = new Pool({ connectionString: url, max: 10 });
  return drizzle(pool, { schema });
}
