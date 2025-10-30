const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');

class OrderController {
  async createOrder(req, res) {
    const order = await orderService.createOrderFromCart(req.user.id, req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: order
    });
  }
  
  async getOrders(req, res) {
    const result = await orderService.getCustomerOrders(req.user.id, req.query, {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort
    });
    
    res.json({
      status: 'success',
      data: result.data,
      meta: result.meta
    });
  }
  
  async getOrderById(req, res) {
    const order = await orderService.getOrderById(req.params.id, req.user.id);
    
    res.json({
      status: 'success',
      data: order
    });
  }
  
  async initiatePayment(req, res) {
    const result = await orderService.initiatePayment(req.params.id, req.user.id);
    
    res.json({
      status: 'success',
      message: 'Payment initiated',
      data: {
        order: result.order,
        razorpay_key_id: process.env.RAZORPAY_KEY_ID,
        razorpay_order_id: result.razorpay_order.id,
        amount: result.razorpay_order.amount,
        currency: result.razorpay_order.currency
      }
    });
  }
  
  async verifyPayment(req, res) {
    const order = await orderService.verifyPayment(req.params.id, req.body);
    
    res.json({
      status: 'success',
      message: 'Payment verified successfully',
      data: order
    });
  }
  
  async cancelOrder(req, res) {
    const { reason } = req.body;
    const order = await orderService.cancelOrder(req.params.id, req.user.id, reason);
    
    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: order
    });
  }
  

  async getAllOrders(req, res) {
    const result = await orderService.getAllOrders(req.query, {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort
    });
    
    res.json({
      status: 'success',
      data: result.data,
      meta: result.meta
    });
  }
  
  async updateOrderStatus(req, res) {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, req.user.id);
    
    res.json({
      status: 'success',
      message: 'Order status updated',
      data: order
    });
  }
  
  // Razorpay
  async handleWebhook(req, res) {
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing signature'
      });
    }
    
    const body = JSON.stringify(req.body);
    const isValid = paymentService.verifyWebhookSignature(body, signature);
    
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid signature'
      });
    }
    
    try {
      const result = await paymentService.handleWebhook(req.body);
      
      res.json({
        status: 'success',
        message: 'Webhook processed',
        data: result
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Webhook processing failed'
      });
    }
  }
}

module.exports = new OrderController();
