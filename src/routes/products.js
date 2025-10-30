const express = require('express');
const Joi = require('joi');
const productController = require('../controllers/productController');
const { verifyToken, authorizeRole, optionalAuth } = require('../middlewares/auth');
const { validateBody, validateQuery, validateParams, productSchemas, commonSchemas } = require('../middlewares/validation');
const { uploadMultiple } = require('../middlewares/upload');

const router = express.Router();

// Public routes
router.get('/',
  optionalAuth,
  validateQuery(productSchemas.search),
  productController.getProducts
);

router.get('/:id',
  optionalAuth,
  validateParams(commonSchemas.id),
  productController.getProductById
);


router.post('/',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateBody(productSchemas.create),
  productController.createProduct
);

router.put('/:id',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  validateBody(productSchemas.update),
  productController.updateProduct
);

router.delete('/:id',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  productController.deleteProduct
);


router.post('/:id/images',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  uploadMultiple('images', 5),
  productController.uploadProductImages
);

router.delete('/:id/images/:imageId',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(Joi.object({
    id: Joi.number().integer().positive().required(),
    imageId: Joi.number().integer().positive().required()
  })),
  productController.removeProductImage
);


router.post('/:id/stores',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  validateBody(Joi.object({
    store_id: Joi.number().integer().positive().required(),
    stock: Joi.number().integer().min(0).default(0),
    price: Joi.number().min(0).precision(2).allow(null)
  })),
  productController.assignToStore
);

module.exports = router;
