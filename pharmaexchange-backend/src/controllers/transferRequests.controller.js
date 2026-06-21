const prisma = require('../lib/prisma');
const { sendNotification } = require('../lib/notifications');

/**
 * GET /transfer-requests?direction=incoming|outgoing
 * Incoming = requests made by other pharmacies on MY listings.
 * Outgoing = requests I made on other pharmacies' listings.
 */
async function getTransferRequests(req, res) {
  const { pharmacyId } = req.user;
  const { direction = 'incoming', status } = req.query;

  let requests;

  if (direction === 'outgoing') {
    requests = await prisma.transferRequest.findMany({
      where: { requestingPharmacyId: pharmacyId, ...(status && { status }) },
      include: {
        listing: {
          include: {
            pharmacy: { select: { id: true, name: true, city: true, state: true } },
            inventoryItem: { include: { medicine: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    requests = await prisma.transferRequest.findMany({
      where: {
        status: status || undefined,
        listing: { pharmacyId },
      },
      include: {
        requestingPharmacy: { select: { id: true, name: true, city: true, state: true } },
        listing: { include: { inventoryItem: { include: { medicine: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  res.json({ requests, direction });
}

/**
 * PATCH /transfer-requests/:id
 * Body: { action: 'accept' | 'reject' }
 * Only the pharmacy that OWNS the listing can accept/reject a request on it.
 */
async function updateTransferRequest(req, res) {
  const { pharmacyId } = req.user;
  const { id } = req.params;
  const { action } = req.body;

  if (!['accept', 'reject', 'complete'].includes(action)) {
    return res.status(400).json({ error: "action must be 'accept', 'reject', or 'complete'" });
  }

  const request = await prisma.transferRequest.findUnique({
    where: { id },
    include: {
      listing: { include: { inventoryItem: { include: { medicine: true } } } },
      requestingPharmacy: true,
    },
  });

  if (!request) return res.status(404).json({ error: 'Transfer request not found' });
  if (request.listing.pharmacyId !== pharmacyId) {
    return res.status(403).json({ error: 'You do not own this listing' });
  }
  if (request.status !== 'PENDING' && !(action === 'complete' && request.status === 'ACCEPTED')) {
    return res.status(400).json({ error: 'This request cannot be updated in its current state' });
  }

  let newStatus;
  if (action === 'accept') newStatus = 'ACCEPTED';
  else if (action === 'reject') newStatus = 'REJECTED';
  else newStatus = 'COMPLETED';

  const updated = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.transferRequest.update({
      where: { id },
      data: { status: newStatus },
    });

    if (action === 'accept') {
      await tx.inventoryItem.update({
        where: { id: request.listing.inventoryItemId },
        data: { quantity: { decrement: request.quantity } },
      });
      await tx.transferListing.update({
        where: { id: request.listingId },
        data: { status: 'PENDING' },
      });
    } else if (action === 'reject') {
      await tx.transferListing.update({
        where: { id: request.listingId },
        data: { status: 'AVAILABLE' },
      });
    } else if (action === 'complete') {
      await tx.transferListing.update({
        where: { id: request.listingId },
        data: { status: 'COMPLETED' },
      });
    }

    return updatedRequest;
  });

  // Notify the requesting pharmacy's admin user (best-effort, non-blocking on failure)
  const requestingAdmin = await prisma.user.findFirst({
    where: { pharmacyId: request.requestingPharmacyId, role: 'ADMIN' },
  });

  if (requestingAdmin) {
    await sendNotification({
      recipientType: 'USER',
      recipientId: requestingAdmin.id,
      to: requestingAdmin.email,
      subject: `Transfer request ${newStatus.toLowerCase()}`,
      body: `Your request for ${request.listing.inventoryItem.medicine.name} (${request.quantity} units) was ${newStatus.toLowerCase()}.`,
    });
  }

  res.json(updated);
}

async function getTransferRequestSummary(req, res) {
  const { pharmacyId } = req.user;

  const [incoming, outgoing, byStatus] = await Promise.all([
    prisma.transferRequest.count({ where: { listing: { pharmacyId }, status: 'PENDING' } }),
    prisma.transferRequest.count({ where: { requestingPharmacyId: pharmacyId } }),
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
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));

  res.json({
    incomingPending: incoming,
    outgoingTotal: outgoing,
    pending: statusMap.PENDING || 0,
    inTransit: statusMap.ACCEPTED || 0,
    completed: statusMap.COMPLETED || 0,
    cancelled: statusMap.REJECTED || 0,
    total: Object.values(statusMap).reduce((a, b) => a + b, 0),
  });
}

module.exports = { getTransferRequests, updateTransferRequest, getTransferRequestSummary };
