const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();


router.post('/razorpay',
  express.raw({ type: 'application/json' }),
  orderController.handleWebhook
);

module.exports = router;
