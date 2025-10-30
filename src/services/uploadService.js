const cloudinary = require('../config/cloudinary');
const { AppError } = require('../middlewares/errorHandler');

class UploadService {
  async uploadImage(file, options = {}) {
    try {
      const {
        folder = 'products',
        transformation = {},
        public_id_prefix = ''
      } = options;
      
      const uploadOptions = {
        folder: `ecommerce/${folder}`,
        resource_type: 'image',
        ...transformation
      };
      
      if (public_id_prefix) {
        uploadOptions.public_id = `${public_id_prefix}_${Date.now()}`;
      }
      
      const result = await cloudinary.uploader.upload(file.path || file.buffer, uploadOptions);
      
      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      throw new AppError('Image upload failed: ' + error.message, 500);
    }
  }
  
  async uploadMultipleImages(files, options = {}) {
    const uploadPromises = files.map(file => this.uploadImage(file, options));
    
    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw new AppError('Multiple image upload failed: ' + error.message, 500);
    }
  }
  
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result !== 'ok') {
        throw new AppError('Failed to delete image from cloud storage', 500);
      }
      
      return result;
    } catch (error) {
      throw new AppError('Image deletion failed: ' + error.message, 500);
    }
  }
  
  async deleteMultipleImages(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      throw new AppError('Multiple image deletion failed: ' + error.message, 500);
    }
  }
  
  generateTransformations(type = 'product') {
    const transformations = {
      product: {
        thumbnail: { width: 150, height: 150, crop: 'fill', quality: 'auto' },
        medium: { width: 400, height: 400, crop: 'fill', quality: 'auto' },
        large: { width: 800, height: 800, crop: 'fill', quality: 'auto' }
      },
      profile: {
        thumbnail: { width: 100, height: 100, crop: 'fill', quality: 'auto', gravity: 'face' },
        medium: { width: 300, height: 300, crop: 'fill', quality: 'auto', gravity: 'face' }
      }
    };
    
    return transformations[type] || transformations.product;
  }
  
  getImageUrl(publicId, transformation = null) {
    if (!publicId) return null;
    
    if (transformation) {
      return cloudinary.url(publicId, transformation);
    }
    
    return cloudinary.url(publicId);
  }
  
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed', 400);
    }
    
    if (file.size > maxSize) {
      throw new AppError('File too large. Maximum size is 5MB', 400);
    }
    
    return true;
  }
}

module.exports = new UploadService();

