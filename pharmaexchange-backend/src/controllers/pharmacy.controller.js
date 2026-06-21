const prisma = require('../lib/prisma');

async function getProfile(req, res) {
  const { pharmacyId, userId } = req.user;

  const [pharmacy, user] = await Promise.all([
    prisma.pharmacy.findUnique({ where: { id: pharmacyId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } }),
  ]);

  if (!pharmacy || !user) return res.status(404).json({ error: 'Profile not found' });

  res.json({ pharmacy, user });
}

async function updateProfile(req, res) {
  const { pharmacyId, userId } = req.user;
  const { pharmacyName, address, city, state, lat, lng, name, email } = req.body;

  const [pharmacy, user] = await prisma.$transaction(async (tx) => {
    const updatedPharmacy = await tx.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        ...(pharmacyName && { name: pharmacyName }),
        ...(address !== undefined && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(lat !== undefined && { lat: lat === null ? null : Number(lat) }),
        ...(lng !== undefined && { lng: lng === null ? null : Number(lng) }),
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return [updatedPharmacy, updatedUser];
  });

  res.json({ pharmacy, user });
}

module.exports = { getProfile, updateProfile };
