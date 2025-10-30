const logger = require('../config/logger');
const emailProvider = require('./providers/emailProvider');
const pushProvider = require('./providers/pushProvider');

class NotificationService {
  constructor() {
    this.providers = {
      email: emailProvider,
      push: pushProvider
    };
    
    this.templates = {
      email: {
        orderCreated: 'order-created',
        paymentSuccess: 'payment-success',
        paymentFailed: 'payment-failed',
        orderShipped: 'order-shipped',
        orderDelivered: 'order-delivered',
        orderCancelled: 'order-cancelled',
        contactForm: 'contact-form',
        welcomeCustomer: 'welcome-customer'
      }
    };
  }

  async sendNotification(type, channel, recipient, data, options = {}) {
    try {
      const provider = this.providers[channel];
      if (!provider) {
        throw new Error(`Notification provider '${channel}' not found`);
      }

      const template = this.templates[channel]?.[type];
      if (!template) {
        throw new Error(`Template '${type}' not found for channel '${channel}'`);
      }

      const result = await provider.send({
        template,
        recipient,
        data,
        ...options
      });

      logger.info('Notification sent successfully', {
        type,
        channel,
        recipient: this.maskRecipient(recipient),
        template
      });

      return result;
    } catch (error) {
      logger.error('Failed to send notification', {
        type,
        channel,
        recipient: this.maskRecipient(recipient),
        error: error.message
      });
      
      
      return { success: false, error: error.message };
    }
  }

  async sendMultipleNotifications(notifications) {
    const results = await Promise.allSettled(
      notifications.map(notification => 
        this.sendNotification(
          notification.type,
          notification.channel,
          notification.recipient,
          notification.data,
          notification.options
        )
      )
    );

    return results.map((result, index) => ({
      ...notifications[index],
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : result.reason
    }));
  }

  async notifyOrderCreated(order, customer) {
    const notifications = [];

    
    if (customer.email) {
      notifications.push({
        type: 'orderCreated',
        channel: 'email',
        recipient: customer.email,
        data: {
          customerName: customer.name,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          currency: order.currency,
          items: order.items,
          orderUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`
        }
      });
    }

    if (customer.push_token) {
      notifications.push({
        type: 'orderCreated',
        channel: 'push',
        recipient: customer.push_token,
        data: {
          title: 'Order Confirmed',
          body: `Your order ${order.order_number} has been confirmed`,
          orderNumber: order.order_number,
          orderId: order.id
        }
      });
    }

    return await this.sendMultipleNotifications(notifications);
  }

  async notifyPaymentSuccess(order, customer, paymentDetails) {
    const notifications = [];

    if (customer.email) {
      notifications.push({
        type: 'paymentSuccess',
        channel: 'email',
        recipient: customer.email,
        data: {
          customerName: customer.name,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          currency: order.currency,
          paymentId: paymentDetails.razorpay_payment_id,
          paymentMethod: paymentDetails.method || 'Online',
          orderUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`
        }
      });
    }

    if (customer.push_token) {
      notifications.push({
        type: 'paymentSuccess',
        channel: 'push',
        recipient: customer.push_token,
        data: {
          title: 'Payment Successful',
          body: `Payment for order ${order.order_number} was successful`,
          orderNumber: order.order_number,
          orderId: order.id
        }
      });
    }

    return await this.sendMultipleNotifications(notifications);
  }

  async notifyPaymentFailed(order, customer, error) {
    const notifications = [];

    if (customer.email) {
      notifications.push({
        type: 'paymentFailed',
        channel: 'email',
        recipient: customer.email,
        data: {
          customerName: customer.name,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          currency: order.currency,
          errorMessage: error.message || 'Payment processing failed',
          retryUrl: `${process.env.FRONTEND_URL}/orders/${order.id}/payment`
        }
      });
    }

    if (customer.push_token) {
      notifications.push({
        type: 'paymentFailed',
        channel: 'push',
        recipient: customer.push_token,
        data: {
          title: 'Payment Failed',
          body: `Payment for order ${order.order_number} failed. Please try again.`,
          orderNumber: order.order_number,
          orderId: order.id
        }
      });
    }

    return await this.sendMultipleNotifications(notifications);
  }

