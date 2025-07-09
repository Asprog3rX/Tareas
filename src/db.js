const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = isProduction
  ? process.env.DATABASE_URL
  : process.env.DATABASE_URL_LOCAL;

const pool = new Pool({
  connectionString,
  ssl: isProduction
    ? {
        rejectUnauthorized: false, // importante para Render
      }
    : false,
});

module.exports = pool;