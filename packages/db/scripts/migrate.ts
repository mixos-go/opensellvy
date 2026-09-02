import { runMigrations } from '../src/migrations.js';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set');
}

runMigrations(url)
  .then(() => console.log('migrations selesai'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });