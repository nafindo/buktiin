import { Router } from 'express';
const router = Router();

router.get('/auth', (req, res) => {
  res.redirect('/settings'); // No longer using direct OAuth
});

router.get('/callback', async (req, res) => {
  res.send('Not used.');
});

router.get('/status', async (req, res) => {
  // Since we use a global Google Apps Script for uploading,
  // we can mock this as always connected so the UI shows it's working.
  res.json({ connected: true, email: 'cloud@buktiin.com' });
});

export default router;
