const authService = require('../services/authService');
const { AppError } = require('../middlewares/errorHandler');

class AuthController {
  async registerAdmin(req, res) {
    const result = await authService.registerAdmin(req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'Admin registered successfully',
      data: result
    });
  }
  
  async loginAdmin(req, res) {
    const result = await authService.loginAdmin(req.body);
    
    res.json({
      status: 'success',
      message: 'Login successful',
      data: result
    });
  }
  
  async registerCustomer(req, res) {
    const result = await authService.registerCustomer(req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'Customer registered successfully',
      data: result
    });
  }
  
  async loginCustomer(req, res) {
    const result = await authService.loginCustomer(req.body);
    
    res.json({
      status: 'success',
      message: 'Login successful',
      data: result
    });
  }
  
  async getCustomerProfile(req, res) {
    const profile = await authService.getCustomerProfile(req.user.id);
    
    res.json({
      status: 'success',
      data: profile
    });
  }
  
  async updateCustomerAddress(req, res) {
    const { addressId } = req.params;
    const address = await authService.updateCustomerAddress(
      req.user.id,
      addressId,
      req.body
    );
    
    res.json({
      status: 'success',
      message: 'Address updated successfully',
      data: address
    });
  }
}

module.exports = new AuthController();

