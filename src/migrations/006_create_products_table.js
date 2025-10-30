exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.bigIncrements('id').primary();
    table.string('name', 255).notNullable();
    table.string('sku', 100).nullable().unique();
    table.text('description').nullable();
    table.decimal('price', 10, 2).notNullable().defaultTo(0.00);
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.bigInteger('brand_id').unsigned().nullable();
    table.bigInteger('account_id').unsigned().nullable();
    table.bigInteger('created_by').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('brand_id').references('id').inTable('brands').onDelete('SET NULL');
    table.index(['brand_id']);
    table.index(['account_id']);
    table.index(['status']);
    table.index(['sku']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('products');
};

