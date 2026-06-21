const prisma = require('../lib/prisma');
const { uploadBufferToCloudinary } = require('../lib/cloudinary');

/**
 * POST /inventory/:id/image  (multipart/form-data, field name: "image")
 */
async function uploadInventoryImage(req, res) {
  const { pharmacyId } = req.user;
  const { id } = req.params;

  if (!req.file) return res.status(400).json({ error: 'No image file provided (field name: image)' });

  const item = await prisma.inventoryItem.findFirst({ where: { id, pharmacyId } });
  if (!item) return res.status(404).json({ error: 'Inventory item not found' });

  const result = await uploadBufferToCloudinary(req.file.buffer, 'pharmaexchange/inventory');

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: { imageUrl: result.secure_url },
  });

  res.json({ imageUrl: updated.imageUrl });
}

/**
 * POST /medicines/:id/image  (multipart/form-data, field name: "image")
 * Sets the default/fallback image for a medicine (used when a specific
 * inventory item hasn't uploaded its own photo).
 */
async function uploadMedicineImage(req, res) {
  const { id } = req.params;

  if (!req.file) return res.status(400).json({ error: 'No image file provided (field name: image)' });

  const medicine = await prisma.medicine.findUnique({ where: { id } });
  if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

  const result = await uploadBufferToCloudinary(req.file.buffer, 'pharmaexchange/medicines');

  const updated = await prisma.medicine.update({
    where: { id },
    data: { imageUrl: result.secure_url },
  });

  res.json({ imageUrl: updated.imageUrl });
}

module.exports = { uploadInventoryImage, uploadMedicineImage };
