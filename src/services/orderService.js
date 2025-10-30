const { db } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');
const cartService = require('./cartService');
const paymentService = require('./paymentService');
const notificationService = require('./notificationService');

class OrderService {
  generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-8)}-${random}`;
  }
  
  async createOrderFromCart(customerId, orderData) {
    const { shipping_address_id, notes } = orderData;
 
    const shippingAddress = await db('customer_addresses')
      .where('id', shipping_address_id)
      .where('customer_id', customerId)
      .first();
      
    if (!shippingAddress) {
      throw new AppError('Shipping address not found', 404);
    }
    
    const cartValidation = await cartService.validateCartForCheckout(customerId);
    if (!cartValidation.valid) {
      throw new AppError(`Cart validation failed: ${cartValidation.issues.join(', ')}`, 400);
    }
    
    const cart = cartValidation.cart;
    
    const subtotal = cart.summary.subtotal;
    const taxRate = 0.08; 
    const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
    const shippingAmount = subtotal > 100 ? 0 : 10.00; 
    const totalAmount = parseFloat((subtotal + taxAmount + shippingAmount).toFixed(2));
    
    const trx = await db.transaction();
    
    try {
      
      const [orderId] = await trx('orders').insert({
        order_number: this.generateOrderNumber(),
        customer_id: customerId,
        shipping_address_id,
        status: 'CREATED',
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        total_amount: totalAmount,
        currency: 'USD',
        notes
      });
      
    
      const orderItems = cart.items.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        store_id: item.store_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.price_snapshot,
        total_price: parseFloat((item.price_snapshot * item.quantity).toFixed(2))
      }));
      
      await trx('order_items').insert(orderItems);
      
 
      await trx('cart_items').where('cart_id', cart.id).del();
      
      await trx.commit();
      
  
      const order = await this.getOrderById(orderId, customerId);
      
   
      try {
        const customer = await db('customers').where('id', customerId).first();
        await notificationService.notifyOrderCreated(order, customer);
      } catch (notificationError) {
        console.warn('Failed to send order created notification:', notificationError.message);
      }
      
      return order;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  
  async getOrderById(orderId, customerId = null) {
    let query = db('orders as o')
      .select([
        'o.*',
        'ca.address_line1',
        'ca.address_line2',
        'ca.city',
        'ca.state',
        'ca.country',
        'ca.postal_code',
        'c.name as customer_name',
        'c.email as customer_email'
      ])
      .join('customer_addresses as ca', 'o.shipping_address_id', 'ca.id')
      .join('customers as c', 'o.customer_id', 'c.id')
      .where('o.id', orderId);
    
    if (customerId) {
      query = query.where('o.customer_id', customerId);
    }
    
    const order = await query.first();
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
  
    const items = await db('order_items as oi')
      .select([
        'oi.*',
        'p.status as current_product_status',
        'b.name as brand_name',
        's.name as store_name',
        's.code as store_code'
      ])
      .join('products as p', 'oi.product_id', 'p.id')
      .leftJoin('brands as b', 'p.brand_id', 'b.id')
      .join('stores as s', 'oi.store_id', 's.id')
      .where('oi.order_id', orderId)
      .orderBy('oi.id');
    
    return {
      ...order,
      items,
      shipping_address: {
        address_line1: order.address_line1,
        address_line2: order.address_line2,
        city: order.city,
        state: order.state,
        country: order.country,
        postal_code: order.postal_code
      }
    };
  }
  
  async getCustomerOrders(customerId, filters = {}, pagination = {}) {
    let query = db('orders as o')
      .select([
        'o.id',
        'o.order_number',
        'o.status',
        'o.total_amount',
        'o.currency',
        'o.created_at',
        'o.updated_at',
        db.raw('COUNT(oi.id) as item_count')
      ])
      .leftJoin('order_items as oi', 'o.id', 'oi.order_id')
      .where('o.customer_id', customerId)
      .groupBy('o.id');
    
    
    const { status, from_date, to_date } = filters;
    
    if (status) {
      query = query.where('o.status', status);
    }
    
    if (from_date) {
      query = query.where('o.created_at', '>=', from_date);
    }
    
    if (to_date) {
      query = query.where('o.created_at', '<=', to_date);
    }
    
    return await paginate(query, pagination);
  }
  
  async getAllOrders(filters = {}, pagination = {}) {
    let query = db('orders as o')
      .select([
        'o.id',
        'o.order_number',
        'o.customer_id',
        'o.status',
        'o.total_amount',
        'o.currency',
        'o.created_at',
        'o.updated_at',
        'c.name as customer_name',
        'c.email as customer_email',
        db.raw('COUNT(oi.id) as item_count')
      ])
      .join('customers as c', 'o.customer_id', 'c.id')
      .leftJoin('order_items as oi', 'o.id', 'oi.order_id')
      .groupBy('o.id');
    
  
    const { status, customer_id, from_date, to_date } = filters;
    
    if (status) {
      query = query.where('o.status', status);
    }
    
    if (customer_id) {
      query = query.where('o.customer_id', customer_id);
    }
    
    if (from_date) {
      query = query.where('o.created_at', '>=', from_date);
    }
    
    if (to_date) {
      query = query.where('o.created_at', '<=', to_date);
    }
    
    return await paginate(query, pagination);
  }
  
  async updateOrderStatus(orderId, status, adminId = null) {
    const validStatuses = [
      'CREATED', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 
      'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'
    ];
    
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid order status', 400);
    }
    
    const order = await db('orders').where('id', orderId).first();
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    const allowedTransitions = {
      'CREATED': ['PAYMENT_PENDING', 'CANCELLED'],
      'PAYMENT_PENDING': ['PAID', 'FAILED', 'CANCELLED'],
      'PAID': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': [], 
      'CANCELLED': [], 
      'FAILED': ['PAYMENT_PENDING'] 
    };
    
    if (!allowedTransitions[order.status].includes(status)) {
      throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
    }
    
    const updateData = {
      status,
      updated_at: db.fn.now()
    };
    

    if (status === 'PAID' && !order.payment_completed_at) {
      updateData.payment_completed_at = db.fn.now();
    }
    
    await db('orders').where('id', orderId).update(updateData);
    
    const updatedOrder = await this.getOrderById(orderId);
    
    try {
      const customer = await db('customers').where('id', updatedOrder.customer_id).first();
      
      switch (status) {
        case 'SHIPPED':
          await notificationService.notifyOrderShipped(updatedOrder, customer, {
            trackingNumber: 'TRK' + Date.now(),
            carrier: 'Standard Shipping',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
          break;
          
        case 'DELIVERED':
          await notificationService.notifyOrderDelivered(updatedOrder, customer);
          break;
          
        case 'CANCELLED':
          await notificationService.notifyOrderCancelled(updatedOrder, customer, 'Order cancelled by admin');
          break;
          
        case 'FAILED':
          await notificationService.notifyPaymentFailed(updatedOrder, customer, { message: 'Payment processing failed' });
          break;
      }
    } catch (notificationError) {
      console.warn(`Failed to send ${status} notification:`, notificationError.message);
    }
    
    return updatedOrder;
  }
  
  async initiatePayment(orderId, customerId) {
    const order = await this.getOrderById(orderId, customerId);
    
    if (order.status !== 'CREATED') {
      throw new AppError('Order is not in a state that allows payment initiation', 400);
    }
    
    const razorpayOrder = await paymentService.createOrder({
      amount: Math.round(order.total_amount * 100), 
      currency: order.currency,
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        customer_id: customerId
      }
    });
    
   
    await db('orders')
      .where('id', orderId)
      .update({
        razorpay_order_id: razorpayOrder.id,
        status: 'PAYMENT_PENDING',
        updated_at: db.fn.now()
      });
    
    return {
      order: await this.getOrderById(orderId, customerId),
      razorpay_order: razorpayOrder
    };
  }
  
  async verifyPayment(orderId, paymentData) {
    const { razorpay_payment_id, razorpay_signature } = paymentData;
    
    const order = await db('orders').where('id', orderId).first();
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    if (!order.razorpay_order_id) {
      throw new AppError('No Razorpay order found for this order', 400);
    }
    
   
    const isValid = paymentService.verifyPaymentSignature({
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    
    if (!isValid) {
      await this.updateOrderStatus(orderId, 'FAILED');
      throw new AppError('Payment verification failed', 400);
    }
    

    await db('orders')
      .where('id', orderId)
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'PAID',
        payment_completed_at: db.fn.now(),
        updated_at: db.fn.now()
      });
    
    const updatedOrder = await this.getOrderById(orderId);
    
    
    try {
      const customer = await db('customers').where('id', updatedOrder.customer_id).first();
      await notificationService.notifyPaymentSuccess(updatedOrder, customer, {
        razorpay_payment_id,
        method: 'Online'
      });
    } catch (notificationError) {
      console.warn('Failed to send payment success notification:', notificationError.message);
    }
    
    return updatedOrder;
  }
  
  async cancelOrder(orderId, customerId, reason = null) {
    const order = await this.getOrderById(orderId, customerId);
    
    const cancellableStatuses = ['CREATED', 'PAYMENT_PENDING', 'PAID', 'PROCESSING'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new AppError('Order cannot be cancelled in current status', 400);
    }
    

    if (order.status === 'PAID' && order.razorpay_payment_id) {
    
      console.log(`Refund needed for order ${orderId}, payment ${order.razorpay_payment_id}`);
    }
    
    await db('orders')
      .where('id', orderId)
      .update({
        status: 'CANCELLED',
        notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}`.trim() : order.notes,
        updated_at: db.fn.now()
      });
    
    const cancelledOrder = await this.getOrderById(orderId, customerId);
    
  
    try {
      const customer = await db('customers').where('id', customerId).first();
      await notificationService.notifyOrderCancelled(cancelledOrder, customer, reason);
    } catch (notificationError) {
      console.warn('Failed to send order cancellation notification:', notificationError.message);
    }
    
    return cancelledOrder;
  }
}

module.exports = new OrderService();
