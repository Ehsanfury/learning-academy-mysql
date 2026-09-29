/**
 * ensure-test-db.js
 * Path: backend/scripts/ensure-test-db.js
 * Description: Creates the "<DB_NAME>_test" database if it doesn't exist yet.
 *
 * Why this exists:
 * - tests/setup/testSetup.js connects using config/db.js, which appends
 *   "_test" to DB_NAME whenever NODE_ENV=test.
 * - Unlike Postgres, MySQL supports "CREATE DATABASE IF NOT EXISTS" directly,
 *   so this no longer needs a separate existence check against a system
 *   catalog - one statement does it.
 * - Run as a "pretest" script so `npm test` (and CI) creates it automatically.
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const baseName = process.env.DB_NAME || "learning_academy";
const testDbName = `${baseName}_test`;

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
});

try {
  // Identifiers can't be parameterized; testDbName only ever comes from
  // our own env var (DB_NAME), never user input.
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${testDbName}\``);
  console.log(`✅ Test database ready: ${testDbName}`);
} catch (error) {
  console.error(`❌ Failed to ensure test database exists: ${error.message}`);
  process.exit(1);
} finally {
  await connection.end();
}
