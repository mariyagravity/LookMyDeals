import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const port = Number(process.env.DB_PORT || 3306);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be a valid TCP port.');
}

export const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port,
  database: process.env.DB_NAME || 'lookmydeals',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'Z',
  supportBigNumbers: true,
  bigNumberStrings: true,
});

export async function checkDatabaseConnection(): Promise<void> {
  const connection = await db.getConnection();
  try {
    await connection.query("SET time_zone = '+00:00'");
    await connection.ping();
  } finally {
    connection.release();
  }
}
