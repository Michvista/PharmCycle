const prisma = require('../lib/prisma');
const { haversineDistanceKm } = require('../utils/geo');

/**
 * GET /consumer/search?medicine=paracetamol&city=Lagos&state=Lagos&lat=&lng=
 * Public-ish search: "which pharmacies currently have this medicine in stock".
 * If lat/lng provided, results are sorted by distance; otherwise by price.
 */
async function searchMedicine(req, res) {
  const { medicine, city, state, lat, lng } = req.query;

  if (!medicine) return res.status(400).json({ error: 'medicine query param is required' });

  const items = await prisma.inventoryItem.findMany({
    where: {
      quantity: { gt: 0 },
      status: { notIn: ['OUT_OF_STOCK', 'EXPIRED'] },
      medicine: { name: { contains: medicine, mode: 'insensitive' } },
      pharmacy: {
        verified: true,
        ...(city && { city: { equals: city, mode: 'insensitive' } }),
        ...(state && { state: { equals: state, mode: 'insensitive' } }),
      },
    },
    include: {
      medicine: true,
      pharmacy: { select: { id: true, name: true, address: true, city: true, state: true, lat: true, lng: true } },
    },
  });

  let results = items.map((i) => ({
    inventoryItemId: i.id,
    medicineName: i.medicine.name,
    dosageForm: i.medicine.dosageForm,
    strength: i.medicine.strength,
    price: i.sellingPrice,
    quantityAvailable: i.quantity,
    pharmacy: {
      id: i.pharmacy.id,
      name: i.pharmacy.name,
      address: i.pharmacy.address,
      city: i.pharmacy.city,
      state: i.pharmacy.state,
    },
    distanceKm:
      lat && lng && i.pharmacy.lat && i.pharmacy.lng
        ? Number(haversineDistanceKm(Number(lat), Number(lng), i.pharmacy.lat, i.pharmacy.lng).toFixed(2))
        : null,
  }));

  if (lat && lng) {
    results = results.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  } else {
    results = results.sort((a, b) => a.price - b.price);
  }

  res.json({ results, count: results.length });
}

/**
 * GET /consumer/medicines/:id/availability?lat=&lng=
 * Given a Medicine id, list every pharmacy currently stocking it, sorted by
 * distance (if lat/lng given) or price otherwise.
 */
async function getMedicineAvailability(req, res) {
  const { id } = req.params;
  const { lat, lng } = req.query;

  const medicine = await prisma.medicine.findUnique({ where: { id } });
  if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

  const items = await prisma.inventoryItem.findMany({
    where: {
      medicineId: id,
      quantity: { gt: 0 },
      status: { notIn: ['OUT_OF_STOCK', 'EXPIRED'] },
      pharmacy: { verified: true },
    },
    include: {
      pharmacy: { select: { id: true, name: true, address: true, city: true, state: true, lat: true, lng: true } },
    },
  });

  let availability = items.map((i) => ({
    inventoryItemId: i.id,
    price: i.sellingPrice,
    quantityAvailable: i.quantity,
    pharmacy: i.pharmacy,
    distanceKm:
      lat && lng && i.pharmacy.lat && i.pharmacy.lng
        ? Number(haversineDistanceKm(Number(lat), Number(lng), i.pharmacy.lat, i.pharmacy.lng).toFixed(2))
        : null,
  }));

  availability = lat && lng
    ? availability.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    : availability.sort((a, b) => a.price - b.price);

  res.json({ medicine, availability });
}

module.exports = { searchMedicine, getMedicineAvailability };
