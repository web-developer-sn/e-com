exports.up = function(knex) {
  return knex.schema.createTable('cart_items', function(table) {
    table.bigIncrements('id').primary();
    table.bigInteger('cart_id').unsigned().notNullable();
    table.bigInteger('product_id').unsigned().notNullable();
    table.bigInteger('store_id').unsigned().notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('price_snapshot', 10, 2).notNullable(); 
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('cart_id').references('id').inTable('carts').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    
    table.unique(['cart_id', 'product_id', 'store_id'], 'unique_cart_product_store');
    table.index(['cart_id']);
    table.index(['product_id']);
    table.index(['store_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cart_items');
};
