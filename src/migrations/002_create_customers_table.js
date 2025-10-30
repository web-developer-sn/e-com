exports.up = function(knex) {
  return knex.schema.createTable('customers', function(table) {
    table.bigIncrements('id').primary();
    table.string('email', 255).nullable().unique();
    table.string('phone', 32).nullable().unique();
    table.string('password', 255).notNullable();
    table.string('name', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['email']);
    table.index(['phone']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customers');
};

