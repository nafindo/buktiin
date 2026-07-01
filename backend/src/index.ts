import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import driveRoutes from './routes/drive';
import { processPendingUploads } from './services/driveService';
import { cleanupService } from './services/cleanupService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

import path from 'path';

// Base route
app.get('/', (req, res) => {
  res.send('BUKTIIN Backend API is running');
});

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
  // Start Background Worker (Runs every 1 minute)
  setInterval(() => {
    processPendingUploads();
  }, 60000);

  cleanupService.start();
});
