const cartService = require('../services/cartService');

class CartController {
  async getCart(req, res) {
    const cart = await cartService.getCartWithItems(req.user.id);
    
    res.json({
      status: 'success',
      data: cart
    });
  }
  
  async addItem(req, res) {
    const item = await cartService.addItemToCart(req.user.id, req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'Item added to cart',
      data: item
    });
  }
  
  async updateItem(req, res) {
    const { itemId } = req.params;
    const item = await cartService.updateCartItem(req.user.id, itemId, req.body);
    
    res.json({
      status: 'success',
      message: 'Cart item updated',
      data: item
    });
  }
  
  async removeItem(req, res) {
    const { itemId } = req.params;
    const result = await cartService.removeCartItem(req.user.id, itemId);
    
    res.json({
      status: 'success',
      message: result.message
    });
  }
  
  async clearCart(req, res) {
    const result = await cartService.clearCart(req.user.id);
    
    res.json({
      status: 'success',
      message: result.message
    });
  }
  
  async validateCart(req, res) {
    const validation = await cartService.validateCartForCheckout(req.user.id);
    
    res.json({
      status: 'success',
      data: {
        valid: validation.valid,
        issues: validation.issues,
        cart_summary: validation.cart.summary
      }
    });
  }
}

module.exports = new CartController();
