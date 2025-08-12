// backend/db/db.js

import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Support both Railway defaults and optional custom env vars (prefer Railway)
let selectedHost = process.env.MYSQLHOST || process.env.DB_HOST;
let selectedUser = process.env.MYSQLUSER || process.env.DB_USER;
let selectedPassword = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;
let selectedDatabase = process.env.MYSQLDATABASE || process.env.DB_NAME;
let selectedPort = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);

// Guard against localhost accidentally set in envs on Render
if ((selectedHost === 'localhost' || selectedHost === '127.0.0.1') && process.env.MYSQLHOST) {
  selectedHost = process.env.MYSQLHOST;
}

const dbConfig = {
  host: selectedHost,
  user: selectedUser,
  password: selectedPassword,
  database: selectedDatabase,
  port: selectedPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Create a promise-enabled pool
const db = pool.promise();

// Test connection and log status (non-breaking)
pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection failed:', err);
  } else {
    console.log('MySQL connected successfully');
    connection.release(); // release to pool
  }
});

// Initialize database schema if tables are missing
async function initializeDatabase() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(190) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        dob DATE NULL,
        gender VARCHAR(20) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS bmi_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        height DECIMAL(6,3) NULL,
        height_unit VARCHAR(20) NULL,
        weight DECIMAL(6,2) NULL,
        weight_unit VARCHAR(20) NULL,
        bmi_value DECIMAL(5,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        diet_type VARCHAR(20) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        CONSTRAINT fk_bmi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message_type ENUM('user','ai') NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_streaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        streak_type ENUM('diet','exercise') NOT NULL,
        current_streak INT NOT NULL DEFAULT 0,
        longest_streak INT NOT NULL DEFAULT 0,
        last_completed_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_type (user_id, streak_type),
        CONSTRAINT fk_streak_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database schema ensured');
  } catch (schemaError) {
    console.error('Failed to initialize database schema:', schemaError);
  }
}

initializeDatabase();

export default db;
