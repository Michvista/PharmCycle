const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../lib/cloudinary');
const { uploadMedicineImage } = require('../controllers/images.controller');

router.post('/:id/image', requireAuth, upload.single('image'), uploadMedicineImage);

module.exports = router;
