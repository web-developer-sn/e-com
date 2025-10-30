const nodemailer = require('nodemailer');
const logger = require('../../config/logger');

class EmailProvider {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.SMTP_HOST) {
      logger.warn('⚠️  SMTP configuration not found. Email notifications will not work.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });

      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('SMTP connection failed:', error);
        } else {
          logger.info(' SMTP server is ready to send emails');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  async send({ template, recipient, data, options = {} }) {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const emailContent = this.generateEmailContent(template, data);
    
    const mailOptions = {
      from: options.from || process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      ...options
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: result.messageId,
        recipient: this.maskEmail(recipient),
        template
      });

      return {
        success: true,
        messageId: result.messageId,
        recipient: recipient
      };
    } catch (error) {
      logger.error('Failed to send email', {
        error: error.message,
        recipient: this.maskEmail(recipient),
        template
      });
      
      throw error;
    }
  }

  generateEmailContent(template, data) {
    const templates = {
      'order-created': this.orderCreatedTemplate,
      'payment-success': this.paymentSuccessTemplate,
      'payment-failed': this.paymentFailedTemplate,
      'order-shipped': this.orderShippedTemplate,
      'order-delivered': this.orderDeliveredTemplate,
      'order-cancelled': this.orderCancelledTemplate,
      'contact-form': this.contactFormTemplate,
      'welcome-customer': this.welcomeCustomerTemplate
    };

    const templateFunction = templates[template];
    if (!templateFunction) {
      throw new Error(`Email template '${template}' not found`);
    }

    return templateFunction.call(this, data);
  }

  // Email Templates
  orderCreatedTemplate(data) {
    const itemsHtml = data.items?.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.total_price}</td>
      </tr>
    `).join('') || '';

    return {
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">Order Confirmed!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${data.customerName},</p>
            
            <p>Thank you for your order! We've received your order and are preparing it for shipment.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Order Details</h3>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Total Amount:</strong> ${data.currency} ${data.totalAmount}</p>
            </div>

            ${data.items && data.items.length > 0 ? `
            <h3>Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                  <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                  <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                  <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            ` : ''}
            
            <p>You can track your order status by clicking the link below:</p>
            <p><a href="${data.orderUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The E-commerce Team</p>
          </div>
        </div>
      `,
      text: `
        Order Confirmed!
        
        Hi ${data.customerName},
        
        Thank you for your order! We've received your order and are preparing it for shipment.
        
        Order Details:
        Order Number: ${data.orderNumber}
        Total Amount: ${data.currency} ${data.totalAmount}
        
        You can track your order status at: ${data.orderUrl}
        
        Best regards,
        The E-commerce Team
      `
    };
  }

  paymentSuccessTemplate(data) {
    return {
      subject: `Payment Successful - ${data.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #d4edda; padding: 20px; text-align: center;">
            <h1 style="color: #155724; margin: 0;">Payment Successful!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${data.customerName},</p>
            
            <p>Great news! Your payment has been processed successfully.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Payment Details</h3>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Amount Paid:</strong> ${data.currency} ${data.totalAmount}</p>
              <p><strong>Payment ID:</strong> ${data.paymentId}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            </div>
            
            <p>Your order is now being processed and will be shipped soon. You'll receive another email with tracking information once your order ships.</p>
            
            <p><a href="${data.orderUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
            
            <p>Thank you for your business!</p>
            
            <p>Best regards,<br>The E-commerce Team</p>
          </div>
        </div>
      `,
      text: `
        Payment Successful!
        
        Hi ${data.customerName},
        
        Great news! Your payment has been processed successfully.
        
        Payment Details:
        Order Number: ${data.orderNumber}
        Amount Paid: ${data.currency} ${data.totalAmount}
        Payment ID: ${data.paymentId}
        Payment Method: ${data.paymentMethod}
        
        Your order is now being processed and will be shipped soon.
        
        View your order at: ${data.orderUrl}
        
        Thank you for your business!
        
        Best regards,
        The E-commerce Team
      `
    };
  }

  paymentFailedTemplate(data) {
    return {
      subject: `Payment Failed - ${data.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8d7da; padding: 20px; text-align: center;">
            <h1 style="color: #721c24; margin: 0;">Payment Failed</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${data.customerName},</p>
            
            <p>We were unable to process your payment for order ${data.orderNumber}.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Order Details</h3>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Amount:</strong> ${data.currency} ${data.totalAmount}</p>
              <p><strong>Error:</strong> ${data.errorMessage}</p>
            </div>
            
            <p>Please try again or use a different payment method. Your order is still reserved for you.</p>
            
            <p><a href="${data.retryUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Retry Payment</a></p>
            
            <p>If you continue to experience issues, please contact our support team.</p>
            
            <p>Best regards,<br>The E-commerce Team</p>
          </div>
        </div>
      `,
      text: `
        Payment Failed
        
        Hi ${data.customerName},
        
        We were unable to process your payment for order ${data.orderNumber}.
        
        Order Details:
        Order Number: ${data.orderNumber}
        Amount: ${data.currency} ${data.totalAmount}
        Error: ${data.errorMessage}
        
        Please try again at: ${data.retryUrl}
        
        Best regards,
        The E-commerce Team
      `
    };
  }

  orderShippedTemplate(data) {
    return {
      subject: `Order Shipped - ${data.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #cce5ff; padding: 20px; text-align: center;">
            <h1 style="color: #004085; margin: 0;">Order Shipped!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${data.customerName},</p>
            
            <p>Great news! Your order has been shipped and is on its way to you.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Shipping Details</h3>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
              ${data.carrier ? `<p><strong>Carrier:</strong> ${data.carrier}</p>` : ''}
              ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
            </div>
            
            ${data.trackingUrl ? `
            <p>You can track your package using the link below:</p>
            <p><a href="${data.trackingUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Package</a></p>
            ` : ''}
            
            <p><a href="${data.orderUrl}" style="background-color: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
            
            <p>Thank you for your order!</p>
            
            <p>Best regards,<br>The E-commerce Team</p>
          </div>
        </div>
      `,
      text: `
        Order Shipped!
        
        Hi ${data.customerName},
        
        Great news! Your order has been shipped and is on its way to you.
        
        Shipping Details:
        Order Number: ${data.orderNumber}
        ${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ''}
        ${data.carrier ? `Carrier: ${data.carrier}` : ''}
        ${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ''}
        
        ${data.trackingUrl ? `Track your package at: ${data.trackingUrl}` : ''}
        
        View your order at: ${data.orderUrl}
        
        Thank you for your order!
        
        Best regards,
        The E-commerce Team
      `
    };
  }

  orderDeliveredTemplate(data) {
    return {
      subject: `Order Delivered - ${data.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #d4edda; padding: 20px; text-align: center;">
            <h1 style="color: #155724; margin: 0;">Order Delivered!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${data.customerName},</p>
            
            <p>Your order has been successfully delivered!</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Delivery Details</h3>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Delivered At:</strong> ${new Date(data.deliveredAt).toLocaleString()}</p>
            </div>
            
            <p>We hope you're happy with your purchase! If you have any issues with your order, please don't hesitate to contact us.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.orderUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">View Order</a>
              ${data.reviewUrl ? `<a href="${data.reviewUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Leave Review</a>` : ''}
            </div>
            
            <p>Thank you for choosing us!</p>
            
            <p>Best regards,<br>The E-commerce Team</p>
          </div>
        </div>
      `,
      text: `
        Order Delivered!
        
        Hi ${data.customerName},
        
        Your order has been successfully delivered!
        
        Delivery Details:
        Order Number: ${data.orderNumber}
        Delivered At: ${new Date(data.deliveredAt).toLocaleString()}
        
        We hope you're happy with your purchase!
        
        View your order at: ${data.orderUrl}
        ${data.reviewUrl ? `Leave a review at: ${data.reviewUrl}` : ''}
        
        Thank you for choosing us!
        
        Best regards,
        The E-commerce Team
      `
    };
  }

  orderCancelledTemplate(data) {
    return {
      subject: `Order Cancelled - ${data.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8d7da; padding: 20px; text-align: center;">
            <h1 style="color: #721c24; margin: 0;">Order Cancelled</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${data.customerName},</p>
            
            <p>Your order has been cancelled as requested.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Cancellation Details</h3>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Amount:</strong> ${data.currency} ${data.totalAmount}</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
            </div>
            
            ${data.refundInfo ? `
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #0c5460;">Refund Information</h4>
              <p style="margin: 0;">${data.refundInfo}</p>
            </div>
            ` : ''}
            
            <p>If you have any questions about this cancellation, please contact our support team.</p>
            
            <p>We're sorry to see you go and hope to serve you again in the future.</p>
            
            <p>Best regards,<br>The E-commerce Team</p>
          </div>
        </div>
      `,
      text: `
        Order Cancelled
        
        Hi ${data.customerName},
        
        Your order has been cancelled as requested.
        
        Cancellation Details:
        Order Number: ${data.orderNumber}
        Amount: ${data.currency} ${data.totalAmount}
        Reason: ${data.reason}
        
        ${data.refundInfo ? `Refund Information: ${data.refundInfo}` : ''}
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The E-commerce Team
      `
    };
  }

  contactFormTemplate(data) {
    return {
      subject: `${data.subject} - Contact Form Submission`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #e9ecef; padding: 20px; text-align: center;">
            <h1 style="color: #495057; margin: 0;">New Contact Form Submission</h1>
          </div>
          
          <div style="padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0;">Contact Details</h3>
              <p><strong>Name:</strong> ${data.senderName}</p>
              <p><strong>Email:</strong> ${data.senderEmail}</p>
              <p><strong>Subject:</strong> ${data.subject}</p>
              <p><strong>Submitted At:</strong> ${new Date(data.submittedAt).toLocaleString()}</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px;">
              <h4 style="margin: 0 0 10px 0;">Message:</h4>
              <p style="white-space: pre-wrap; margin: 0;">${data.message}</p>
            </div>
            
            ${data.userAgent || data.ipAddress ? `
            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin: 20px 0; font-size: 12px; color: #6c757d;">
              <p style="margin: 0;"><strong>Technical Details:</strong></p>
              ${data.ipAddress ? `<p style="margin: 0;">IP Address: ${data.ipAddress}</p>` : ''}
              ${data.userAgent ? `<p style="margin: 0;">User Agent: ${data.userAgent}</p>` : ''}
            </div>
            ` : ''}
            
            <p style="margin-top: 20px;"><strong>Reply to:</strong> <a href="mailto:${data.senderEmail}">${data.senderEmail}</a></p>
          </div>
        </div>
      `,
      text: `
        New Contact Form Submission
        
        Contact Details:
        Name: ${data.senderName}
        Email: ${data.senderEmail}
        Subject: ${data.subject}
        Submitted At: ${new Date(data.submittedAt).toLocaleString()}
        
        Message:
        ${data.message}
        
        ${data.ipAddress ? `IP Address: ${data.ipAddress}` : ''}
        ${data.userAgent ? `User Agent: ${data.userAgent}` : ''}
        
        Reply to: ${data.senderEmail}
      `
    };
  }

  welcomeCustomerTemplate(data) {
    return {
      subject: 'Welcome to Our Store!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #007bff; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Our Store!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${data.customerName},</p>
            
            <p>Welcome to our e-commerce store! We're excited to have you as part of our community.</p>
            
            <p>Here's what you can do with your new account:</p>
            <ul>
              <li>Browse our extensive product catalog</li>
              <li>Add items to your cart and checkout securely</li>
              <li>Track your orders in real-time</li>
              <li>Manage your addresses and preferences</li>
              <li>Get exclusive offers and early access to sales</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Shopping</a>
            </div>
            
            <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>
            
            <p>Happy shopping!</p>
            
            <p>Best regards,<br>The E-commerce Team</p>
          </div>
        </div>
      `,
      text: `
        Welcome to Our Store!
        
        Hi ${data.customerName},
        
        Welcome to our e-commerce store! We're excited to have you as part of our community.
        
        Here's what you can do with your new account:
        - Browse our extensive product catalog
        - Add items to your cart and checkout securely
        - Track your orders in real-time
        - Manage your addresses and preferences
        - Get exclusive offers and early access to sales
        
        Start shopping at: ${data.loginUrl}
        
        If you have any questions, contact us at: ${data.supportEmail}
        
        Happy shopping!
        
        Best regards,
        The E-commerce Team
      `
    };
  }

  maskEmail(email) {
    const [username, domain] = email.split('@');
    return `${username.substring(0, 2)}***@${domain}`;
  }
}

module.exports = new EmailProvider();
