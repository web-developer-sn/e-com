const storeService = require('../services/storeService');

class StoreController {
  async createStore(req, res) {
    const store = await storeService.createStore(req.body, req.user.id);
    
    res.status(201).json({
      status: 'success',
      message: 'Store created successfully',
      data: store
    });
  }
  
  async getStores(req, res) {
    const result = await storeService.getStores(req.query, {
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
  
  async getStoreById(req, res) {
    const store = await storeService.getStoreById(req.params.id);
    
    res.json({
      status: 'success',
      data: store
    });
  }
  
  async updateStore(req, res) {
    const store = await storeService.updateStore(req.params.id, req.body);
    
    res.json({
      status: 'success',
      message: 'Store updated successfully',
      data: store
    });
  }
  
  async deleteStore(req, res) {
    const result = await storeService.deleteStore(req.params.id);
    
    res.json({
      status: 'success',
      message: result.message
    });
  }
  
  async getNearbyStores(req, res) {
    const { lat, lng, radius, account_id } = req.query;
    
    const result = await storeService.getNearbyStores(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius) || 5,
      { account_id }
    );
    
    res.json({
      status: 'success',
      data: result.data,
      meta: result.meta
    });
  }
  
  async assignProduct(req, res) {
    const { id } = req.params;
    
    const assignment = await storeService.assignProductToStore(id, req.body);
    
    res.json({
      status: 'success',
      message: 'Product assigned to store successfully',
      data: assignment
    });
  }
  
  async removeProduct(req, res) {
    const { id, productId } = req.params;
    
    const result = await storeService.removeProductFromStore(id, productId);
    
    res.json({
      status: 'success',
      message: result.message
    });
  }
  
  async updateProductStock(req, res) {
    const { id, productId } = req.params;
    const { stock } = req.body;
    
    const assignment = await storeService.updateProductStock(id, productId, stock);
    
    res.json({
      status: 'success',
      message: 'Stock updated successfully',
      data: assignment
    });
  }
}

module.exports = new StoreController();

