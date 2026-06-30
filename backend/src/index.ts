import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config();

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

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
