async function migrate(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  console.log(`Migrations not yet implemented. DATABASE_URL=${url}`);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});