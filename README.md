# E-commerce API

A comprehensive Node.js + Express REST API for e-commerce applications with authentication, product management, shopping cart, order processing, and payment integration.

## Features

- 🔐 **JWT Authentication** - Separate auth for admins and customers
- 📦 **Product Management** - Complete CRUD with brands, categories, and multi-store inventory
- 🏪 **Store Management** - Location-aware store search using Haversine formula
- 🛒 **Shopping Cart** - Full cart management with stock validation
- 📋 **Order Processing** - Complete order lifecycle with status management
- 💳 **Payment Integration** - Razorpay integration with webhooks
- 📁 **File Uploads** - Image upload with Cloudinary integration
- 🔍 **Advanced Search** - Product filtering and pagination
- 📍 **Geolocation** - Nearby store search with distance calculation
- 📧 **Notifications** - Email and push notifications for order events
- 📞 **Contact Form** - Customer support contact form with admin management
- ✅ **Validation** - Comprehensive input validation with Joi
- 🛡️ **Security** - Rate limiting, CORS, helmet, and secure headers
- 📊 **Logging** - Structured logging with Pino
- 🚀 **Production Ready** - Error handling, monitoring, and observability

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Knex.js query builder
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **File Upload**: Multer + Cloudinary
- **Payment**: Razorpay
- **Logging**: Pino
- **Security**: Helmet, CORS, Rate Limiting
- **Documentation**: OpenAPI 3.0

## Quick Start

### Prerequisites

- Node.js 16+ 
- MySQL 8.0+
- Cloudinary account (for file uploads)
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd e-commerce-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ecommerce_db
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
   JWT_EXPIRES_IN=7d
   
   # Email Configuration (for notifications and contact form)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=smtp_user
   SMTP_PASS=smtp_pass
   SMTP_FROM=noreply@example.com
   ADMIN_EMAIL=admin@example.com
   SUPPORT_EMAIL=support@example.com
   
   # Cloudinary Configuration
   CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
   
   # Razorpay Configuration
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=yyy
   
   # Frontend Configuration
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE ecommerce_db;"
   
   # Run migrations
   npm run migrate
   
   # Seed demo data (optional)
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

Most endpoints require authentication via JWT token:
```bash
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /api/admin/register` - Register admin user
- `POST /api/admin/login` - Admin login
- `POST /api/customers/register` - Register customer
- `POST /api/customers/login` - Customer login
- `GET /api/customers/me` - Get customer profile

#### Products
- `GET /api/products` - Get products (with filtering)
- `POST /api/products` - Create product (Admin)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

#### Stores
- `GET /api/stores` - Get stores
- `GET /api/stores/nearby?lat=40.7128&lng=-74.0060&radius=5` - Get nearby stores
- `POST /api/stores` - Create store (Admin)

#### Cart (Customer only)
- `GET /api/cart` - Get cart with items
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:itemId` - Update item quantity
- `DELETE /api/cart/items/:itemId` - Remove item
- `DELETE /api/cart` - Clear cart

#### Orders (Customer)
- `GET /api/orders` - Get customer orders
- `POST /api/orders` - Create order from cart
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/payment` - Initiate payment
- `POST /api/orders/:id/payment/verify` - Verify payment
- `POST /api/orders/:id/cancel` - Cancel order

#### File Uploads
- `POST /api/uploads/single` - Upload single image
- `POST /api/uploads/multiple` - Upload multiple images

#### Contact Form
- `POST /api/contact` - Submit contact form (public, rate-limited)
- `GET /api/contact/admin/submissions` - Get contact submissions (Admin)
- `GET /api/contact/admin/submissions/:id` - Get specific submission (Admin)
- `PATCH /api/contact/admin/submissions/:id/status` - Update submission status (Admin)
- `GET /api/contact/admin/stats` - Get contact form statistics (Admin)

### Example Requests

#### Register Customer
```bash
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "address": {
      "address_line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postal_code": "10001",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }'
```

#### Add Item to Cart
```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer <customer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "store_id": 1,
    "quantity": 2
  }'
```

#### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <customer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address_id": 1,
    "notes": "Please deliver after 6 PM"
  }'
```

#### Submit Contact Form
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Product Inquiry",
    "message": "I have a question about your products..."
  }'
```

## Database Schema

### Key Tables

- **users** - Admin users
- **customers** - Customer accounts
- **customer_addresses** - Customer shipping addresses
- **brands** - Product brands
- **categories** - Product categories (hierarchical)
- **products** - Product catalog
- **product_images** - Product images
- **stores** - Physical store locations
- **product_store** - Product-store inventory mapping
- **product_categories** - Product-category mapping
- **carts** - Customer shopping carts
- **cart_items** - Cart line items
- **orders** - Customer orders
- **order_items** - Order line items
- **contact_submissions** - Contact form submissions

