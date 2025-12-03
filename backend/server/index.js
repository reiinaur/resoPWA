import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import authRoutes from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: ['https://resopwa.up.railway.app'], 
  credentials: true
}));

app.use(express.json());
app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});