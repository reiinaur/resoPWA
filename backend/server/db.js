import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDB() {
  const dbPath = path.join(__dirname, 'db.sqlite'); 
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function setupDB() {
  const db = await initDB();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      name TEXT,
      artist TEXT,
      album TEXT
    )
  `);
  return db;
}
