const { db } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');
const { buildNearbyQuery } = require('../utils/haversine');

class StoreService {
  async createStore(storeData, userId) {
    const {
      name,
      code,
      contact_phone,
      address_line1,
      address_line2,
      city,
      state,
      country,
      postal_code,
      latitude,
      longitude,
      account_id
    } = storeData;
    
 
    const existingStore = await db('stores').where('code', code).first();
    if (existingStore) {
      throw new AppError('Store with this code already exists', 400);
    }
    
    const [storeId] = await db('stores').insert({
      name,
      code,
      contact_phone,
      address_line1,
      address_line2,
      city,
      state,
      country,
      postal_code,
      latitude,
      longitude,
      account_id
    });
    
    return await this.getStoreById(storeId);
  }
  
  async getStores(filters = {}, pagination = {}) {
    let query = db('stores as s')
      .select([
        's.*',
        db.raw('COUNT(DISTINCT ps.product_id) as product_count')
      ])
      .leftJoin('product_store as ps', 's.id', 'ps.store_id')
      .groupBy('s.id');
    
    const { account_id, city, state, country } = filters;
    
    if (account_id) query = query.where('s.account_id', account_id);
    if (city) query = query.where('s.city', 'like', `%${city}%`);
    if (state) query = query.where('s.state', 'like', `%${state}%`);
    if (country) query = query.where('s.country', 'like', `%${country}%`);
    
    return await paginate(query, pagination);
  }
  
  async getStoreById(id) {
    const store = await db('stores').where('id', id).first();
    
    if (!store) {
      throw new AppError('Store not found', 404);
    }
    const products = await db('products as p')
      .select([
        'p.*',
        'ps.stock',
        'ps.price as store_price',
        'b.name as brand_name'
      ])
      .join('product_store as ps', 'p.id', 'ps.product_id')
      .leftJoin('brands as b', 'p.brand_id', 'b.id')
      .where('ps.store_id', id)
      .where('p.status', 'active');
    
    return {
      ...store,
      products
    };
  }
  
  async updateStore(id, storeData) {
    const existingStore = await db('stores').where('id', id).first();
    if (!existingStore) {
      throw new AppError('Store not found', 404);
    }
    if (storeData.code && storeData.code !== existingStore.code) {
      const duplicateStore = await db('stores').where('code', storeData.code).first();
      if (duplicateStore) {
        throw new AppError('Store with this code already exists', 400);
      }
    }
    
    await db('stores')
      .where('id', id)
      .update({
        ...storeData,
        updated_at: db.fn.now()
      });
    
    return await this.getStoreById(id);
  }
  
  async deleteStore(id) {
    const store = await db('stores').where('id', id).first();
    if (!store) {
      throw new AppError('Store not found', 404);
    }
    
    await db('stores').where('id', id).del();
    return { message: 'Store deleted successfully' };
  }
  
  async getNearbyStores(lat, lng, radius = 5, filters = {}) {
    const { account_id } = filters;
    
    const additionalFilters = {};
    if (account_id) {
      additionalFilters.account_id = account_id;
    }
    
    const query = buildNearbyQuery(db, 'stores', lat, lng, radius, {
      selectColumns: ['*'],
      additionalFilters
    });
    
    query.select([
      'stores.*',
      db.raw('(6371 * acos(cos(radians(?)) * cos(radians(stores.latitude)) * cos(radians(stores.longitude) - radians(?)) + sin(radians(?)) * sin(radians(stores.latitude)))) as distance_km', [lat, lng, lat]),
      db.raw('(SELECT COUNT(*) FROM product_store ps WHERE ps.store_id = stores.id) as product_count')
    ]);
    
    const stores = await query;
    
    return {
      data: stores,
      meta: {
        total: stores.length,
        radius,
        center: { lat, lng }
      }
    };
  }
  
  async assignProductToStore(storeId, productData) {
    const { product_id, stock = 0, price } = productData;
   
    const store = await db('stores').where('id', storeId).first();
    if (!store) {
      throw new AppError('Store not found', 404);
    }
    const product = await db('products').where('id', product_id).first();
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    const existingAssignment = await db('product_store')
      .where('product_id', product_id)
      .where('store_id', storeId)
      .first();
    
    if (existingAssignment) {
    
      await db('product_store')
        .where('product_id', product_id)
        .where('store_id', storeId)
        .update({ stock, price });
    } else {
     
      await db('product_store').insert({
        product_id,
        store_id: storeId,
        stock,
        price
      });
    }
    
    return await db('product_store')
      .select([
        'product_store.*',
        'p.name as product_name',
        'p.sku'
      ])
      .join('products as p', 'product_store.product_id', 'p.id')
      .where('product_store.product_id', product_id)
      .where('product_store.store_id', storeId)
      .first();
  }
  
  async removeProductFromStore(storeId, productId) {
    const assignment = await db('product_store')
      .where('product_id', productId)
      .where('store_id', storeId)
      .first();
      
    if (!assignment) {
      throw new AppError('Product assignment not found', 404);
    }
    
    await db('product_store')
      .where('product_id', productId)
      .where('store_id', storeId)
      .del();
    
    return { message: 'Product removed from store successfully' };
  }
  
  async updateProductStock(storeId, productId, stock) {
    const assignment = await db('product_store')
      .where('product_id', productId)
      .where('store_id', storeId)
      .first();
      
    if (!assignment) {
      throw new AppError('Product assignment not found', 404);
    }
    
    await db('product_store')
      .where('product_id', productId)
      .where('store_id', storeId)
      .update({ stock });
    
    return await db('product_store')
      .where('product_id', productId)
      .where('store_id', storeId)
      .first();
  }
}

module.exports = new StoreService();

