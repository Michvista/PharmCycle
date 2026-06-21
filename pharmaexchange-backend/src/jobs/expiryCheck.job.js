const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { computeStatus } = require('../utils/inventoryStatus');

/**
 * Runs daily (and once immediately on server start) to:
 *  1. Recompute every inventory item's status (an item that was HEALTHY
 *     yesterday may have crossed into NEAR_EXPIRY today purely due to time
 *     passing - nobody has to "touch" the record for that to happen).
 *  2. Create an Alert the first time an item flips into NEAR_EXPIRY or
 *     LOW_STOCK, so the Alerts panel reflects reality without manual entry.
 *
 * For a hackathon demo: call this once after seeding so your alerts/dashboard
 * aren't empty, then again live on stage if you want to show it "noticing" change.
 */
async function runExpiryCheck() {
  const items = await prisma.inventoryItem.findMany({ include: { medicine: true } });

  let alertsCreated = 0;

  for (const item of items) {
    const newStatus = computeStatus({ quantity: item.quantity, expiryDate: item.expiryDate });

    if (newStatus !== item.status) {
      await prisma.inventoryItem.update({ where: { id: item.id }, data: { status: newStatus } });
    }

    // Create alerts for risky items (on status change OR if no recent alert exists yet)
    const label = `${item.medicine.name} ${item.medicine.strength}`;

    if (newStatus === 'NEAR_EXPIRY') {
      const exists = await prisma.alert.findFirst({
        where: {
          pharmacyId: item.pharmacyId,
          type: 'NEAR_EXPIRY',
          message: { contains: item.batchNumber },
          createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
        },
      });
      if (!exists || newStatus !== item.status) {
        await prisma.alert.create({
          data: {
            pharmacyId: item.pharmacyId,
            type: 'NEAR_EXPIRY',
            message: `${label} (batch ${item.batchNumber}) is nearing expiry.`,
          },
        });
        alertsCreated++;
      }
    }

    if (newStatus === 'LOW_STOCK') {
      const exists = await prisma.alert.findFirst({
        where: {
          pharmacyId: item.pharmacyId,
          type: 'LOW_STOCK',
          message: { contains: label },
          createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
        },
      });
      if (!exists || newStatus !== item.status) {
        await prisma.alert.create({
          data: {
            pharmacyId: item.pharmacyId,
            type: 'LOW_STOCK',
            message: `${label} stock is running low (${item.quantity} units left).`,
          },
        });
        alertsCreated++;
      }
    }

    if (newStatus === 'OUT_OF_STOCK') {
      const exists = await prisma.alert.findFirst({
        where: {
          pharmacyId: item.pharmacyId,
          type: 'OUT_OF_STOCK',
          message: { contains: label },
          createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
        },
      });
      if (!exists || newStatus !== item.status) {
        await prisma.alert.create({
          data: {
            pharmacyId: item.pharmacyId,
            type: 'OUT_OF_STOCK',
            message: `${label} is now out of stock.`,
          },
        });
        alertsCreated++;
      }
    }
  }

  console.log(`[expiryCheck] checked ${items.length} items, ${alertsCreated} new alerts created`);
}

function startExpiryCheckJob() {
  // Run once on boot so the demo has fresh data immediately
  runExpiryCheck().catch((err) => console.error('[expiryCheck] initial run failed:', err));

  // Then daily at 1am
  cron.schedule('0 1 * * *', () => {
    runExpiryCheck().catch((err) => console.error('[expiryCheck] scheduled run failed:', err));
  });
}

module.exports = { startExpiryCheckJob, runExpiryCheck };
