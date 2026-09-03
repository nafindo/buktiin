import { supabase } from './supabase';
import { getLocalVideoBlob } from './videoStorage';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqGBtG_h326vqSVMx_sXYqE7G78NFlhfrMsY_U8JqwrL4UlllxnnMExP12FDj0qro/exec';
const DEFAULT_FOLDER_ID = '1RzzoTN6TAWdjzchTclguyaExAbuM3q0O';

/**
 * Converts a Blob to a raw base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface UploadResult {
  success: boolean;
  driveFileId?: string;
  url?: string;
  error?: string;
}

/**
 * Resolves the assigned Cloud Storage node configured in the Web App / DB
 */
async function resolveStorageConfig(userId?: string): Promise<{ folderId: string; scriptUrl: string }> {
  let folderId = DEFAULT_FOLDER_ID;
  let scriptUrl = DEFAULT_SCRIPT_URL;

  if (!userId) {
    return { folderId, scriptUrl };
  }

  try {
    const { data: serverAssoc } = await supabase
      .from('user_servers')
      .select('storage_node_id, storage_nodes(*)')
      .eq('user_id', userId)
      .single();

    if (serverAssoc && serverAssoc.storage_nodes) {
      const node: any = serverAssoc.storage_nodes;
      
      // Check script_url
      if (node.script_url && typeof node.script_url === 'string' && node.script_url.startsWith('http')) {
        scriptUrl = node.script_url;
      }

      // Check folder_id (may contain custom URL or ID)
      if (node.folder_id && typeof node.folder_id === 'string') {
        if (node.folder_id.startsWith('http')) {
          scriptUrl = node.folder_id;
        } else {
          folderId = node.folder_id;
        }
      }
    }
  } catch (err) {
    console.warn('[CloudUpload] Could not fetch user storage node, falling back to default:', err);
  }

  return { folderId, scriptUrl };
}

/**
 * Sends the upload payload to Cloud Storage Server using Native Capacitor HTTP (on Android)
 * or CORS-safe fetch (on web browser).
 */
async function sendToCloudStorage(scriptUrl: string, payload: any): Promise<any> {
  // 1. If running natively in Android APK via Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const response = await CapacitorHttp.post({
        url: scriptUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        data: payload
      });

      if (response.data) {
        return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      }
    } catch (nativeErr: any) {
      console.warn('[CloudUpload] CapacitorHttp error, trying fallback:', nativeErr);
    }
  }

  // 2. Web browser fallback: Use text/plain to avoid CORS OPTIONS preflight blocking
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Uploads a recorded video Blob directly to Cloud Storage Server.
 */
export async function uploadRecordingToDrive(
  recordingId: string,
  blob: Blob,
  resi: string,
  marketplace: string = 'OFFLINE'
): Promise<UploadResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Resolve user's storage node configured in web app
    const { folderId, scriptUrl } = await resolveStorageConfig(userId);

    // Mark Supabase recording status as UPLOADING
    if (userId && !recordingId.startsWith('rec_')) {
      await supabase
        .from('recordings')
        .update({ upload_status: 'UPLOADING' })
        .eq('id', recordingId);
    }

    const base64Data = await blobToBase64(blob);
    const fileName = `${resi || 'REC'}_${marketplace || 'OFFLINE'}.mp4`;
    const mimeType = blob.type && blob.type.includes('mp4') ? 'video/mp4' : (blob.type || 'video/webm');

    const payload = {
      fileName,
      mimeType,
      fileData: base64Data,
      folderId
    };

    const result = await sendToCloudStorage(scriptUrl, payload);

    if (result && result.status === 'success' && result.id) {
      if (userId && !recordingId.startsWith('rec_')) {
        await supabase
          .from('recordings')
          .update({
            drive_file_id: result.id,
            upload_status: 'SUCCESS'
          })
          .eq('id', recordingId);
      }
      return {
        success: true,
        driveFileId: result.id,
        url: result.url
      };
    } else {
      throw new Error(result?.message || 'Server penyimpanan tidak memberikan respons sukses');
    }
  } catch (error: any) {
    console.error(`[CloudUpload] Error uploading recording ${recordingId}:`, error);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !recordingId.startsWith('rec_')) {
        await supabase
          .from('recordings')
          .update({ upload_status: 'FAILED' })
          .eq('id', recordingId);
      }
    } catch (_) {}
    return {
      success: false,
      error: error?.message || String(error)
    };
  }
}

/**
 * Uploads a specific local record by ID
 */
export async function uploadLocalRecordToDrive(recordingId: string, resi: string, marketplace?: string): Promise<UploadResult> {
  const localBlob = await getLocalVideoBlob(recordingId);
  if (!localBlob) {
    return { success: false, error: 'File video tidak ditemukan di penyimpanan lokal perangkat' };
  }
  return uploadRecordingToDrive(recordingId, localBlob, resi, marketplace || 'OFFLINE');
}

// Background auto-sync function for pending uploads
let isSyncing = false;
export async function syncPendingUploads(): Promise<number> {
  if (isSyncing) return 0;
  isSyncing = true;
  let successCount = 0;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 0;

    const { data: pendingList, error } = await supabase
      .from('recordings')
      .select('id, resi, marketplace, upload_status')
      .eq('user_id', session.user.id)
      .in('upload_status', ['PENDING', 'LOCAL_SAVED', 'FAILED', 'UPLOADING'])
      .is('drive_file_id', null)
      .order('created_at', { ascending: false })
      .limit(15);

    if (error || !pendingList || pendingList.length === 0) return 0;

    for (const rec of pendingList) {
      try {
        const localBlob = await getLocalVideoBlob(rec.id);
        if (localBlob) {
          const res = await uploadRecordingToDrive(rec.id, localBlob, rec.resi, rec.marketplace);
          if (res.success) {
            successCount++;
          }
        }
      } catch (err) {
        console.warn(`[CloudUpload] Sync failed for rec ${rec.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[CloudUpload] syncPendingUploads error:', err);
  } finally {
    isSyncing = false;
  }

  return successCount;
}
