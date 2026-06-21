const prisma = require('../lib/prisma');

/**
 * GET /alerts?read=false
 */
async function getAlerts(req, res) {
  const { pharmacyId } = req.user;
  const { read } = req.query;

  const alerts = await prisma.alert.findMany({
    where: {
      pharmacyId,
      ...(read !== undefined && { read: read === 'true' }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ alerts });
}

/**
 * PATCH /alerts/:id/read
 */
async function markAlertRead(req, res) {
  const { pharmacyId } = req.user;
  const { id } = req.params;

  const alert = await prisma.alert.findFirst({ where: { id, pharmacyId } });
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  const updated = await prisma.alert.update({ where: { id }, data: { read: true } });
  res.json(updated);
}

module.exports = { getAlerts, markAlertRead };
