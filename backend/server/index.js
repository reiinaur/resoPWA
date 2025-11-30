import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import authRouter from './auth.js';
import { initDB } from './db.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Initialize SQLite once
let db;

async function initDB() {
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
}

initDB().catch(err => {
  console.error('DB init error:', err);
  process.exit(1);
});

// Routers
app.use('/auth', authRouter);

app.get('/health', (req, res) => res.send('OK'));

// Serve frontend
app.use(express.static(path.resolve(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
