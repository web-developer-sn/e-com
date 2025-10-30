exports.up = function(knex) {
  return knex.schema.createTable('product_store', function(table) {
    table.bigIncrements('id').primary();
    table.bigInteger('product_id').unsigned().notNullable();
    table.bigInteger('store_id').unsigned().notNullable();
    table.integer('stock').defaultTo(0);
    table.decimal('price', 10, 2).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.unique(['product_id', 'store_id'], 'uq_product_store');
    table.index(['product_id']);
    table.index(['store_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_store');
};

