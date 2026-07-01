import { Router } from 'express';
import { getAuthUrl, handleCallback } from '../services/driveService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/auth', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).send('Missing userId');
  }
  const url = getAuthUrl(userId as string);
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  
  if (!code || !userId) {
    return res.status(400).send('Invalid callback');
  }

  try {
    const email = await handleCallback(code as string, userId as string);
    // Return a success HTML page that auto closes
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #4CAF50;">✅ Google Drive Berhasil Dihubungkan!</h2>
          <p>Akun <b>${email}</b> telah terhubung. Video akan diunggah secara otomatis.</p>
          <p>Anda bisa menutup jendela ini sekarang.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.status(500).send('Gagal menghubungkan ke Google Drive.');
  }
});

router.get('/status', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ connected: false });
  
  const driveAuth = await prisma.driveIntegration.findUnique({
    where: { userId: userId as string }
  });

  if (driveAuth) {
    return res.json({ connected: true, email: driveAuth.email });
  }
  
  res.json({ connected: false });
});

export default router;
