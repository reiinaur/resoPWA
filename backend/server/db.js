import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db;

export async function initDB() {
  if (db) return db; 

  db = await open({
    filename: path.resolve('server/data/spotify.db'), 
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      name TEXT,
      artist TEXT,
      album TEXT
    )
  `);

  console.log('SQLite initialized');
  return db;
}

export default db;
