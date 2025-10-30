const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const notificationService = require('./notificationService');

class AuthService {
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }
  
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
  
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }
  
  async registerAdmin(userData) {
    const { name, email, password, role = 'admin' } = userData;
    
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }
    
    const hashedPassword = await this.hashPassword(password);
    
    const [userId] = await db('users').insert({
      name,
      email,
      password: hashedPassword,
      role
    });
    
    const user = await db('users').where('id', userId).first();
    
    const token = this.generateToken({
      userId: user.id,
      type: 'admin',
      role: user.role
    });
    
    
    delete user.password;
    
    return { user, token };
  }
  
  async loginAdmin(credentials) {
    const { email, password } = credentials;
    
    const user = await db('users').where('email', email).first();
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }
    
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }
    
    const token = this.generateToken({
      userId: user.id,
      type: 'admin',
      role: user.role
    });
    
    delete user.password;
    
    return { user, token };
  }
  
  async registerCustomer(userData) {
    const { name, email, phone, password, address } = userData;
    
   
    const existingCustomer = await db('customers')
      .where(function() {
        if (email) this.where('email', email);
        if (phone) this.orWhere('phone', phone);
      })
      .first();
      
    if (existingCustomer) {
      throw new AppError('Customer with this email or phone already exists', 400);
    }
   
    const hashedPassword = await this.hashPassword(password);
    
    const trx = await db.transaction();
    
    try {
      const [customerId] = await trx('customers').insert({
        name,
        email,
        phone,
        password: hashedPassword
      });
      
      await trx('customer_addresses').insert({
        customer_id: customerId,
        label: address.label || 'Home',
        address_line1: address.address_line1,
        address_line2: address.address_line2,
        city: address.city,
        state: address.state,
        country: address.country,
        postal_code: address.postal_code,
        latitude: address.latitude,
        longitude: address.longitude,
        is_default: true
      });
      
      await trx.commit();
     
      const customer = await db('customers').where('id', customerId).first();
     
      const token = this.generateToken({
        userId: customer.id,
        type: 'customer'
      });
      
      
      delete customer.password;
      
     
      try {
        await notificationService.sendWelcomeEmail(customer);
      } catch (notificationError) {
        console.warn('Failed to send welcome email:', notificationError.message);
      }
      
      return { customer, token };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  
  async loginCustomer(credentials) {
    const { identifier, password } = credentials;
    

    const customer = await db('customers')
      .where('email', identifier)
      .orWhere('phone', identifier)
      .first();
      
    if (!customer) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await this.comparePassword(password, customer.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }
    

    const token = this.generateToken({
      userId: customer.id,
      type: 'customer'
    });
    
   
    delete customer.password;
    
    return { customer, token };
  }
  
  async getCustomerProfile(customerId) {
    const customer = await db('customers')
      .select('id', 'name', 'email', 'phone', 'created_at', 'updated_at')
      .where('id', customerId)
      .first();
      
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    
    const addresses = await db('customer_addresses')
      .where('customer_id', customerId)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'asc');
    
    return { ...customer, addresses };
  }
  
  async updateCustomerAddress(customerId, addressId, addressData) {

    const address = await db('customer_addresses')
      .where('id', addressId)
      .where('customer_id', customerId)
      .first();
      
    if (!address) {
      throw new AppError('Address not found', 404);
    }
    

    await db('customer_addresses')
      .where('id', addressId)
      .update({
        ...addressData,
        updated_at: db.fn.now()
      });
    

    return await db('customer_addresses').where('id', addressId).first();
  }
}

module.exports = new AuthService();

