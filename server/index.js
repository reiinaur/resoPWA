import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import authRouter from './auth.js';

dotenv.config();

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(cors({
  origin: "http://127.0.0.1:5173",
  credentials: true
}));

app.use('/auth', authRouter);

app.use(express.static(path.resolve(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server running at http://0.0.0.0:${PORT}`)
);
