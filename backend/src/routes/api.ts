import { Router } from 'express';
import {
  getDashboardStats,
  getHistory,
  saveRecording,
  uploadVideo,
  checkLimits,
  getSubAccounts,
  addSubAccount,
  deleteSubAccount,
  streamVideo,
  retryPendingUploads
} from '../controllers/apiController';
import { migrateUserServer } from '../controllers/adminController';
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
import os from 'os';

const router = Router();

// Setup Multer for video uploads
const uploadDir = path.join(os.tmpdir(), 'buktiin_uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.webm');
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
router.post('/recordings/retry-pending', retryPendingUploads);
router.get('/stream/:filename', streamVideo);

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

// Admin
router.post('/admin/migrate-server', migrateUserServer);

export default router;
