import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/auth', authRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
