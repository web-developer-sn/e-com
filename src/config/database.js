const knex = require('knex');
const config = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

const db = knex(dbConfig);


const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log(' Database connection established successfully');
  } catch (error) {
    console.error(' Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { db, testConnection };

