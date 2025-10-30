const productService = require('../services/productService');
const uploadService = require('../services/uploadService');

class ProductController {
  async createProduct(req, res) {
    const product = await productService.createProduct(req.body, req.user.id);
    
    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: product
    });
  }
  
  async getProducts(req, res) {
    const result = await productService.getProducts(req.query, {
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
  
  async getProductById(req, res) {
    const product = await productService.getProductById(req.params.id);
    
    res.json({
      status: 'success',
      data: product
    });
  }
  
  async updateProduct(req, res) {
    const product = await productService.updateProduct(
      req.params.id,
      req.body,
      req.user.id
    );
    
    res.json({
      status: 'success',
      message: 'Product updated successfully',
      data: product
    });
  }
  
  async deleteProduct(req, res) {
    const result = await productService.deleteProduct(req.params.id);
    
    res.json({
      status: 'success',
      message: result.message
    });
  }
  
  async uploadProductImages(req, res) {
    const { id } = req.params;
    const files = req.files || [req.file];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files provided'
      });
    }
    
    //  Cloudinary
    const uploadPromises = files.map(async (file, index) => {
      const uploadResult = await uploadService.uploadImage(file, {
        folder: 'products',
        public_id_prefix: `product_${id}`
      });
      
     
      return await productService.addProductImage(id, {
        url: uploadResult.url,
        public_id: uploadResult.public_id,
        is_primary: index === 0 && req.body.set_first_as_primary === 'true'
      });
    });
    
    const images = await Promise.all(uploadPromises);
    
    res.json({
      status: 'success',
      message: 'Images uploaded successfully',
      data: images
    });
  }
  
  async removeProductImage(req, res) {
    const { id, imageId } = req.params;
    
    const result = await productService.removeProductImage(id, imageId);
    
  
    if (result.public_id) {
      try {
        await uploadService.deleteImage(result.public_id);
      } catch (error) {
        console.warn('Failed to delete image from Cloudinary:', error.message);
      }
    }
    
    res.json({
      status: 'success',
      message: result.message
    });
  }
  
  async assignToStore(req, res) {
    const { id } = req.params;
    const { store_id, stock, price } = req.body;
    
    const assignment = await productService.assignProductToStore(id, store_id, {
      stock,
      price
    });
    
    res.json({
      status: 'success',
      message: 'Product assigned to store successfully',
      data: assignment
    });
  }
}

module.exports = new ProductController();