  async notifyOrderShipped(order, customer, trackingInfo = {}) {
    const notifications = [];

    if (customer.email) {
      notifications.push({
        type: 'orderShipped',
        channel: 'email',
        recipient: customer.email,
        data: {
          customerName: customer.name,
          orderNumber: order.order_number,
          trackingNumber: trackingInfo.trackingNumber,
          carrier: trackingInfo.carrier,
          estimatedDelivery: trackingInfo.estimatedDelivery,
          trackingUrl: trackingInfo.trackingUrl,
          orderUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`
        }
      });
    }

    if (customer.push_token) {
      notifications.push({
        type: 'orderShipped',
        channel: 'push',
        recipient: customer.push_token,
        data: {
          title: 'Order Shipped',
          body: `Your order ${order.order_number} has been shipped`,
          orderNumber: order.order_number,
          orderId: order.id,
          trackingNumber: trackingInfo.trackingNumber
        }
      });
    }

    return await this.sendMultipleNotifications(notifications);
  }

  async notifyOrderDelivered(order, customer) {
    const notifications = [];

    if (customer.email) {
      notifications.push({
        type: 'orderDelivered',
        channel: 'email',
        recipient: customer.email,
        data: {
          customerName: customer.name,
          orderNumber: order.order_number,
          deliveredAt: new Date().toISOString(),
          orderUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`,
          reviewUrl: `${process.env.FRONTEND_URL}/orders/${order.id}/review`
        }
      });
    }

    if (customer.push_token) {
      notifications.push({
        type: 'orderDelivered',
        channel: 'push',
        recipient: customer.push_token,
        data: {
          title: 'Order Delivered',
          body: `Your order ${order.order_number} has been delivered`,
          orderNumber: order.order_number,
          orderId: order.id
        }
      });
    }

    return await this.sendMultipleNotifications(notifications);
  }

  async notifyOrderCancelled(order, customer, reason) {
    const notifications = [];

    if (customer.email) {
      notifications.push({
        type: 'orderCancelled',
        channel: 'email',
        recipient: customer.email,
        data: {
          customerName: customer.name,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          currency: order.currency,
          reason: reason || 'Order cancelled as requested',
          refundInfo: order.razorpay_payment_id ? 'Refund will be processed within 5-7 business days' : null
        }
      });
    }

    if (customer.push_token) {
      notifications.push({
        type: 'orderCancelled',
        channel: 'push',
        recipient: customer.push_token,
        data: {
          title: 'Order Cancelled',
          body: `Your order ${order.order_number} has been cancelled`,
          orderNumber: order.order_number,
          orderId: order.id
        }
      });
    }

    return await this.sendMultipleNotifications(notifications);
  }

  async sendWelcomeEmail(customer) {
    if (!customer.email) return { success: false, error: 'No email provided' };

    return await this.sendNotification('welcomeCustomer', 'email', customer.email, {
      customerName: customer.name,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
    });
  }

  async sendContactFormEmail(contactData) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || 'admin@example.com';

    return await this.sendNotification('contactForm', 'email', adminEmail, {
      senderName: contactData.name,
      senderEmail: contactData.email,
      subject: contactData.subject || 'New Contact Form Submission',
      message: contactData.message,
      submittedAt: new Date().toISOString(),
      userAgent: contactData.userAgent,
      ipAddress: contactData.ipAddress
    });
  }

  maskRecipient(recipient) {
    if (recipient.includes('@')) {
     
      const [username, domain] = recipient.split('@');
      return `${username.substring(0, 2)}***@${domain}`;
    }
    
    return `${recipient.substring(0, 4)}***`;
  }

 
  addProvider(name, provider) {
    this.providers[name] = provider;
  }

  removeProvider(name) {
    delete this.providers[name];
  }

  getAvailableProviders() {
    return Object.keys(this.providers);
  }

  addTemplate(channel, type, template) {
    if (!this.templates[channel]) {
      this.templates[channel] = {};
    }
    this.templates[channel][type] = template;
  }
}

module.exports = new NotificationService();
