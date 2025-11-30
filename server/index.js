import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import authRouter from './auth.js';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use('/auth', authRouter);

// --- SQLite setup ---
let db;
(async () => {
  try {
    db = await open({
      filename: path.resolve(__dirname, '.database/spotify.db'),
      driver: sqlite3.Database,
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
  } catch (err) {
    console.error('SQLite initialization error:', err);
  }
})();

// --- TEST ROUTE ---
app.get('/test-db', async (req, res) => {
  try {
    const rows = await db.all('SELECT name FROM tracks LIMIT 1');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB error');
  }
});

// --- Static frontend ---
app.use(express.static(path.resolve(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
