const express = require('express');
const categoryController = require('../controllers/categoryController');
const { verifyToken, authorizeRole, optionalAuth } = require('../middlewares/auth');
const { validateBody, validateQuery, validateParams, categorySchemas, commonSchemas } = require('../middlewares/validation');

const router = express.Router();


router.get('/',
  optionalAuth,
  validateQuery(commonSchemas.pagination),
  categoryController.getCategories
);

router.get('/tree',
  optionalAuth,
  categoryController.getCategoryTree
);

router.get('/:id',
  optionalAuth,
  validateParams(commonSchemas.id),
  categoryController.getCategoryById
);


router.post('/',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateBody(categorySchemas.create),
  categoryController.createCategory
);

router.put('/:id',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  validateBody(categorySchemas.update),
  categoryController.updateCategory
);

router.delete('/:id',
  verifyToken,
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  categoryController.deleteCategory
);

module.exports = router;

