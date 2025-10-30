const express = require('express');
const Joi = require('joi');
const cartController = require('../controllers/cartController');
const { verifyToken, authorizeRole } = require('../middlewares/auth');
const { validateBody, validateParams, commonSchemas } = require('../middlewares/validation');

const router = express.Router();


router.use(verifyToken);
router.use(authorizeRole('customer'));


const cartSchemas = {
  addItem: Joi.object({
    product_id: Joi.number().integer().positive().required(),
    store_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).max(100).default(1)
  }),
  
  updateItem: Joi.object({
    quantity: Joi.number().integer().min(0).max(100).required()
  })
};


router.get('/',
  cartController.getCart
);


router.post('/items',
  validateBody(cartSchemas.addItem),
  cartController.addItem
);


router.put('/items/:itemId',
  validateParams(commonSchemas.id.keys({
    itemId: Joi.number().integer().positive().required()
  })),
  validateBody(cartSchemas.updateItem),
  cartController.updateItem
);


router.delete('/items/:itemId',
  validateParams(commonSchemas.id.keys({
    itemId: Joi.number().integer().positive().required()
  })),
  cartController.removeItem
);


router.delete('/',
  cartController.clearCart
);


router.get('/validate',
  cartController.validateCart
);

module.exports = router;
