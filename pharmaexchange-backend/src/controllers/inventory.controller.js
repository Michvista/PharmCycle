const prisma = require('../lib/prisma');
const { computeStatus } = require('../utils/inventoryStatus');
const { extractMedicineLabel } = require('../lib/gemini-ocr');

/**
 * GET /inventory?status=NEAR_EXPIRY&search=paracetamol&page=1&limit=20
 */
async function listInventory(req, res) {
  const { pharmacyId } = req.user;
  const { status, search, page = 1, limit = 20 } = req.query;

  const where = {
    pharmacyId,
    ...(status && { status }),
    ...(search && {
      medicine: { name: { contains: search, mode: 'insensitive' } },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), limit: Number(limit) });
}

/**
 * POST /inventory
 * Body: { medicineId, quantity, costPrice, sellingPrice, batchNumber, expiryDate, imageUrl? }
 * If medicineId is omitted but medicineName/category/dosageForm/strength are given,
 * creates the Medicine record on the fly (handy for fast data entry / demo).
 */
async function createInventoryItem(req, res) {
  const { pharmacyId } = req.user;
  const {
    medicineId,
    medicineName,
    category,
    dosageForm,
    strength,
    quantity,
    costPrice,
    sellingPrice,
    batchNumber,
    expiryDate,
    imageUrl,
  } = req.body;

  if (!quantity || !costPrice || !sellingPrice || !batchNumber || !expiryDate) {
    return res.status(400).json({ error: 'Missing required inventory fields' });
  }

  let finalMedicineId = medicineId;

  if (!finalMedicineId) {
    if (!medicineName || !category || !dosageForm || !strength) {
      return res.status(400).json({ error: 'Provide medicineId OR medicine details to create one' });
    }
    const medicine = await prisma.medicine.upsert({
      where: { name_strength_dosageForm: { name: medicineName, strength, dosageForm } },
      update: {},
      create: { name: medicineName, category, dosageForm, strength },
    });
    finalMedicineId = medicine.id;
  }

  const status = computeStatus({ quantity, expiryDate });

  const item = await prisma.inventoryItem.create({
    data: {
      pharmacyId,
      medicineId: finalMedicineId,
      quantity: Number(quantity),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      batchNumber,
      expiryDate: new Date(expiryDate),
      status,
      imageUrl: imageUrl || null,
    },
    include: { medicine: true },
  });

  res.status(201).json(item);
}

/**
 * PATCH /inventory/:id
 * Recomputes status automatically if quantity or expiryDate changes.
 */
async function updateInventoryItem(req, res) {
  const { pharmacyId } = req.user;
  const { id } = req.params;
  const { quantity, costPrice, sellingPrice, batchNumber, expiryDate, imageUrl } = req.body;

  const existing = await prisma.inventoryItem.findFirst({ where: { id, pharmacyId } });
  if (!existing) return res.status(404).json({ error: 'Inventory item not found' });

  const nextQuantity = quantity !== undefined ? Number(quantity) : existing.quantity;
  const nextExpiryDate = expiryDate ? new Date(expiryDate) : existing.expiryDate;
  const status = computeStatus({ quantity: nextQuantity, expiryDate: nextExpiryDate });

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(quantity !== undefined && { quantity: nextQuantity }),
      ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
      ...(sellingPrice !== undefined && { sellingPrice: Number(sellingPrice) }),
      ...(batchNumber && { batchNumber }),
      ...(expiryDate && { expiryDate: nextExpiryDate }),
      ...(imageUrl && { imageUrl }),
      status,
    },
    include: { medicine: true },
  });

  res.json(updated);
}

/**
 * DELETE /inventory/:id
 */
async function deleteInventoryItem(req, res) {
  const { pharmacyId } = req.user;
  const { id } = req.params;

  const existing = await prisma.inventoryItem.findFirst({ where: { id, pharmacyId } });
  if (!existing) return res.status(404).json({ error: 'Inventory item not found' });

  await prisma.inventoryItem.delete({ where: { id } });
  res.status(204).send();
}

/**
 * GET /inventory/lookup?batch=BTH-2025-0412
 */
async function lookupByBatch(req, res) {
  const { pharmacyId } = req.user;
  const { batch } = req.query;

  if (!batch) return res.status(400).json({ error: 'batch query param required' });

  const item = await prisma.inventoryItem.findFirst({
    where: { pharmacyId, batchNumber: { equals: batch, mode: 'insensitive' } },
    include: { medicine: true },
  });

  if (!item) return res.status(404).json({ error: 'No inventory item found for this batch' });

  res.json(item);
}

/**
 * POST /inventory/ocr-label
 * Body: { image: "data:image/jpeg;base64,..." , mimeType?: "image/jpeg" }
 * Uses Gemini Vision when GEMINI_API_KEY is set. Returns 503 if not configured
 * so the frontend can fall back to browser Tesseract.
 */
async function ocrMedicineLabel(req, res) {
  const { image, mimeType } = req.body;
  if (!image) return res.status(400).json({ error: 'image (base64 data URL) is required' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Gemini OCR not configured — use browser OCR or add GEMINI_API_KEY' });
  }

  try {
    const extracted = await extractMedicineLabel(image, mimeType || 'image/jpeg');
    res.json({ source: 'gemini', extracted });
  } catch (err) {
    res.status(502).json({ error: err.message || 'OCR failed' });
  }
}

module.exports = { listInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, lookupByBatch, ocrMedicineLabel };
