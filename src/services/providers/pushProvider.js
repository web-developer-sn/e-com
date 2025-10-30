const logger = require('../../config/logger');

class PushProvider {
  constructor() {
    this.fcm = null;
    this.initializeFCM();
  }

  initializeFCM() {
    if (!process.env.FCM_SERVER_KEY && !process.env.FIREBASE_SERVICE_ACCOUNT) {
      logger.warn('  Push notification configuration not found. Push notifications will not work.');
      return;
    }


    logger.info('📱 Push notification provider initialized (placeholder)');
  }

  async send({ template, recipient, data, options = {} }) {
    if (!this.fcm) {
      
      logger.info('Push notification would be sent:', {
        template,
        recipient: this.maskToken(recipient),
        data: {
          title: data.title,
          body: data.body
        }
      });

      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        recipient: recipient
      };
    }

    try {
      const message = this.buildMessage(template, recipient, data, options);
      
      
      
      const result = { messageId: `mock_${Date.now()}` }; 

      logger.info('Push notification sent successfully', {
        messageId: result.messageId,
        recipient: this.maskToken(recipient),
        template
      });

      return {
        success: true,
        messageId: result.messageId,
        recipient: recipient
      };
    } catch (error) {
      logger.error('Failed to send push notification', {
        error: error.message,
        recipient: this.maskToken(recipient),
        template
      });
      
      throw error;
    }
  }

  buildMessage(template, token, data, options) {
    const baseMessage = {
      token: token,
      notification: {
        title: data.title,
        body: data.body
      },
      data: {
        template: template,
        ...this.sanitizeData(data)
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#007bff',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

  
    switch (template) {
      case 'orderCreated':
        baseMessage.data.click_action = 'ORDER_DETAILS';
        baseMessage.data.order_id = data.orderId?.toString();
        break;
        
      case 'paymentSuccess':
        baseMessage.data.click_action = 'ORDER_DETAILS';
        baseMessage.data.order_id = data.orderId?.toString();
        baseMessage.android.notification.color = '#28a745';
        break;
        
      case 'paymentFailed':
        baseMessage.data.click_action = 'RETRY_PAYMENT';
        baseMessage.data.order_id = data.orderId?.toString();
        baseMessage.android.notification.color = '#dc3545';
        break;
        
      case 'orderShipped':
        baseMessage.data.click_action = 'TRACK_ORDER';
        baseMessage.data.order_id = data.orderId?.toString();
        baseMessage.data.tracking_number = data.trackingNumber;
        break;
        
      case 'orderDelivered':
        baseMessage.data.click_action = 'ORDER_DETAILS';
        baseMessage.data.order_id = data.orderId?.toString();
        baseMessage.android.notification.color = '#28a745';
        break;
        
      case 'orderCancelled':
        baseMessage.data.click_action = 'ORDER_DETAILS';
        baseMessage.data.order_id = data.orderId?.toString();
        baseMessage.android.notification.color = '#6c757d';
        break;
    }

    return { ...baseMessage, ...options };
  }

  sanitizeData(data) {
  
    const sanitized = {};
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined) {
        sanitized[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    });
    
    return sanitized;
  }

  maskToken(token) {
    if (!token) return 'unknown';
    return `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;
  }

  
  async subscribeToTopic(token, topic) {
    if (!this.fcm) {
      logger.info(`Would subscribe ${this.maskToken(token)} to topic: ${topic}`);
      return { success: true };
    }

    try {

      const result = { successCount: 1 }; 
      
      logger.info('Subscribed to topic', {
        token: this.maskToken(token),
        topic,
        successCount: result.successCount
      });

      return { success: true, result };
    } catch (error) {
      logger.error('Failed to subscribe to topic', {
        error: error.message,
        token: this.maskToken(token),
        topic
      });
      
      throw error;
    }
  }

  async unsubscribeFromTopic(token, topic) {
    if (!this.fcm) {
      logger.info(`Would unsubscribe ${this.maskToken(token)} from topic: ${topic}`);
      return { success: true };
    }

    try {
      const result = { successCount: 1 }; 
      logger.info('Unsubscribed from topic', {
        token: this.maskToken(token),
        topic,
        successCount: result.successCount
      });

      return { success: true, result };
    } catch (error) {
      logger.error('Failed to unsubscribe from topic', {
        error: error.message,
        token: this.maskToken(token),
        topic
      });
      
      throw error;
    }
  }

  async sendToTopic(topic, data, options = {}) {
    if (!this.fcm) {
      logger.info('Would send to topic:', {
        topic,
        data: {
          title: data.title,
          body: data.body
        }
      });
      return { success: true, messageId: `mock_topic_${Date.now()}` };
    }

    try {
      const message = {
        topic: topic,
        notification: {
          title: data.title,
          body: data.body
        },
        data: this.sanitizeData(data),
        ...options
      };
      const result = { messageId: `mock_topic_${Date.now()}` }; 

      logger.info('Message sent to topic', {
        messageId: result.messageId,
        topic
      });

      return {
        success: true,
        messageId: result.messageId,
        topic: topic
      };
    } catch (error) {
      logger.error('Failed to send to topic', {
        error: error.message,
        topic
      });
      
      throw error;
    }
  }
}

module.exports = new PushProvider();
