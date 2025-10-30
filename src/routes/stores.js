const express = require('express');
const Joi = require('joi');
const storeController = require('../controllers/storeController');
const { verifyToken, authorizeRole, optionalAuth } = require('../middlewares/auth');
const { validateBody, validateQuery, validateParams, storeSchemas, commonSchemas } = require('../middlewares/validation');

const router = express.Router();


router.get('/',
  optionalAuth,
  validateQuery(commonSchemas.pagination),
  storeController.getStores
);

router.get('/nearby',
  optionalAuth,
  validateQuery(storeSchemas.nearby),
  storeController.getNearbyStores
);

router.get('/:id',
  optionalAuth,
  validateParams(commonSchemas.id),
  storeController.getStoreById
);


router.post('/',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateBody(storeSchemas.create),
  storeController.createStore
);

router.put('/:id',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  validateBody(storeSchemas.update),
  storeController.updateStore
);

router.delete('/:id',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  storeController.deleteStore
);


router.post('/:id/products',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  validateBody(storeSchemas.assignProduct),
  storeController.assignProduct
);

router.delete('/:id/products/:productId',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(Joi.object({
    id: Joi.number().integer().positive().required(),
    productId: Joi.number().integer().positive().required()
  })),
  storeController.removeProduct
);

router.patch('/:id/products/:productId/stock',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(Joi.object({
    id: Joi.number().integer().positive().required(),
    productId: Joi.number().integer().positive().required()
  })),
  validateBody(Joi.object({
    stock: Joi.number().integer().min(0).required()
  })),
  storeController.updateProductStock
);

module.exports = router;
