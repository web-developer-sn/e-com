exports.up = function(knex) {
  return knex.schema.createTable('stores', function(table) {
    table.bigIncrements('id').primary();
    table.string('name', 255).notNullable();
    table.string('code', 100).notNullable().unique();
    table.string('contact_phone', 32).nullable();
    table.string('address_line1', 255).nullable();
    table.string('address_line2', 255).nullable();
    table.string('city', 100).nullable();
    table.string('state', 100).nullable();
    table.string('country', 100).nullable();
    table.string('postal_code', 20).nullable();
    table.decimal('latitude', 10, 7).notNullable();
    table.decimal('longitude', 10, 7).notNullable();
    table.bigInteger('account_id').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['account_id']);
    table.index(['latitude', 'longitude'], 'idx_stores_latlong');
    table.index(['code']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('stores');
};

