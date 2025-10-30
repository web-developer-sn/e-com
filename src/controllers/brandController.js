const brandService = require('../services/brandService');

class BrandController {
  async createBrand(req, res) {
    const brand = await brandService.createBrand(req.body, req.user.id);
    
    res.status(201).json({
      status: 'success',
      message: 'Brand created successfully',
      data: brand
    });
  }
  
  async getBrands(req, res) {
    const result = await brandService.getBrands(req.query, {
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
  
  async getBrandById(req, res) {
    const brand = await brandService.getBrandById(req.params.id);
    
    res.json({
      status: 'success',
      data: brand
    });
  }
  
  async updateBrand(req, res) {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    
    res.json({
      status: 'success',
      message: 'Brand updated successfully',
      data: brand
    });
  }
  
  async deleteBrand(req, res) {
    const result = await brandService.deleteBrand(req.params.id);
    
    res.json({
      status: 'success',
      message: result.message
    });
  }
}

module.exports = new BrandController();

