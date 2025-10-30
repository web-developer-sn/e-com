const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
   
    let user;
    if (decoded.type === 'admin') {
      user = await db('users').where('id', decoded.userId).first();
    } else if (decoded.type === 'customer') {
      user = await db('customers').where('id', decoded.userId).first();
    }
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token - user not found'
      });
    }
    
    req.user = {
      id: decoded.userId,
      type: decoded.type,
      role: decoded.role || null,
      email: user.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Token verification failed'
    });
  }
};

const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
   
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    
    if (roles.includes(req.user.type)) {
      return next();
    }
    
    
    if (req.user.type === 'admin' && req.user.role && roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({
      status: 'error',
      message: 'Insufficient permissions'
    });
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.type === 'admin') {
      user = await db('users').where('id', decoded.userId).first();
    } else if (decoded.type === 'customer') {
      user = await db('customers').where('id', decoded.userId).first();
    }
    
    if (user) {
      req.user = {
        id: decoded.userId,
        type: decoded.type,
        role: decoded.role || null,
        email: user.email
      };
    }
    
    next();
  } catch (error) {
    
    next();
  }
};

module.exports = {
  verifyToken,
  authorizeRole,
  optionalAuth
};

