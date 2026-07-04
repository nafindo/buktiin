import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzqGBtG_h326vqSVMx_sXYqE7G78NFlhfrMsY_U8JqwrL4UlllxnnMExP12FDj0qro/exec';

// Triggered asynchronously by uploadVideo
export const triggerDriveUpload = async (
  recordingId: string, 
  videoPath: string, 
  accessToken: string,
  resi: string,
  marketplace: string
) => {
  console.log(`[DriveService] Starting background upload for recording ${recordingId}...`);
  
  const client = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });

  try {
    // Set to UPLOADING
    await client.from('recordings').update({ upload_status: 'UPLOADING' }).eq('id', recordingId);

    if (!fs.existsSync(videoPath)) {
      await client.from('recordings').update({ upload_status: 'FAILED' }).eq('id', recordingId);
      return;
    }

    const fileName = `${resi}_${marketplace}.mp4`;
    
    // Read and encode base64
    const fileBuffer = fs.readFileSync(videoPath);
    const base64Data = fileBuffer.toString('base64');
    
    const payload = {
       fileName: fileName,
       mimeType: 'video/mp4',
       fileData: base64Data,
       folderId: '1RzzoTN6TAWdjzchTclguyaExAbuM3q0O'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

    console.log(`[DriveService] Uploading ${fileName} to Google Drive via GAS (Payload size: ${Math.round(JSON.stringify(payload).length / 1024)} KB)...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const textResult = await response.text();
    console.log('[DriveService] GAS raw response:', textResult);
    
    let result: any = {};
    try {
      result = JSON.parse(textResult);
    } catch(e) {
      console.error('[DriveService] Failed to parse GAS JSON:', e);
    }

    let fileId = result.id || result.fileId || (result.url && result.url.split('id=')[1]);
    
    // Fallback if url is something like /file/d/ID/view
    if (!fileId && result.url && result.url.includes('/file/d/')) {
       fileId = result.url.split('/file/d/')[1].split('/')[0];
    }

    if ((result.status === 'success' || result.status === 200) && fileId) {
      console.log(`[DriveService] Success! File ID: ${fileId}`);
      await client.from('recordings').update({ 
        upload_status: 'SUCCESS',
        drive_file_id: fileId 
      }).eq('id', recordingId);

      // Cleanup local file to save disk space
      try {
        // fs.unlinkSync(videoPath);
        // console.log(`[DriveService] Deleted local temp file: ${videoPath}`);
        console.log(`[DriveService] Kept local temp file for local playback: ${videoPath}`);
      } catch (err) {
        console.error('Failed to manage temp video:', err);
      }
    } else {
      console.error(`[DriveService] GAS upload failed:`, result);
      await client.from('recordings').update({ upload_status: 'FAILED' }).eq('id', recordingId);
    }
  } catch (err) {
    console.error(`[DriveService] Error during upload:`, err);
    await client.from('recordings').update({ upload_status: 'FAILED' }).eq('id', recordingId);
  }
};
