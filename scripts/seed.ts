async function seed(): Promise<void> {
  console.log('Seeding not yet implemented');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});