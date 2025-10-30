const express = require('express');
const Joi = require('joi');
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRole } = require('../middlewares/auth');
const { validateBody, validateQuery, validateParams, commonSchemas } = require('../middlewares/validation');

const router = express.Router();


const orderSchemas = {
  create: Joi.object({
    shipping_address_id: Joi.number().integer().positive().required(),
    notes: Joi.string().max(500).allow('')
  }),
  
  verifyPayment: Joi.object({
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required()
  }),
  
  cancelOrder: Joi.object({
    reason: Joi.string().max(255).allow('')
  }),
  
  updateStatus: Joi.object({
    status: Joi.string().valid(
      'CREATED', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 
      'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'
    ).required()
  }),
  
  orderFilters: Joi.object({
    status: Joi.string().valid(
      'CREATED', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 
      'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'
    ),
    from_date: Joi.date().iso(),
    to_date: Joi.date().iso().min(Joi.ref('from_date'))
  }).concat(commonSchemas.pagination)
};


router.use(verifyToken);


router.post('/',
  authorizeRole('customer'),
  validateBody(orderSchemas.create),
  orderController.createOrder
);


router.get('/',
  authorizeRole('customer'),
  validateQuery(orderSchemas.orderFilters),
  orderController.getOrders
);


router.get('/:id',
  authorizeRole(['customer', 'admin', 'superadmin']),
  validateParams(commonSchemas.id),
  orderController.getOrderById
);


router.post('/:id/payment',
  authorizeRole('customer'),
  validateParams(commonSchemas.id),
  orderController.initiatePayment
);


router.post('/:id/payment/verify',
  authorizeRole('customer'),
  validateParams(commonSchemas.id),
  validateBody(orderSchemas.verifyPayment),
  orderController.verifyPayment
);


router.post('/:id/cancel',
  authorizeRole('customer'),
  validateParams(commonSchemas.id),
  validateBody(orderSchemas.cancelOrder),
  orderController.cancelOrder
);


router.get('/admin/all',
  authorizeRole(['admin', 'superadmin']),
  validateQuery(orderSchemas.orderFilters),
  orderController.getAllOrders
);

router.patch('/:id/status',
  authorizeRole(['admin', 'superadmin']),
  validateParams(commonSchemas.id),
  validateBody(orderSchemas.updateStatus),
  orderController.updateOrderStatus
);

module.exports = router;
