const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken, authorizeRole } = require('../middlewares/auth');
const { validateBody, validateParams, authSchemas, commonSchemas } = require('../middlewares/validation');

const router = express.Router();


router.post('/admin/register', 
  validateBody(authSchemas.adminRegister),
  authController.registerAdmin
);

router.post('/admin/login',
  validateBody(authSchemas.adminLogin),
  authController.loginAdmin
);


router.post('/customers/register',
  validateBody(authSchemas.customerRegister),
  authController.registerCustomer
);

router.post('/customers/login',
  validateBody(authSchemas.customerLogin),
  authController.loginCustomer
);

router.get('/customers/me',
  verifyToken,
  authorizeRole('customer'),
  authController.getCustomerProfile
);

router.put('/customers/me/address/:addressId',
  verifyToken,
  authorizeRole('customer'),
  validateParams(commonSchemas.id),
  authController.updateCustomerAddress
);

module.exports = router;

