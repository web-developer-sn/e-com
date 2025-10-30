exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.bigIncrements('id').primary();
    table.string('order_number', 50).notNullable().unique();
    table.bigInteger('customer_id').unsigned().notNullable();
    table.bigInteger('shipping_address_id').unsigned().notNullable();
    table.enum('status', [
      'CREATED', 
      'PAYMENT_PENDING', 
      'PAID', 
      'PROCESSING', 
      'SHIPPED', 
      'DELIVERED', 
      'CANCELLED', 
      'FAILED'
    ]).defaultTo('CREATED');
    table.decimal('subtotal', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('shipping_amount', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('discount_amount', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0.00);
    table.string('currency', 3).defaultTo('USD');
    table.string('razorpay_order_id', 100).nullable();
    table.string('razorpay_payment_id', 100).nullable();
    table.string('razorpay_signature', 255).nullable();
    table.timestamp('payment_completed_at').nullable();
    table.text('notes').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('customer_id').references('id').inTable('customers').onDelete('RESTRICT');
    table.foreign('shipping_address_id').references('id').inTable('customer_addresses').onDelete('RESTRICT');
    
    table.index(['customer_id']);
    table.index(['status']);
    table.index(['order_number']);
    table.index(['razorpay_order_id']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};
