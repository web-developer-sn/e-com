const Razorpay = require('razorpay');
const crypto = require('crypto');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../config/logger');

class PaymentService {
  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      logger.warn('⚠️  Razorpay credentials not configured. Payment functionality will not work.');
      this.razorpay = null;
    } else {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    }
  }
  
  async createOrder(orderData) {
    if (!this.razorpay) {
      throw new AppError('Payment service not configured', 500);
    }
    
    try {
      const options = {
        amount: orderData.amount, 
        currency: orderData.currency || 'INR',
        receipt: orderData.receipt,
        notes: orderData.notes || {}
      };
      
      const razorpayOrder = await this.razorpay.orders.create(options);
      
      logger.info('Razorpay order created:', {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      });
      
      return razorpayOrder;
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      throw new AppError('Failed to create payment order: ' + error.message, 500);
    }
  }
  
  verifyPaymentSignature(paymentData) {
    if (!this.razorpay) {
      throw new AppError('Payment service not configured', 500);
    }
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    
    try {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      
      const isValid = expectedSignature === razorpay_signature;
      
      logger.info('Payment signature verification:', {
        razorpay_order_id,
        razorpay_payment_id,
        isValid
      });
      
      return isValid;
    } catch (error) {
      logger.error('Payment signature verification failed:', error);
      return false;
    }
  }
  
  async getPaymentDetails(paymentId) {
    if (!this.razorpay) {
      throw new AppError('Payment service not configured', 500);
    }
    
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      logger.error('Failed to fetch payment details:', error);
      throw new AppError('Failed to fetch payment details: ' + error.message, 500);
    }
  }
  
  async getOrderDetails(orderId) {
    if (!this.razorpay) {
      throw new AppError('Payment service not configured', 500);
    }
    
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      logger.error('Failed to fetch order details:', error);
      throw new AppError('Failed to fetch order details: ' + error.message, 500);
    }
  }
  
  async createRefund(paymentId, amount = null, notes = {}) {
    if (!this.razorpay) {
      throw new AppError('Payment service not configured', 500);
    }
    
    try {
      const refundData = {
        notes
      };
      
      if (amount) {
        refundData.amount = amount; 
      }
      
      const refund = await this.razorpay.payments.refund(paymentId, refundData);
      
      logger.info('Refund created:', {
        id: refund.id,
        payment_id: paymentId,
        amount: refund.amount,
        status: refund.status
      });
      
      return refund;
    } catch (error) {
      logger.error('Refund creation failed:', error);
      throw new AppError('Failed to create refund: ' + error.message, 500);
    }
  }
  
  async getRefundDetails(refundId) {
    if (!this.razorpay) {
      throw new AppError('Payment service not configured', 500);
    }
    
    try {
      const refund = await this.razorpay.refunds.fetch(refundId);
      return refund;
    } catch (error) {
      logger.error('Failed to fetch refund details:', error);
      throw new AppError('Failed to fetch refund details: ' + error.message, 500);
    }
  }
  
  verifyWebhookSignature(body, signature) {
    if (!this.razorpay) {
      throw new AppError('Payment service not configured', 500);
    }
    
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return false;
    }
  }
  
  async handleWebhook(event) {
    logger.info('Processing Razorpay webhook:', {
      event: event.event,
      entity: event.payload?.payment?.entity || event.payload?.order?.entity
    });
    
    switch (event.event) {
      case 'payment.captured':
        return await this.handlePaymentCaptured(event.payload.payment.entity);
      
      case 'payment.failed':
        return await this.handlePaymentFailed(event.payload.payment.entity);
      
      case 'order.paid':
        return await this.handleOrderPaid(event.payload.order.entity);
      
      case 'refund.created':
        return await this.handleRefundCreated(event.payload.refund.entity);
      
      default:
        logger.info('Unhandled webhook event:', event.event);
        return { status: 'ignored' };
    }
  }
  
  async handlePaymentCaptured(payment) {
 
    logger.info('Payment captured:', payment.id);
    return { status: 'processed' };
  }
  
  async handlePaymentFailed(payment) {
 
    logger.info('Payment failed:', payment.id);
    return { status: 'processed' };
  }
  
  async handleOrderPaid(order) {
 
    logger.info('Order paid:', order.id);
    return { status: 'processed' };
  }
  
  async handleRefundCreated(refund) {
 
    logger.info('Refund created:', refund.id);
    return { status: 'processed' };
  }
  
  
  convertToRupees(paise) {
    return parseFloat((paise / 100).toFixed(2));
  }
  
  convertToPaise(rupees) {
    return Math.round(rupees * 100);
  }
  
  formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

module.exports = new PaymentService();
