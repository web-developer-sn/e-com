const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  await knex('product_categories').del();
  await knex('product_store').del();
  await knex('product_images').del();
  await knex('products').del();
  await knex('customer_addresses').del();
  await knex('customers').del();
  await knex('stores').del();
  await knex('categories').del();
  await knex('brands').del();
  await knex('users').del();
  const hashedPassword = await bcrypt.hash('password123', 12);
  const [adminId] = await knex('users').insert([
    {
      id: 1,
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'superadmin'
    },
    {
      id: 2,
      name: 'Store Manager',
      email: 'manager@example.com',
      password: hashedPassword,
      role: 'admin'
    }
  ]);
  await knex('customers').insert([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      password: hashedPassword
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
      password: hashedPassword
    }
  ]);

  await knex('customer_addresses').insert([
    {
      customer_id: 1,
      label: 'Home',
      address_line1: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postal_code: '10001',
      latitude: 40.7128,
      longitude: -74.0060,
      is_default: true
    },
    {
      customer_id: 2,
      label: 'Home',
      address_line1: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      postal_code: '90001',
      latitude: 34.0522,
      longitude: -118.2437,
      is_default: true
    }
  ]);

  await knex('brands').insert([
    {
      id: 1,
      name: 'Apple',
      account_id: 1,
      created_by: 1
    },
    {
      id: 2,
      name: 'Samsung',
      account_id: 1,
      created_by: 1
    },
    {
      id: 3,
      name: 'Nike',
      account_id: 1,
      created_by: 1
    }
  ]);

  await knex('categories').insert([
    {
      id: 1,
      name: 'Electronics',
      account_id: 1,
      parent_id: null
    },
    {
      id: 2,
      name: 'Smartphones',
      account_id: 1,
      parent_id: 1
    },
    {
      id: 3,
      name: 'Laptops',
      account_id: 1,
      parent_id: 1
    },
    {
      id: 4,
      name: 'Clothing',
      account_id: 1,
      parent_id: null
    },
    {
      id: 5,
      name: 'Shoes',
      account_id: 1,
      parent_id: 4
    }
  ]);

  await knex('stores').insert([
    {
      id: 1,
      name: 'Downtown Store',
      code: 'DT001',
      contact_phone: '+1234567892',
      address_line1: '789 Broadway',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postal_code: '10003',
      latitude: 40.7282,
      longitude: -73.9942,
      account_id: 1
    },
    {
      id: 2,
      name: 'Mall Store',
      code: 'ML001',
      contact_phone: '+1234567893',
      address_line1: '321 Mall Blvd',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      postal_code: '90210',
      latitude: 34.0736,
      longitude: -118.4004,
      account_id: 1
    },
    {
      id: 3,
      name: 'Airport Store',
      code: 'AP001',
      contact_phone: '+1234567894',
      address_line1: '100 Airport Way',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postal_code: '60666',
      latitude: 41.9742,
      longitude: -87.9073,
      account_id: 1
    }
  ]);

  await knex('products').insert([
    {
      id: 1,
      name: 'iPhone 15 Pro',
      sku: 'IPHONE15PRO',
      description: 'Latest iPhone with advanced features',
      price: 999.99,
      status: 'active',
      brand_id: 1,
      account_id: 1,
      created_by: 1
    },
    {
      id: 2,
      name: 'Samsung Galaxy S24',
      sku: 'GALAXY-S24',
      description: 'Premium Android smartphone',
      price: 899.99,
      status: 'active',
      brand_id: 2,
      account_id: 1,
      created_by: 1
    },
    {
      id: 3,
      name: 'MacBook Pro 16"',
      sku: 'MBP16-2024',
      description: 'Professional laptop for creators',
      price: 2499.99,
      status: 'active',
      brand_id: 1,
      account_id: 1,
      created_by: 1
    },
    {
      id: 4,
      name: 'Nike Air Max 270',
      sku: 'NIKE-AM270',
      description: 'Comfortable running shoes',
      price: 150.00,
      status: 'active',
      brand_id: 3,
      account_id: 1,
      created_by: 1
    }
  ]);

  await knex('product_categories').insert([
    { product_id: 1, category_id: 2 }, 
    { product_id: 2, category_id: 2 }, 
    { product_id: 3, category_id: 3 }, 
    { product_id: 4, category_id: 5 }  
  ]);

  
  await knex('product_store').insert([
    { product_id: 1, store_id: 1, stock: 50, price: 999.99 },
    { product_id: 1, store_id: 2, stock: 30, price: 999.99 },
    { product_id: 2, store_id: 1, stock: 25, price: 899.99 },
    { product_id: 2, store_id: 3, stock: 40, price: 899.99 },
    { product_id: 3, store_id: 1, stock: 15, price: 2499.99 },
    { product_id: 3, store_id: 2, stock: 10, price: 2499.99 },
    { product_id: 4, store_id: 2, stock: 100, price: 150.00 },
    { product_id: 4, store_id: 3, stock: 75, price: 150.00 }
  ]);

  console.log(' Demo data seeded successfully');
};

