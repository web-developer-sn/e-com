exports.up = function(knex) {
  return knex.schema.createTable('order_items', function(table) {
    table.bigIncrements('id').primary();
    table.bigInteger('order_id').unsigned().notNullable();
    table.bigInteger('product_id').unsigned().notNullable();
    table.bigInteger('store_id').unsigned().notNullable();
    table.string('product_name', 255).notNullable(); 
    table.string('product_sku', 100).nullable(); 
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable(); 
    table.decimal('total_price', 10, 2).notNullable(); 
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('order_id').references('id').inTable('orders').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('RESTRICT');
    table.foreign('store_id').references('id').inTable('stores').onDelete('RESTRICT');
    
    table.index(['order_id']);
    table.index(['product_id']);
    table.index(['store_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('order_items');
};
