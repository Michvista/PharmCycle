require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

async function main() {
  const pw = await bcrypt.hash('password123', 10);
  const c = await prisma.consumer.upsert({
    where: { email: 'chidinma@demo.com' },
    update: {},
    create: {
      name: 'Chidinma Okafor',
      email: 'chidinma@demo.com',
      password: pw,
      city: 'Lagos',
      state: 'Lagos',
      lat: 6.5244,
      lng: 3.3792,
    },
  });
  console.log('Consumer ready:', c.email);
}

main().finally(() => prisma.$disconnect());
