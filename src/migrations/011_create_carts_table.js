exports.up = function(knex) {
  return knex.schema.createTable('carts', function(table) {
    table.bigIncrements('id').primary();
    table.bigInteger('customer_id').unsigned().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('customer_id').references('id').inTable('customers').onDelete('CASCADE');
    table.index(['customer_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('carts');
};
