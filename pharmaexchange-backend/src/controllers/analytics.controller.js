const prisma = require('../lib/prisma');

async function getAnalytics(req, res) {
  const { pharmacyId } = req.user;

  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);

  const [
    inventoryByCategory,
    transferCounts,
    completedTransfers,
    nearExpiryValue,
    partnerCount,
  ] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { pharmacyId },
      include: { medicine: { select: { category: true, name: true } } },
    }),
    prisma.transferRequest.groupBy({
      by: ['status'],
      where: {
        OR: [
          { requestingPharmacyId: pharmacyId },
          { listing: { pharmacyId } },
        ],
      },
      _count: { _all: true },
    }),
    prisma.transferRequest.count({
      where: {
        status: 'COMPLETED',
        OR: [
          { requestingPharmacyId: pharmacyId },
          { listing: { pharmacyId } },
        ],
      },
    }),
    prisma.inventoryItem.aggregate({
      where: { pharmacyId, status: { in: ['NEAR_EXPIRY', 'EXPIRED'] } },
      _sum: { quantity: true },
    }),
    prisma.pharmacy.count({ where: { id: { not: pharmacyId }, verified: true } }),
  ]);

  const categoryMap = {};
  for (const item of inventoryByCategory) {
    const cat = item.medicine.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  }

  const categoryBreakdown = Object.entries(categoryMap).map(([label, count]) => ({
    label,
    count,
  }));

  const statusMap = Object.fromEntries(
    transferCounts.map((t) => [t.status, t._count._all])
  );

  res.json({
    inventoryTurnover: completedTransfers > 0 ? Number((inventoryByCategory.length / Math.max(completedTransfers, 1)).toFixed(1)) : 0,
    completedTransfers,
    partnerPharmacies: partnerCount,
    atRiskUnits: nearExpiryValue._sum.quantity || 0,
    transferSummary: {
      pending: statusMap.PENDING || 0,
      accepted: statusMap.ACCEPTED || 0,
      completed: statusMap.COMPLETED || 0,
      rejected: statusMap.REJECTED || 0,
    },
    categoryBreakdown,
    totalItems: inventoryByCategory.length,
  });
}

module.exports = { getAnalytics };
