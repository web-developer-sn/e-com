const categoryService = require('../services/categoryService');

class CategoryController {
  async createCategory(req, res) {
    const category = await categoryService.createCategory(req.body, req.user.id);
    
    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: category
    });
  }
  
  async getCategories(req, res) {
    const result = await categoryService.getCategories(req.query, {
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
  
  async getCategoryById(req, res) {
    const category = await categoryService.getCategoryById(req.params.id);
    
    res.json({
      status: 'success',
      data: category
    });
  }
  
  async updateCategory(req, res) {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    
    res.json({
      status: 'success',
      message: 'Category updated successfully',
      data: category
    });
  }
  
  async deleteCategory(req, res) {
    const result = await categoryService.deleteCategory(req.params.id);
    
    res.json({
      status: 'success',
      message: result.message
    });
  }
  
  async getCategoryTree(req, res) {
    const { account_id } = req.query;
    
    const tree = await categoryService.getCategoryTree(account_id);
    
    res.json({
      status: 'success',
      data: tree
    });
  }
}

module.exports = new CategoryController();

