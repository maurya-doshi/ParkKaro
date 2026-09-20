import { seedDatabase } from '../seed';

export { seedDatabase };

if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log('Seed summary:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
