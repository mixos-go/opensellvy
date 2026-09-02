import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

export interface MigrateOptions {
  /** Folder berisi *.sql; default packages/db/migrations. */
  dir?: string;
}

const defaultDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

export async function runMigrations(url: string, options: MigrateOptions = {}): Promise<void> {
  const pool = new Pool({ connectionString: url });
  try {
    const dir = options.dir ?? defaultDir;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await pool.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map((r) => r.name),
    );

    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(join(dir, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`migrated ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} gagal: ${(err as Error).message}`);
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}