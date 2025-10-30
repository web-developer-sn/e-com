require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');

const logger = require('./config/logger');
const { testConnection } = require('./config/database');
const { globalErrorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const storeRoutes = require('./routes/stores');
const brandRoutes = require('./routes/brands');
const categoryRoutes = require('./routes/categories');
const uploadRoutes = require('./routes/uploads');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const webhookRoutes = require('./routes/webhooks');
const contactRoutes = require('./routes/contact');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, 
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true
});


app.use(pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return 'resource not found';
    }
    return `${req.method} ${req.url} completed`;
  },
  customErrorMessage: function (req, res, err) {
    return `${req.method} ${req.url} errored with status ${res.statusCode}`;
  }
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});


app.use('/api/webhooks', webhookRoutes);

app.use('/api/auth', authLimiter);
app.use('/api', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'E-commerce API Server',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      stores: '/api/stores',
      brands: '/api/brands',
      categories: '/api/categories',
      uploads: '/api/uploads',
      cart: '/api/cart',
      orders: '/api/orders',
      webhooks: '/api/webhooks',
      contact: '/api/contact'
    }
  });
});


app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
  
    await testConnection();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
      logger.info(`📚 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};


process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;

