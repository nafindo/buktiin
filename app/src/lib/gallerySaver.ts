import { registerPlugin, Capacitor } from '@capacitor/core';
import { getLocalVideoBlob } from './videoStorage';

interface GallerySaverPlugin {
  saveVideoToGallery(options: { base64Data: string; filename: string }): Promise<{ success: boolean; message?: string }>;
  downloadVideoFromUrl(options: { url: string; filename: string }): Promise<{ success: boolean; message?: string }>;
}

const GallerySaver = registerPlugin<GallerySaverPlugin>('GallerySaver');

/**
 * Converts a Blob to a Base64 string safely
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) {
        reject(new Error('Gagal membaca data video'));
        return;
      }
      const commaIndex = result.indexOf(',');
      const base64 = commaIndex >= 0 ? result.substring(commaIndex + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('FileReader gagal membaca blob video'));
    reader.readAsDataURL(blob);
  });
}

export interface SaveGalleryResult {
  success: boolean;
  message: string;
}

/**
 * Saves a recording directly to the Android Phone Gallery (Galeri HP) or downloads it via browser.
 */
export async function saveRecordingToGallery(record: {
  id: string;
  resi?: string;
  driveFileId?: string;
  videoPath?: string;
}): Promise<SaveGalleryResult> {
  const safeResi = (record.resi || record.id || 'rekaman').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `buktiin_${safeResi}.mp4`;
  const isNative = Capacitor.isNativePlatform();

  // 1. Try local IndexedDB blob first
  try {
    const localBlob = await getLocalVideoBlob(record.id);
    if (localBlob && localBlob.size > 0) {
      if (isNative) {
        const base64Data = await blobToBase64(localBlob);
        const res = await GallerySaver.saveVideoToGallery({ base64Data, filename });
        return {
          success: true,
          message: res?.message || 'Video berhasil disimpan ke Galeri HP!'
        };
      } else {
        // Browser download fallback
        const url = URL.createObjectURL(localBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return {
          success: true,
          message: 'Video berhasil diunduh ke perangkat Anda.'
        };
      }
    }
  } catch (err: any) {
    console.warn('[GallerySaver] Local blob retrieval error:', err);
  }

  // 2. If not in local storage, check Cloud Server / Google Drive
  let downloadUrl = '';
  if (record.driveFileId) {
    downloadUrl = `https://drive.google.com/uc?export=download&id=${record.driveFileId}`;
  } else if (record.videoPath && !record.videoPath.startsWith('local://')) {
    const filenameFromPath = record.videoPath.split(/[\/\\]/).pop();
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
    downloadUrl = `${API_URL}/api/stream/${filenameFromPath}?download=true`;
  }

  if (downloadUrl) {
    if (isNative) {
      const res = await GallerySaver.downloadVideoFromUrl({ url: downloadUrl, filename });
      return {
        success: true,
        message: res?.message || 'Video berhasil diunduh dan disimpan ke Galeri HP!'
      };
    } else {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return {
        success: true,
        message: 'Memulai unduhan video dari Cloud Server...'
      };
    }
  }

  throw new Error('File video tidak ditemukan di penyimpanan HP maupun Cloud Server.');
}
