const { db } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');

class BrandService {
  async createBrand(brandData, userId) {
    const { name, account_id } = brandData;
    

    const existingBrand = await db('brands')
      .where('name', name)
      .where('account_id', account_id)
      .first();
      
    if (existingBrand) {
      throw new AppError('Brand with this name already exists for this account', 400);
    }
    
    const [brandId] = await db('brands').insert({
      name,
      account_id,
      created_by: userId
    });
    
    return await this.getBrandById(brandId);
  }
  
  async getBrands(filters = {}, pagination = {}) {
    let query = db('brands as b')
      .select([
        'b.*',
        'u.name as created_by_name',
        db.raw('COUNT(DISTINCT p.id) as product_count')
      ])
      .leftJoin('users as u', 'b.created_by', 'u.id')
      .leftJoin('products as p', 'b.id', 'p.brand_id')
      .groupBy('b.id');
    
   
    const { account_id, name } = filters;
    
    if (account_id) query = query.where('b.account_id', account_id);
    if (name) query = query.where('b.name', 'like', `%${name}%`);
    
    return await paginate(query, pagination);
  }
  
  async getBrandById(id) {
    const brand = await db('brands as b')
      .select([
        'b.*',
        'u.name as created_by_name'
      ])
      .leftJoin('users as u', 'b.created_by', 'u.id')
      .where('b.id', id)
      .first();
    
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
    
  
    const products = await db('products')
      .select(['id', 'name', 'sku', 'price', 'status'])
      .where('brand_id', id)
      .orderBy('name');
    
    return {
      ...brand,
      products
    };
  }
  
  async updateBrand(id, brandData) {
    const existingBrand = await db('brands').where('id', id).first();
    if (!existingBrand) {
      throw new AppError('Brand not found', 404);
    }
    

    if (brandData.name && brandData.name !== existingBrand.name) {
      const duplicateBrand = await db('brands')
        .where('name', brandData.name)
        .where('account_id', existingBrand.account_id)
        .where('id', '!=', id)
        .first();
        
      if (duplicateBrand) {
        throw new AppError('Brand with this name already exists for this account', 400);
      }
    }
    
    await db('brands')
      .where('id', id)
      .update({
        ...brandData,
        updated_at: db.fn.now()
      });
    
    return await this.getBrandById(id);
  }
  
  async deleteBrand(id) {
    const brand = await db('brands').where('id', id).first();
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
    const productCount = await db('products').where('brand_id', id).count('id as count').first();
    if (productCount.count > 0) {
      throw new AppError('Cannot delete brand - it has associated products', 400);
    }
    
    await db('brands').where('id', id).del();
    return { message: 'Brand deleted successfully' };
  }
}

module.exports = new BrandService();

