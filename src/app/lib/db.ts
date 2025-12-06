import mysql, { Pool } from "mysql2/promise";

let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASS!,
      database: process.env.DB_NAME!,
      port: Number(process.env.DB_PORT) || 3306,  // ⬅ penting
      connectionLimit: 10,
    });
  }
  return pool;
}
