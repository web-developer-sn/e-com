const uploadService = require('../services/uploadService');

class UploadController {
  async uploadSingle(req, res) {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file provided'
      });
    }
    
    const { folder = 'general', transformation } = req.body;
    
    const result = await uploadService.uploadImage(req.file, {
      folder,
      transformation: transformation ? JSON.parse(transformation) : {}
    });
    
    res.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: result
    });
  }
  
  async uploadMultiple(req, res) {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files provided'
      });
    }
    
    const { folder = 'general', transformation } = req.body;
    
    const results = await uploadService.uploadMultipleImages(req.files, {
      folder,
      transformation: transformation ? JSON.parse(transformation) : {}
    });
    
    res.json({
      status: 'success',
      message: 'Files uploaded successfully',
      data: results
    });
  }
  
  async deleteImage(req, res) {
    const { public_id } = req.params;
    
    const result = await uploadService.deleteImage(public_id);
    
    res.json({
      status: 'success',
      message: 'Image deleted successfully',
      data: result
    });
  }
  
  async getTransformations(req, res) {
    const { type = 'product' } = req.query;
    
    const transformations = uploadService.generateTransformations(type);
    
    res.json({
      status: 'success',
      data: transformations
    });
  }
}

module.exports = new UploadController();

