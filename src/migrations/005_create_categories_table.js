exports.up = function(knex) {
  return knex.schema.createTable('categories', function(table) {
    table.bigIncrements('id').primary();
    table.string('name', 255).notNullable();
    table.bigInteger('account_id').unsigned().nullable();
    table.bigInteger('parent_id').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('parent_id').references('id').inTable('categories').onDelete('SET NULL');
    table.unique(['account_id', 'name'], 'unique_category_account');
    table.index(['account_id']);
    table.index(['parent_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categories');
};

