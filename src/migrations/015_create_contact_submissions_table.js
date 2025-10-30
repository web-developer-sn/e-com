exports.up = function(knex) {
  return knex.schema.createTable('contact_submissions', function(table) {
    table.bigIncrements('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 32).nullable();
    table.string('company', 255).nullable();
    table.string('subject', 500).notNullable();
    table.text('message').notNullable();
    table.enum('status', ['new', 'in_progress', 'resolved', 'closed']).defaultTo('new');
    table.string('ip_address', 45).nullable(); 
    table.text('user_agent').nullable();
    table.bigInteger('updated_by').unsigned().nullable(); 
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['email']);
    table.index(['status']);
    table.index(['created_at']);
    table.index(['subject']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('contact_submissions');
};
