const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
  const connection = await mysql.createConnection({
    host: 'acela.proxy.rlwy.net',
    user: 'root',
    password: 'IYRTrqvYZIShUZyIqslyviDYGBogYSsO',
    port: 41141,
    database: 'railway',
    multipleStatements: true
  });

  try {
    // Drop all tables first
    console.log('Dropping existing tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'railway'`
    );
    
    for (const table of tables) {
      console.log(`Dropping table: ${table.TABLE_NAME}`);
      await connection.query(`DROP TABLE IF EXISTS ${table.TABLE_NAME}`);
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    const sqlFile = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf8');
    console.log('Importing database...');
    await connection.query(sqlFile);
    console.log('Database imported successfully!');
  } catch (error) {
    console.error('Error importing database:', error.message);
  } finally {
    await connection.end();
  }
}

importDatabase();
