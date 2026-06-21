const prisma = require('../lib/prisma');
const { haversineDistanceKm } = require('../utils/geo');

/**
 * GET /pharmacies
 * Directory listing - powers "Partner Pharmacies / Across Nigeria" count and any
 * pharmacy browsing UI. Excludes the requesting pharmacy itself.
 */
async function listPharmacies(req, res) {
  const requesterPharmacyId = req.user?.pharmacyId;
  const { city, state, search, page = 1, limit = 20 } = req.query;

  const where = {
    ...(requesterPharmacyId && { id: { not: requesterPharmacyId } }),
    verified: true,
    ...(city && { city: { equals: city, mode: 'insensitive' } }),
    ...(state && { state: { equals: state, mode: 'insensitive' } }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };

  const [pharmacies, total] = await Promise.all([
    prisma.pharmacy.findMany({
      where,
      select: { id: true, name: true, city: true, state: true, lat: true, lng: true, logoUrl: true },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { name: 'asc' },
    }),
    prisma.pharmacy.count({ where }),
  ]);

  res.json({ pharmacies, total, page: Number(page), limit: Number(limit) });
}

/**
 * GET /pharmacies/nearby?lat=&lng=&radiusKm=20
 * Used both for transfer matching ("which partner pharmacies are nearby") and
 * as the underlying logic reused by /consumer/search.
 *
 * Strategy: pull verified pharmacies with non-null lat/lng (a reasonable bounding
 * pre-filter isn't necessary at hackathon data volumes), compute Haversine distance
 * in JS, filter by radius, sort by distance.
 */
async function getNearbyPharmacies(req, res) {
  const { lat, lng, radiusKm = 25 } = req.query;
  const requesterPharmacyId = req.user?.pharmacyId;

  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

  const pharmacies = await prisma.pharmacy.findMany({
    where: {
      verified: true,
      lat: { not: null },
      lng: { not: null },
      ...(requesterPharmacyId && { id: { not: requesterPharmacyId } }),
    },
    select: { id: true, name: true, city: true, state: true, lat: true, lng: true, address: true },
  });

  const withDistance = pharmacies
    .map((p) => ({ ...p, distanceKm: Number(haversineDistanceKm(Number(lat), Number(lng), p.lat, p.lng).toFixed(2)) }))
    .filter((p) => p.distanceKm <= Number(radiusKm))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ pharmacies: withDistance, count: withDistance.length, radiusKm: Number(radiusKm) });
}

module.exports = { listPharmacies, getNearbyPharmacies };
