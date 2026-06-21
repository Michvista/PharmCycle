const prisma = require('../lib/prisma');

/**
 * GET /transfers/available
 * Powers "Available Medicines for Transfer" cards on the dashboard.
 * Shows listings from OTHER pharmacies (not your own) that are still AVAILABLE.
 * Optional ?city= / ?state= filters for geolocation-style narrowing.
 */
async function getAvailableTransfers(req, res) {
  const { pharmacyId } = req.user;
  const { city, state, search } = req.query;

  const listings = await prisma.transferListing.findMany({
    where: {
      pharmacyId: { not: pharmacyId },
      status: 'AVAILABLE',
      ...(city && { pharmacy: { city: { equals: city, mode: 'insensitive' } } }),
      ...(state && { pharmacy: { state: { equals: state, mode: 'insensitive' } } }),
      ...(search && {
        inventoryItem: { medicine: { name: { contains: search, mode: 'insensitive' } } },
      }),
    },
    include: {
      pharmacy: { select: { id: true, name: true, city: true, state: true } },
      inventoryItem: { include: { medicine: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const cards = listings.map((l) => ({
    listingId: l.id,
    medicineName: l.inventoryItem.medicine.name,
    dosageForm: l.inventoryItem.medicine.dosageForm,
    strength: l.inventoryItem.medicine.strength,
    imageUrl: l.inventoryItem.imageUrl || l.inventoryItem.medicine.imageUrl,
    quantity: l.quantity,
    originalPrice: l.inventoryItem.sellingPrice,
    discountPercent: l.discountPercent,
    discountedPrice: Number((l.inventoryItem.sellingPrice * (1 - l.discountPercent / 100)).toFixed(2)),
    fromPharmacy: { id: l.pharmacy.id, name: l.pharmacy.name, city: l.pharmacy.city, state: l.pharmacy.state },
  }));

  res.json({ listings: cards });
}

/**
 * POST /transfers
 * Lists an inventory item for transfer (near-expiry or excess stock).
 * Body: { inventoryItemId, quantity, discountPercent }
 */
async function createTransferListing(req, res) {
  const { pharmacyId } = req.user;
  const { inventoryItemId, quantity, discountPercent } = req.body;

  if (!inventoryItemId || !quantity) {
    return res.status(400).json({ error: 'inventoryItemId and quantity are required' });
  }

  const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, pharmacyId } });
  if (!item) return res.status(404).json({ error: 'Inventory item not found' });

  if (quantity > item.quantity) {
    return res.status(400).json({ error: 'Cannot list more than current stock quantity' });
  }

  const listing = await prisma.transferListing.create({
    data: {
      inventoryItemId,
      pharmacyId,
      quantity: Number(quantity),
      discountPercent: Number(discountPercent) || 0,
      status: 'AVAILABLE',
    },
    include: { inventoryItem: { include: { medicine: true } } },
  });

  res.status(201).json(listing);
}

/**
 * POST /transfers/:id/request
 * Another pharmacy requests (some or all of) a listing.
 * Body: { quantity }
 */
async function requestTransfer(req, res) {
  const { pharmacyId } = req.user;
  const { id: listingId } = req.params;
  const { quantity } = req.body;

  if (!quantity) return res.status(400).json({ error: 'quantity is required' });

  const listing = await prisma.transferListing.findUnique({
    where: { id: listingId },
    include: { pharmacy: true, inventoryItem: { include: { medicine: true } } },
  });

  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== 'AVAILABLE') return res.status(400).json({ error: 'Listing is not available' });
  if (listing.pharmacyId === pharmacyId) {
    return res.status(400).json({ error: 'You cannot request your own listing' });
  }
  if (quantity > listing.quantity) {
    return res.status(400).json({ error: 'Requested quantity exceeds available quantity' });
  }

  const request = await prisma.transferRequest.create({
    data: {
      listingId,
      requestingPharmacyId: pharmacyId,
      quantity: Number(quantity),
      status: 'PENDING',
    },
  });

  // Mark listing PENDING so other pharmacies see it's being negotiated
  await prisma.transferListing.update({ where: { id: listingId }, data: { status: 'PENDING' } });

  // Alert the listing owner pharmacy
  await prisma.alert.create({
    data: {
      pharmacyId: listing.pharmacyId,
      type: 'TRANSFER_REQUEST',
      message: `New transfer request for ${listing.inventoryItem.medicine.name} (${quantity} units)`,
    },
  });

  res.status(201).json(request);
}

module.exports = { getAvailableTransfers, createTransferListing, requestTransfer };
