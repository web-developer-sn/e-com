const { db } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');

class CategoryService {
  async createCategory(categoryData, userId) {
    const { name, account_id, parent_id } = categoryData;
    
    const existingCategory = await db('categories')
      .where('name', name)
      .where('account_id', account_id)
      .first();
      
    if (existingCategory) {
      throw new AppError('Category with this name already exists for this account', 400);
    }
    
    if (parent_id) {
      const parentCategory = await db('categories').where('id', parent_id).first();
      if (!parentCategory) {
        throw new AppError('Parent category not found', 404);
      }
    }
    
    const [categoryId] = await db('categories').insert({
      name,
      account_id,
      parent_id
    });
    
    return await this.getCategoryById(categoryId);
  }
  
  async getCategories(filters = {}, pagination = {}) {
    let query = db('categories as c')
      .select([
        'c.*',
        'parent.name as parent_name',
        db.raw('COUNT(DISTINCT pc.product_id) as product_count'),
        db.raw('COUNT(DISTINCT child.id) as subcategory_count')
      ])
      .leftJoin('categories as parent', 'c.parent_id', 'parent.id')
      .leftJoin('categories as child', 'c.id', 'child.parent_id')
      .leftJoin('product_categories as pc', 'c.id', 'pc.category_id')
      .groupBy('c.id');
    
    const { account_id, parent_id, name } = filters;
    
    if (account_id) query = query.where('c.account_id', account_id);
    if (parent_id !== undefined) {
      if (parent_id === null || parent_id === 'null') {
        query = query.whereNull('c.parent_id');
      } else {
        query = query.where('c.parent_id', parent_id);
      }
    }
    if (name) query = query.where('c.name', 'like', `%${name}%`);
    
    return await paginate(query, pagination);
  }
  
  async getCategoryById(id) {
    const category = await db('categories as c')
      .select([
        'c.*',
        'parent.name as parent_name'
      ])
      .leftJoin('categories as parent', 'c.parent_id', 'parent.id')
      .where('c.id', id)
      .first();
    
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    
    const subcategories = await db('categories')
      .select(['id', 'name', 'created_at'])
      .where('parent_id', id)
      .orderBy('name');
    
    const products = await db('products as p')
      .select(['p.id', 'p.name', 'p.sku', 'p.price', 'p.status'])
      .join('product_categories as pc', 'p.id', 'pc.product_id')
      .where('pc.category_id', id)
      .orderBy('p.name');
    
    return {
      ...category,
      subcategories,
      products
    };
  }
  
  async updateCategory(id, categoryData) {
    const existingCategory = await db('categories').where('id', id).first();
    if (!existingCategory) {
      throw new AppError('Category not found', 404);
    }
    if (categoryData.name && categoryData.name !== existingCategory.name) {
      const duplicateCategory = await db('categories')
        .where('name', categoryData.name)
        .where('account_id', existingCategory.account_id)
        .where('id', '!=', id)
        .first();
        
      if (duplicateCategory) {
        throw new AppError('Category with this name already exists for this account', 400);
      }
    }
    

    if (categoryData.parent_id) {
      const isCircular = await this.checkCircularReference(id, categoryData.parent_id);
      if (isCircular) {
        throw new AppError('Cannot set parent - would create circular reference', 400);
      }
    }
    
    await db('categories')
      .where('id', id)
      .update({
        ...categoryData,
        updated_at: db.fn.now()
      });
    
    return await this.getCategoryById(id);
  }
  
  async deleteCategory(id) {
    const category = await db('categories').where('id', id).first();
    if (!category) {
      throw new AppError('Category not found', 404);
    }
   
    const subcategoryCount = await db('categories').where('parent_id', id).count('id as count').first();
    if (subcategoryCount.count > 0) {
      throw new AppError('Cannot delete category - it has subcategories', 400);
    }
    
 
    const productCount = await db('product_categories').where('category_id', id).count('id as count').first();
    if (productCount.count > 0) {
      throw new AppError('Cannot delete category - it has associated products', 400);
    }
    
    await db('categories').where('id', id).del();
    return { message: 'Category deleted successfully' };
  }
  
  async getCategoryTree(accountId = null) {
    let query = db('categories as c')
      .select([
        'c.*',
        db.raw('COUNT(DISTINCT pc.product_id) as product_count')
      ])
      .leftJoin('product_categories as pc', 'c.id', 'pc.category_id')
      .groupBy('c.id')
      .orderBy('c.name');
    
    if (accountId) {
      query = query.where('c.account_id', accountId);
    }
    
    const categories = await query;

    const categoryMap = {};
    const rootCategories = [];
    
    categories.forEach(category => {
      categoryMap[category.id] = {
        ...category,
        children: []
      };
      
      if (!category.parent_id) {
        rootCategories.push(categoryMap[category.id]);
      }
    });
  
    categories.forEach(category => {
      if (category.parent_id && categoryMap[category.parent_id]) {
        categoryMap[category.parent_id].children.push(categoryMap[category.id]);
      }
    });
    
    return rootCategories;
  }
  
  async checkCircularReference(categoryId, parentId) {
    if (categoryId === parentId) {
      return true;
    }
    
    let currentParentId = parentId;
    const visited = new Set();
    
    while (currentParentId && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      
      if (currentParentId === categoryId) {
        return true;
      }
      
      const parent = await db('categories').where('id', currentParentId).first();
      currentParentId = parent ? parent.parent_id : null;
    }
    
    return false;
  }
}

module.exports = new CategoryService();

