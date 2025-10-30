const express = require('express');
const uploadController = require('../controllers/uploadController');
const { verifyToken, authorizeRole } = require('../middlewares/auth');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload');

const router = express.Router();


router.use(verifyToken);
router.use(authorizeRole(['admin', 'superadmin', 'customer']));


router.post('/single',
  uploadSingle('image'),
  uploadController.uploadSingle
);


router.post('/multiple',
  uploadMultiple('images', 10),
  uploadController.uploadMultiple
);


router.delete('/:public_id',
  uploadController.deleteImage
);


router.get('/transformations',
  uploadController.getTransformations
);

module.exports = router;

