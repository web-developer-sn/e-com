const { db } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

class CartService {
  async getOrCreateCart(customerId) {
    let cart = await db('carts').where('customer_id', customerId).first();
    
    if (!cart) {
      const [cartId] = await db('carts').insert({
        customer_id: customerId
      });
      
      cart = await db('carts').where('id', cartId).first();
    }
    
    return cart;
  }
  
  async getCartWithItems(customerId) {
    const cart = await this.getOrCreateCart(customerId);
    
    const items = await db('cart_items as ci')
      .select([
        'ci.*',
        'p.name as product_name',
        'p.sku as product_sku',
        'p.status as product_status',
        'b.name as brand_name',
        's.name as store_name',
        's.code as store_code',
        'ps.stock as available_stock',
        'ps.price as current_price'
      ])
      .join('products as p', 'ci.product_id', 'p.id')
      .leftJoin('brands as b', 'p.brand_id', 'b.id')
      .join('stores as s', 'ci.store_id', 's.id')
      .leftJoin('product_store as ps', function() {
        this.on('ps.product_id', '=', 'ci.product_id')
            .andOn('ps.store_id', '=', 'ci.store_id');
      })
      .where('ci.cart_id', cart.id)
      .orderBy('ci.created_at', 'desc');
    

    const subtotal = items.reduce((sum, item) => sum + (item.price_snapshot * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      ...cart,
      items,
      summary: {
        total_items: totalItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        currency: 'USD'
      }
    };
  }
  
  async addItemToCart(customerId, itemData) {
    const { product_id, store_id, quantity = 1 } = itemData;
    
    const product = await db('products')
      .where('id', product_id)
      .where('status', 'active')
      .first();
      
    if (!product) {
      throw new AppError('Product not found or inactive', 404);
    }
    
    const store = await db('stores').where('id', store_id).first();
    if (!store) {
      throw new AppError('Store not found', 404);
    }
    
  
    const productStore = await db('product_store')
      .where('product_id', product_id)
      .where('store_id', store_id)
      .first();
      
    if (!productStore) {
      throw new AppError('Product not available in this store', 400);
    }
    
    if (productStore.stock < quantity) {
      throw new AppError(`Insufficient stock. Available: ${productStore.stock}`, 400);
    }
    
    const cart = await this.getOrCreateCart(customerId);
    

    const existingItem = await db('cart_items')
      .where('cart_id', cart.id)
      .where('product_id', product_id)
      .where('store_id', store_id)
      .first();
    
    const priceToUse = productStore.price || product.price;
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      
      if (newQuantity > productStore.stock) {
        throw new AppError(`Cannot add ${quantity} items. Total would exceed available stock (${productStore.stock})`, 400);
      }
      
      await db('cart_items')
        .where('id', existingItem.id)
        .update({
          quantity: newQuantity,
          price_snapshot: priceToUse, 
          updated_at: db.fn.now()
        });
        
      return await this.getCartItemById(existingItem.id);
    } else {
      const [itemId] = await db('cart_items').insert({
        cart_id: cart.id,
        product_id,
        store_id,
        quantity,
        price_snapshot: priceToUse
      });
      
      return await this.getCartItemById(itemId);
    }
  }
  
  async updateCartItem(customerId, itemId, updateData) {
    const { quantity } = updateData;
    
    if (quantity <= 0) {
      return await this.removeCartItem(customerId, itemId);
    }
    
    const cart = await this.getOrCreateCart(customerId);
    
    const item = await db('cart_items')
      .where('id', itemId)
      .where('cart_id', cart.id)
      .first();
      
    if (!item) {
      throw new AppError('Cart item not found', 404);
    }
    
    
    const productStore = await db('product_store')
      .where('product_id', item.product_id)
      .where('store_id', item.store_id)
      .first();
      
    if (!productStore || productStore.stock < quantity) {
      throw new AppError(`Insufficient stock. Available: ${productStore?.stock || 0}`, 400);
    }
    
    await db('cart_items')
      .where('id', itemId)
      .update({
        quantity,
        updated_at: db.fn.now()
      });
    
    return await this.getCartItemById(itemId);
  }
  
  async removeCartItem(customerId, itemId) {
    const cart = await this.getOrCreateCart(customerId);
    
    const deleted = await db('cart_items')
      .where('id', itemId)
      .where('cart_id', cart.id)
      .del();
      
    if (!deleted) {
      throw new AppError('Cart item not found', 404);
    }
    
    return { message: 'Item removed from cart' };
  }
  
  async clearCart(customerId) {
    const cart = await this.getOrCreateCart(customerId);
    
    await db('cart_items').where('cart_id', cart.id).del();
    
    return { message: 'Cart cleared successfully' };
  }
  
  async getCartItemById(itemId) {
    return await db('cart_items as ci')
      .select([
        'ci.*',
        'p.name as product_name',
        'p.sku as product_sku',
        'b.name as brand_name',
        's.name as store_name'
      ])
      .join('products as p', 'ci.product_id', 'p.id')
      .leftJoin('brands as b', 'p.brand_id', 'b.id')
      .join('stores as s', 'ci.store_id', 's.id')
      .where('ci.id', itemId)
      .first();
  }
  
  async validateCartForCheckout(customerId) {
    const cart = await this.getCartWithItems(customerId);
    
    if (!cart.items || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }
    
    const issues = [];
    
    for (const item of cart.items) {
      if (item.product_status !== 'active') {
        issues.push(`Product "${item.product_name}" is no longer available`);
        continue;
      }
      
      if (!item.available_stock || item.available_stock < item.quantity) {
        issues.push(`Insufficient stock for "${item.product_name}" in ${item.store_name}. Available: ${item.available_stock || 0}`);
      }
      const priceDifference = Math.abs(item.current_price - item.price_snapshot) / item.price_snapshot;
      if (priceDifference > 0.1) {
        issues.push(`Price changed for "${item.product_name}". Current: $${item.current_price}, Cart: $${item.price_snapshot}`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
      cart
    };
  }
}

module.exports = new CartService();
