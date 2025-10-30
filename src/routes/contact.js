const express = require('express');
const Joi = require('joi');
const contactController = require('../controllers/contactController');
const { verifyToken, authorizeRole } = require('../middlewares/auth');
const { validateBody, validateQuery, validateParams, commonSchemas } = require('../middlewares/validation');
const rateLimit = require('express-rate-limit');

const router = express.Router();


const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 3, 
  message: {
    status: 'error',
    message: 'Too many contact form submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});


const contactSchemas = {
  submit: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).allow(''),
    company: Joi.string().max(255).allow(''),
    subject: Joi.string().min(5).max(500).required(),
    message: Joi.string().min(10).max(5000).required()
  }),
  
  updateStatus: Joi.object({
    status: Joi.string().valid('new', 'in_progress', 'resolved', 'closed').required()
  }),
  
  filters: Joi.object({
    status: Joi.string().valid('new', 'in_progress', 'resolved', 'closed'),
    from_date: Joi.date().iso(),
    to_date: Joi.date().iso().min(Joi.ref('from_date')),
    search: Joi.string().max(255)
  }).concat(commonSchemas.pagination),
  
  statsFilters: Joi.object({
    from_date: Joi.date().iso(),
    to_date: Joi.date().iso().min(Joi.ref('from_date'))
  })
};


router.post('/',
  contactFormLimiter,
  validateBody(contactSchemas.submit),
  contactController.submitContactForm
);


router.use(verifyToken);
router.use(authorizeRole(['admin', 'superadmin']));


router.get('/admin/submissions',
  validateQuery(contactSchemas.filters),
  contactController.getContactSubmissions
);


router.get('/admin/submissions/:id',
  validateParams(commonSchemas.id),
  contactController.getContactSubmissionById
);


router.patch('/admin/submissions/:id/status',
  validateParams(commonSchemas.id),
  validateBody(contactSchemas.updateStatus),
  contactController.updateContactSubmissionStatus
);


router.delete('/admin/submissions/:id',
  validateParams(commonSchemas.id),
  contactController.deleteContactSubmission
);


router.get('/admin/stats',
  validateQuery(contactSchemas.statsFilters),
  contactController.getContactStats
);

module.exports = router;
