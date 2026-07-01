import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// URL Web App dari Google Apps Script
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzqGBtG_h326vqSVMx_sXYqE7G78NFlhfrMsY_U8JqwrL4UlllxnnMExP12FDj0qro/exec';

export const processPendingUploads = async () => {
  console.log('[Background Worker] Checking for pending Google Drive uploads via Apps Script...');
  
  try {
    const pendingRecordings = await prisma.recording.findMany({
      where: { 
        uploadStatus: 'PENDING',
        status: 'DONE',
        videoPath: { not: null }
      },
      take: 5
    });

    if (pendingRecordings.length === 0) return;

    for (const recording of pendingRecordings) {
      if (!recording.videoPath || !fs.existsSync(recording.videoPath)) {
        await prisma.recording.update({
          where: { id: recording.id },
          data: { uploadStatus: 'FAILED' }
        });
        continue;
      }

      // Update status to UPLOADING
      await prisma.recording.update({
        where: { id: recording.id },
        data: { uploadStatus: 'UPLOADING' }
      });

      try {
        const fileName = `${recording.resi}_${recording.marketplace}.webm`;
        
        // Baca video dan konversi ke Base64
        const fileBuffer = fs.readFileSync(recording.videoPath);
        const base64Data = fileBuffer.toString('base64');
        
        const payload = {
           fileName: fileName,
           mimeType: 'video/webm',
           fileData: base64Data
        };

        const response = await fetch(GAS_URL, {
           method: 'POST',
           body: JSON.stringify(payload),
           headers: {
             'Content-Type': 'application/json'
           }
        });

        const result = await response.json();

        if (result.status === 'success' && result.id) {
          // SUCCESS! Update DB 
          await prisma.recording.update({
            where: { id: recording.id },
            data: { 
              uploadStatus: 'SUCCESS',
              driveFileId: result.id
            }
          });
          console.log(`[Background Worker] Successfully uploaded ${fileName} to Drive via GAS. ID: ${result.id}`);
        } else {
          console.error(`[Background Worker] GAS Error for ${recording.id}:`, result.message);
          throw new Error(result.message || 'Unknown GAS Error');
        }

      } catch (err) {
        console.error(`Failed to upload recording ${recording.id}:`, err);
        await prisma.recording.update({
          where: { id: recording.id },
          data: { uploadStatus: 'FAILED' }
        });
      }
    }
  } catch (error) {
    console.error('Error in processPendingUploads worker:', error);
  }
};
