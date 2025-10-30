exports.up = function(knex) {
  return knex.schema.createTable('product_categories', function(table) {
    table.bigIncrements('id').primary();
    table.bigInteger('product_id').unsigned().notNullable();
    table.bigInteger('category_id').unsigned().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('category_id').references('id').inTable('categories').onDelete('CASCADE');
    table.unique(['product_id', 'category_id'], 'uq_prod_cat');
    table.index(['product_id']);
    table.index(['category_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_categories');
};

