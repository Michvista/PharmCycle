const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../lib/cloudinary');
const {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  lookupByBatch,
  ocrMedicineLabel,
} = require('../controllers/inventory.controller');
const { uploadInventoryImage } = require('../controllers/images.controller');

router.use(requireAuth);

router.get('/lookup', lookupByBatch);
router.post('/ocr-label', ocrMedicineLabel);
router.get('/', listInventory);
router.post('/', createInventoryItem);
router.patch('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);
router.post('/:id/image', upload.single('image'), uploadInventoryImage);

module.exports = router;
