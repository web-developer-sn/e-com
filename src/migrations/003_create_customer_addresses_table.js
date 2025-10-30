exports.up = function(knex) {
  return knex.schema.createTable('customer_addresses', function(table) {
    table.bigIncrements('id').primary();
    table.bigInteger('customer_id').unsigned().notNullable();
    table.string('label', 100).nullable();
    table.string('address_line1', 255).nullable();
    table.string('address_line2', 255).nullable();
    table.string('city', 100).nullable();
    table.string('state', 100).nullable();
    table.string('country', 100).nullable();
    table.string('postal_code', 20).nullable();
    table.decimal('latitude', 10, 7).notNullable();
    table.decimal('longitude', 10, 7).notNullable();
    table.boolean('is_default').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('customer_id').references('id').inTable('customers').onDelete('CASCADE');
    table.index(['customer_id']);
    table.index(['latitude', 'longitude'], 'idx_customer_latlong');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customer_addresses');
};

