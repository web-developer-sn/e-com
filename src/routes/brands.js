const express = require('express');
const brandController = require('../controllers/brandController');
const { verifyToken, authorizeRole, optionalAuth } = require('../middlewares/auth');
const { validateBody, validateQuery, validateParams, brandSchemas, commonSchemas } = require('../middlewares/validation');

const router = express.Router();


router.get('/',
  optionalAuth,
  validateQuery(commonSchemas.pagination),
  brandController.getBrands
);

router.get('/:id',
  optionalAuth,
  validateParams(commonSchemas.id),
  brandController.getBrandById
);


router.post('/',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateBody(brandSchemas.create),
  brandController.createBrand
);

router.put('/:id',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  validateBody(brandSchemas.update),
  brandController.updateBrand
);

router.delete('/:id',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  brandController.deleteBrand
);

module.exports = router;

