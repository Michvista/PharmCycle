require('dotenv').config();
const prisma = require('../src/lib/prisma');

async function main() {
  const ph = await prisma.pharmacy.findFirst({ where: { name: 'GreenLife Pharmacy' } });
  if (!ph) return console.log('Pharmacy not found');

  const existing = await prisma.alert.count({ where: { pharmacyId: ph.id } });
  console.log('Existing alerts:', existing);

  if (existing > 0) return;

  const risky = await prisma.inventoryItem.findMany({
    where: {
      pharmacyId: ph.id,
      status: { in: ['NEAR_EXPIRY', 'LOW_STOCK', 'OUT_OF_STOCK'] },
    },
    include: { medicine: true },
  });

  for (const item of risky) {
    const type = item.status === 'NEAR_EXPIRY' ? 'NEAR_EXPIRY' : item.status === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'LOW_STOCK';
    const label = `${item.medicine.name} ${item.medicine.strength}`;
    const message =
      type === 'NEAR_EXPIRY'
        ? `${label} (batch ${item.batchNumber}) is nearing expiry.`
        : type === 'OUT_OF_STOCK'
          ? `${label} is now out of stock.`
          : `${label} stock is running low (${item.quantity} units left).`;

    await prisma.alert.create({ data: { pharmacyId: ph.id, type, message } });
  }

  console.log(`Created ${risky.length} alerts for ${ph.name}`);
}

main().finally(() => prisma.$disconnect());
