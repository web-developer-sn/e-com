const { db } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate, buildFilters } = require('../utils/pagination');

class ProductService {
  async createProduct(productData, userId) {
    const {
      name,
      sku,
      description,
      price,
      status = 'active',
      brand_id,
      account_id,
      category_ids = [],
      store_assignments = []
    } = productData;
    

    if (!brand_id) {
      throw new AppError('Brand is required for product creation', 400);
    }
    
    const brand = await db('brands').where('id', brand_id).first();
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
    
    if (account_id && brand.account_id !== account_id) {
      throw new AppError('Brand is not in the specified account scope', 400);
    }
    

    if (category_ids.length === 0) {
      throw new AppError('At least one category is required', 400);
    }
    
    const categories = await db('categories').whereIn('id', category_ids);
    if (categories.length !== category_ids.length) {
      throw new AppError('One or more categories not found', 404);
    }
    

    if (account_id) {
      const invalidCategories = categories.filter(cat => cat.account_id !== account_id);
      if (invalidCategories.length > 0) {
        throw new AppError('One or more categories are not in the specified account scope', 400);
      }
    }
    

    const trx = await db.transaction();
    
    try {

      const [productId] = await trx('products').insert({
        name,
        sku,
        description,
        price,
        status,
        brand_id,
        account_id,
        created_by: userId
      });
      

      if (category_ids.length > 0) {
        const categoryInserts = category_ids.map(categoryId => ({
          product_id: productId,
          category_id: categoryId
        }));
        
        await trx('product_categories').insert(categoryInserts);
      }
      

      if (store_assignments.length > 0) {
        const storeInserts = store_assignments.map(assignment => ({
          product_id: productId,
          store_id: assignment.store_id,
          stock: assignment.stock || 0,
          price: assignment.price
        }));
        
        await trx('product_store').insert(storeInserts);
      }
      
      await trx.commit();
      

      return await this.getProductById(productId);
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  
  async getProducts(filters = {}, pagination = {}) {
    let query = db('products as p')
      .select([
        'p.*',
        'b.name as brand_name',
        db.raw('GROUP_CONCAT(DISTINCT c.name) as categories'),
        db.raw('COUNT(DISTINCT pi.id) as image_count')
      ])
      .leftJoin('brands as b', 'p.brand_id', 'b.id')
      .leftJoin('product_categories as pc', 'p.id', 'pc.product_id')
      .leftJoin('categories as c', 'pc.category_id', 'c.id')
      .leftJoin('product_images as pi', 'p.id', 'pi.product_id')
      .groupBy('p.id');
    

    const {
      q,
      brand_id,
      category_id,
      store_id,
      status,
      min_price,
      max_price,
      account_id
    } = filters;
    
    if (q) {
      query = query.where(function() {
        this.where('p.name', 'like', `%${q}%`)
          .orWhere('p.description', 'like', `%${q}%`)
          .orWhere('p.sku', 'like', `%${q}%`);
      });
    }
    
    if (brand_id) query = query.where('p.brand_id', brand_id);
    if (category_id) {
      query = query.whereExists(function() {
        this.select('*')
          .from('product_categories as pc2')
          .whereRaw('pc2.product_id = p.id')
          .where('pc2.category_id', category_id);
      });
    }
    if (store_id) {
      query = query.whereExists(function() {
        this.select('*')
          .from('product_store as ps')
          .whereRaw('ps.product_id = p.id')
          .where('ps.store_id', store_id);
      });
    }
    if (status) query = query.where('p.status', status);
    if (min_price) query = query.where('p.price', '>=', min_price);
    if (max_price) query = query.where('p.price', '<=', max_price);
    if (account_id) query = query.where('p.account_id', account_id);
    
    return await paginate(query, pagination);
  }
  
  async getProductById(id) {
    const product = await db('products as p')
      .select([
        'p.*',
        'b.name as brand_name',
        'b.id as brand_id'
      ])
      .leftJoin('brands as b', 'p.brand_id', 'b.id')
      .where('p.id', id)
      .first();
    
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    

    const categories = await db('categories as c')
      .select('c.*')
      .join('product_categories as pc', 'c.id', 'pc.category_id')
      .where('pc.product_id', id);
    

    const images = await db('product_images')
      .where('product_id', id)
      .orderBy('is_primary', 'desc')
      .orderBy('created_at', 'asc');
    

    const stores = await db('stores as s')
      .select([
        's.*',
        'ps.stock',
        'ps.price as store_price'
      ])
      .join('product_store as ps', 's.id', 'ps.store_id')
      .where('ps.product_id', id);
    
    return {
      ...product,
      categories,
      images,
      stores
    };
  }
  
  async updateProduct(id, productData, userId) {
    const { category_ids, ...updateData } = productData;
    

    const existingProduct = await db('products').where('id', id).first();
    if (!existingProduct) {
      throw new AppError('Product not found', 404);
    }
    
    const trx = await db.transaction();
    
    try {
     
      await trx('products')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: db.fn.now()
        });
      

      if (category_ids) {
     
        await trx('product_categories').where('product_id', id).del();

        if (category_ids.length > 0) {
          const categoryInserts = category_ids.map(categoryId => ({
            product_id: id,
            category_id: categoryId
          }));
          
          await trx('product_categories').insert(categoryInserts);
        }
      }
      
      await trx.commit();
      
      return await this.getProductById(id);
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  
  async deleteProduct(id) {
    const product = await db('products').where('id', id).first();
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    await db('products').where('id', id).del();
    return { message: 'Product deleted successfully' };
  }
  
  async addProductImage(productId, imageData) {
    const product = await db('products').where('id', productId).first();
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    if (imageData.is_primary) {
      await db('product_images')
        .where('product_id', productId)
        .update({ is_primary: false });
    }
    
    const [imageId] = await db('product_images').insert({
      product_id: productId,
      ...imageData
    });
    
    return await db('product_images').where('id', imageId).first();
  }
  
  async removeProductImage(productId, imageId) {
    const image = await db('product_images')
      .where('id', imageId)
      .where('product_id', productId)
      .first();
      
    if (!image) {
      throw new AppError('Image not found', 404);
    }
    
    await db('product_images').where('id', imageId).del();
    
    return { message: 'Image removed successfully', public_id: image.public_id };
  }
  
  async assignProductToStore(productId, storeId, assignmentData) {
    
    const product = await db('products').where('id', productId).first();
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    const store = await db('stores').where('id', storeId).first();
    if (!store) {
      throw new AppError('Store not found', 404);
    }
    
    const existingAssignment = await db('product_store')
      .where('product_id', productId)
      .where('store_id', storeId)
      .first();
    
    if (existingAssignment) {
   
      await db('product_store')
        .where('product_id', productId)
        .where('store_id', storeId)
        .update(assignmentData);
    } else {
    
      await db('product_store').insert({
        product_id: productId,
        store_id: storeId,
        ...assignmentData
      });
    }
    
    return await db('product_store')
      .where('product_id', productId)
      .where('store_id', storeId)
      .first();
  }
}

module.exports = new ProductService();