### Relationships

- Products belong to one Brand and multiple Categories
- Products can be available in multiple Stores with different stock/pricing
- Customers can have multiple Addresses
- Orders reference a specific shipping Address
- Cart and Order items capture price snapshots

## Business Logic

### Product Management
- Products require exactly one Brand and at least one Category
- Brand and Category scope validation for multi-tenant scenarios
- Stock management per store location

### Cart Management
- Automatic cart creation for customers
- Stock validation when adding/updating items
- Price snapshot preservation
- Cart validation before checkout

### Order Processing
1. **Order Creation** - Convert cart to order with price snapshots
2. **Payment Initiation** - Create Razorpay order
3. **Payment Verification** - Verify payment signature
4. **Order Fulfillment** - Status progression (CREATED → PAID → SHIPPED → DELIVERED)
5. **Cancellation** - Handle cancellations with refund logic

### Location Services
- Haversine formula for distance calculation
- Nearby store search with configurable radius
- Geographic indexing for performance

### Notification System
- **Decoupled Architecture** - Pluggable notification providers
- **Email Notifications** - Order events, payment status, welcome emails
- **Push Notifications** - Mobile app notifications (Firebase FCM ready)
- **Event-Driven** - Automatic notifications on order lifecycle events
- **Template System** - Rich HTML email templates
- **Error Handling** - Graceful failure handling without breaking main flow

### Contact Form System
- **Public Endpoint** - Rate-limited contact form submission
- **Admin Management** - View, update status, and manage submissions
- **Email Integration** - Automatic email forwarding to admin
- **Analytics** - Contact form statistics and reporting
- **Status Tracking** - Track submission status (new, in_progress, resolved, closed)

## Payment Integration

### Razorpay Setup
1. Create Razorpay account and get API keys
2. Configure webhook endpoint: `POST /api/webhooks/razorpay`
3. Set webhook secret in environment variables

### Payment Flow
1. Customer creates order
2. Initiate payment → Creates Razorpay order
3. Frontend handles payment UI
4. Verify payment signature on backend
5. Update order status to PAID

## File Upload

### Cloudinary Integration
- Automatic image optimization
- Multiple format support (JPEG, PNG, WebP, GIF)
- Configurable transformations
- Secure upload with public_id tracking

## Security Features

- **JWT Authentication** with configurable expiration
- **Rate Limiting** on API endpoints
- **Input Validation** with Joi schemas
- **SQL Injection Protection** with parameterized queries
- **CORS Configuration** for cross-origin requests
- **Security Headers** with Helmet
- **Password Hashing** with bcrypt

## Development

### Available Scripts
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run migrate     # Run database migrations
npm run migrate:rollback  # Rollback migrations
npm run seed        # Run database seeds
npm test           # Run tests
npm test:watch     # Run tests in watch mode
```

### Project Structure
```
src/
├── config/         # Configuration files
├── controllers/    # Route handlers
├── services/       # Business logic
├── middlewares/    # Express middlewares
├── routes/         # API routes
├── migrations/     # Database migrations
├── seeds/          # Database seeds
├── utils/          # Utility functions
└── app.js         # Express application
```

### Adding New Features
1. Create migration for database changes
2. Add validation schemas in `middlewares/validation.js`
3. Implement service layer logic
4. Create controller methods
5. Define routes with proper middleware
6. Update OpenAPI documentation

## Production Deployment

### Environment Variables
Ensure all production environment variables are set:
- Database credentials
- JWT secret (long and secure)
- Cloudinary configuration
- Razorpay credentials
- CORS origins

### Database
- Use connection pooling
- Set up read replicas for scaling
- Regular backups
- Monitor slow queries

### Security
- Use HTTPS in production
- Set secure JWT expiration
- Configure rate limiting
- Monitor for suspicious activity
- Regular security updates

### Monitoring
- Set up application monitoring (e.g., New Relic, DataDog)
- Log aggregation (e.g., ELK stack)
- Error tracking (e.g., Sentry)
- Performance monitoring

## API Testing

### Using curl
```bash
# Health check
curl http://localhost:3000/health

# Get products
curl http://localhost:3000/api/products

# Get nearby stores
curl "http://localhost:3000/api/stores/nearby?lat=40.7128&lng=-74.0060&radius=10"
```

### Using Postman
Import the OpenAPI specification (`openapi.yaml`) into Postman for interactive testing.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Update documentation
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Email: support@example.com

## Changelog

### v1.0.0
- Initial release
- Complete e-commerce API functionality
- Razorpay payment integration
- Cloudinary file upload
- Location-based store search
- Comprehensive documentation
