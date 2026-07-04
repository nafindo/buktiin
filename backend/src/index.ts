import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import driveRoutes from './routes/drive';


import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('BUKTIIN Backend API is running');
});

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Start server - bind explicitly to 127.0.0.1 to avoid IPv6 conflict on Windows
app.listen(Number(port), '127.0.0.1', () => {
  console.log(`Server is running on http://127.0.0.1:${port}`);
});
