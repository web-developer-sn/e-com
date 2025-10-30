exports.up = function(knex) {
  return knex.schema.createTable('product_images', function(table) {
    table.bigIncrements('id').primary();
    table.bigInteger('product_id').unsigned().notNullable();
    table.string('url', 1024).notNullable();
    table.string('public_id', 255).nullable();
    table.boolean('is_primary').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.index(['product_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_images');
};

