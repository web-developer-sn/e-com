const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed', 400), false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 10 
  }
});


const uploadSingle = (fieldName = 'image') => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large. Maximum size is 5MB', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError('Too many files. Maximum is 10 files', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError(`Unexpected field: ${err.field}`, 400));
        }
        return next(new AppError('File upload error: ' + err.message, 400));
      }
      
      if (err) {
        return next(err);
      }
      
      next();
    });
  };
};


const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large. Maximum size is 5MB', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError(`Too many files. Maximum is ${maxCount} files`, 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError(`Unexpected field: ${err.field}`, 400));
        }
        return next(new AppError('File upload error: ' + err.message, 400));
      }
      
      if (err) {
        return next(err);
      }
      
      next();
    });
  };
};


const uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large. Maximum size is 5MB', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError('Too many files', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError(`Unexpected field: ${err.field}`, 400));
        }
        return next(new AppError('File upload error: ' + err.message, 400));
      }
      
      if (err) {
        return next(err);
      }
      
      next();
    });
  };
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields
};

