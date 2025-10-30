const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleDatabaseError = (error) => {
 
  if (error.code === 'ER_DUP_ENTRY') {
    const field = error.sqlMessage.match(/for key '(.+?)'/)?.[1] || 'field';
    return new AppError(`Duplicate entry for ${field}`, 400);
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return new AppError('Referenced record does not exist', 400);
  }
  
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return new AppError('Cannot delete record - it is referenced by other records', 400);
  }
  
  if (error.code === 'ER_BAD_FIELD_ERROR') {
    return new AppError('Invalid field in query', 400);
  }
  
  return new AppError('Database operation failed', 500);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again', 401);
};

const handleValidationError = (error) => {
  if (error.details) {
   
    const message = error.details.map(detail => detail.message).join('. ');
    return new AppError(message, 400);
  }
  
  return new AppError('Validation failed', 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
 
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    
    logger.error('ERROR ', err);
    
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
 
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    
    if (error.code && error.code.startsWith('ER_')) {
      error = handleDatabaseError(error);
    }
    
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    
    if (error.name === 'ValidationError' || error.isJoi) {
      error = handleValidationError(error);
    }
    
    sendErrorProd(error, res);
  }
};


process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});


process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = {
  AppError,
  globalErrorHandler
};

