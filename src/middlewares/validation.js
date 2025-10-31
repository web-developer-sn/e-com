const Joi = require('joi');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
      
    });
    
    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message.replace(/"/g, ''))
        .join(', ');
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errorMessage
      });
    }
    
    next();
  };
};

const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');
const validateBody = (schema) => validate(schema, 'body');

const commonSchemas = {
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().pattern(/^[a-zA-Z_]+:(asc|desc)$/).default('created_at:desc')
  }),
  
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(0.1).max(100).default(5)
  })
};

// Auth validation schemas
const authSchemas = {
  adminRegister: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid('admin', 'superadmin').default('admin')
  }),
  
  adminLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  customerRegister: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().allow(null),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow(null),
    password: Joi.string().min(6).max(128).required(),
    address: Joi.object({
      label: Joi.string().max(100).default('Home'),
      address_line1: Joi.string().max(255).required(),
      address_line2: Joi.string().max(255).allow(''),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      country: Joi.string().max(100).required(),
      postal_code: Joi.string().max(20).required(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).required()
  }).or('email', 'phone'),
  customerLogin: Joi.object({
    identifier: Joi.string().required(), 
    password: Joi.string().required()
  })
};

const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    sku: Joi.string().max(100).allow(null),
    description: Joi.string().allow(''),
    price: Joi.number().min(0).precision(2).required(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    brand_id: Joi.number().integer().positive().required(), 
    account_id: Joi.number().integer().positive().allow(null),
    category_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(), 
    store_assignments: Joi.array().items(
      Joi.object({
        store_id: Joi.number().integer().positive().required(),
        stock: Joi.number().integer().min(0).default(0),
        price: Joi.number().min(0).precision(2).allow(null)
      })
    ).default([])
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(255),
    sku: Joi.string().max(100).allow(null),
    description: Joi.string().allow(''),
    price: Joi.number().min(0).precision(2),
    status: Joi.string().valid('active', 'inactive'),
    brand_id: Joi.number().integer().positive().allow(null),
    category_ids: Joi.array().items(Joi.number().integer().positive()).min(1)
  }),
  
  search: Joi.object({
    q: Joi.string().max(255),
    brand_id: Joi.number().integer().positive(),
    category_id: Joi.number().integer().positive(),
    store_id: Joi.number().integer().positive(),
    status: Joi.string().valid('active', 'inactive'),
    min_price: Joi.number().min(0),
    max_price: Joi.number().min(0),
    account_id: Joi.number().integer().positive()
  }).concat(commonSchemas.pagination)
};


const storeSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    code: Joi.string().min(1).max(100).required(),
    contact_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow(null),
    address_line1: Joi.string().max(255).required(),
    address_line2: Joi.string().max(255).allow(''),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100).required(),
    country: Joi.string().max(100).required(),
    postal_code: Joi.string().max(20).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    account_id: Joi.number().integer().positive().allow(null)
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(255),
    contact_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow(null),
    address_line1: Joi.string().max(255),
    address_line2: Joi.string().max(255).allow(''),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    country: Joi.string().max(100),
    postal_code: Joi.string().max(20),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  }),
  
  nearby: commonSchemas.coordinates.concat(
    Joi.object({
      account_id: Joi.number().integer().positive()
    })
  ),
  
  assignProduct: Joi.object({
    product_id: Joi.number().integer().positive().required(),
    stock: Joi.number().integer().min(0).default(0),
    price: Joi.number().min(0).precision(2).allow(null)
  })
};


const brandSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    account_id: Joi.number().integer().positive().allow(null)
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(255)
  })
};


const categorySchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    account_id: Joi.number().integer().positive().allow(null),
    parent_id: Joi.number().integer().positive().allow(null)
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(255),
    parent_id: Joi.number().integer().positive().allow(null)
  })
};


const cartSchemas = {
  addItem: Joi.object({
    product_id: Joi.number().integer().positive().required(),
    store_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).max(100).default(1)
  }),
  
  updateItem: Joi.object({
    quantity: Joi.number().integer().min(0).max(100).required()
  })
};


const orderSchemas = {
  create: Joi.object({
    shipping_address_id: Joi.number().integer().positive().required(),
    notes: Joi.string().max(500).allow('')
  }),
  
  verifyPayment: Joi.object({
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required()
  }),
  
  cancelOrder: Joi.object({
    reason: Joi.string().max(255).allow('')
  }),
  
  updateStatus: Joi.object({
    status: Joi.string().valid(
      'CREATED', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 
      'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'
    ).required()
  }),
  
  orderFilters: Joi.object({
    status: Joi.string().valid(
      'CREATED', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 
      'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'
    ),
    customer_id: Joi.number().integer().positive(),
    from_date: Joi.date().iso(),
    to_date: Joi.date().iso().min(Joi.ref('from_date'))
  }).concat(commonSchemas.pagination)
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  validateBody,
  commonSchemas,
  authSchemas,
  productSchemas,
  storeSchemas,
  brandSchemas,
  categorySchemas,
  cartSchemas,
  orderSchemas
};

