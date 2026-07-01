import { Router } from 'express';
import {
  getDashboardStats,
  getHistory,
  saveRecording,
  uploadVideo,
  checkLimits,
  getSubAccounts,
  addSubAccount,
  deleteSubAccount
} from '../controllers/apiController';
import {
  setupIntegration,
  syncOrderByResi
} from '../controllers/integrationController';
import {
  createPayment,
  activateSubscription
} from '../controllers/paymentController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Setup Multer for video uploads
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Routes
router.get('/dashboard', getDashboardStats);
router.get('/history', getHistory);
// Recordings
router.post('/check-limits', checkLimits);
router.post('/recordings', saveRecording);
router.post('/recordings/upload', upload.single('video'), uploadVideo);

// SubAccounts
router.get('/subaccounts', getSubAccounts);
router.post('/subaccounts', addSubAccount);
router.delete('/subaccounts/:id', deleteSubAccount);

// Integrations
router.post('/integrations/setup', setupIntegration);
router.get('/orders/sync', syncOrderByResi);

// Payments
router.post('/pay', createPayment);
router.post('/pay/activate', activateSubscription);

export default router;
