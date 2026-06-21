const prisma = require('../lib/prisma');

/**
 * GET /dashboard/summary
 * Powers the four top cards: Total Inventory Items, Near Expiry Items,
 * Active Transfers, Partner Pharmacies.
 */
async function getSummary(req, res) {
  const { pharmacyId } = req.user;

  const [totalItemsAgg, nearExpiryCount, activeTransfersCount, partnerPharmaciesCount] = await Promise.all([
    prisma.inventoryItem.aggregate({
      where: { pharmacyId },
      _sum: { quantity: true },
      _count: { _all: true },
    }),
    prisma.inventoryItem.count({
      where: { pharmacyId, status: 'NEAR_EXPIRY' },
    }),
    prisma.transferListing.count({
      where: {
        pharmacyId,
        status: { in: ['AVAILABLE', 'PENDING'] },
      },
    }),
    prisma.pharmacy.count({
      where: { id: { not: pharmacyId }, verified: true },
    }),
  ]);

  res.json({
    totalInventoryItems: totalItemsAgg._count._all,
    nearExpiryItems: nearExpiryCount,
    activeTransfers: activeTransfersCount,
    partnerPharmacies: partnerPharmaciesCount,
  });
}

/**
 * GET /dashboard/inventory-status
 * Powers the donut chart: Healthy / Low Stock / Near Expiry / Out of Stock
 */
async function getInventoryStatusBreakdown(req, res) {
  const { pharmacyId } = req.user;

  const grouped = await prisma.inventoryItem.groupBy({
    by: ['status'],
    where: { pharmacyId },
    _count: { _all: true },
  });

  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

  // Ensure all statuses appear even if count is 0, so the frontend donut never breaks
  const statuses = ['HEALTHY', 'LOW_STOCK', 'NEAR_EXPIRY', 'OUT_OF_STOCK', 'EXPIRED'];
  const breakdown = statuses.map((status) => {
    const match = grouped.find((g) => g.status === status);
    const count = match ? match._count._all : 0;
    return {
      status,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    };
  });

  res.json({ total, breakdown });
}

module.exports = { getSummary, getInventoryStatusBreakdown };
