exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.bigIncrements('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('name', 200).nullable();
    table.enum('role', ['admin', 'superadmin']).defaultTo('admin');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['email']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};

