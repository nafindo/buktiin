import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Function to trigger background drive upload for a specific recording
export const triggerDriveUpload = async (recordingId: string, videoPath: string, accessToken: string, resi: string, marketplace: string) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
    // Create client using user's access token to fetch their storage node
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    });

    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData?.user) throw new Error('Failed to get user details');
    const userId = userData.user.id;

    // Fetch the assigned storage node for this user
    const { data: serverAssoc, error: serverError } = await client
      .from('user_servers')
      .select('storage_node_id, storage_nodes(folder_id, script_url)')
      .eq('user_id', userId)
      .single();

    let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // Fallback
    let scriptUrl = 'https://script.google.com/macros/s/AKfycbzqGBtG_h326vqSVMx_sXYqE7G78NFlhfrMsY_U8JqwrL4UlllxnnMExP12FDj0qro/exec'; // Fallback

    if (serverAssoc && serverAssoc.storage_nodes) {
      const node: any = serverAssoc.storage_nodes;
      if (node.folder_id) folderId = node.folder_id;
      if (node.script_url) scriptUrl = node.script_url;
    }

    if (!folderId || !scriptUrl) {
      throw new Error('Drive Script URL or Folder ID is missing. Please configure storage node properly.');
    }

    // Set to UPLOADING
    await client.from('recordings').update({ upload_status: 'UPLOADING' }).eq('id', recordingId);

    const fileName = `${resi}_${marketplace}.mp4`; // Note: we're using mp4 now
    const fileBuffer = fs.readFileSync(videoPath);
    const base64Data = fileBuffer.toString('base64');
    
    const payload = {
       fileName: fileName,
       mimeType: 'video/mp4',
       fileData: base64Data,
       folderId: folderId
    };

    const response = await fetch(scriptUrl, {
       method: 'POST',
       body: JSON.stringify(payload),
       headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (result.status === 'success' && result.id) {
      await client.from('recordings').update({ drive_file_id: result.id, upload_status: 'SUCCESS' }).eq('id', recordingId);
      console.log(`[DriveService] Successfully uploaded ${fileName}. ID: ${result.id}`);
    } else {
      throw new Error(result.message || 'Unknown GAS Error');
    }

  } catch (err: any) {
    console.error(`[DriveService] Failed to upload recording ${recordingId}:`, err);
    await client.from('recordings').update({ upload_status: 'FAILED' }).eq('id', recordingId);
  }
};

// Polling fallback mechanism
export const processPendingUploads = async () => {
  // In a real scenario, we might need a way to fetch the script_url and folder_id here too
  // Since processPendingUploads runs independently of an accessToken, we can't easily fetch it
  // unless we use a Service Role key. For now, triggerDriveUpload is the primary method.
  console.log('[Background Worker] processPendingUploads called but requires accessToken context now.');
};
