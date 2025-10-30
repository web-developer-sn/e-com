exports.up = function(knex) {
  return knex.schema.createTable('brands', function(table) {
    table.bigIncrements('id').primary();
    table.string('name', 255).notNullable();
    table.bigInteger('account_id').unsigned().nullable();
    table.bigInteger('created_by').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['account_id', 'name'], 'unique_brand_account');
    table.index(['account_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('brands');
};

