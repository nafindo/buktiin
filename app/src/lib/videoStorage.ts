// IndexedDB storage for local video recordings

const DB_NAME = 'buktiin_local_db';
const STORE_NAME = 'recordings_video';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface LocalRecordMetadata {
  resi?: string;
  companyName?: string;
  marketplace?: string;
  scanType?: 'PACKING' | 'UNBOXING';
  uploadStatus?: 'PENDING' | 'LOCAL_SAVED' | 'UPLOADING' | 'SUCCESS' | 'FAILED';
  driveFileId?: string;
  supabaseId?: string;
}

export async function saveLocalVideoBlob(
  recordingId: string,
  blob: Blob,
  metadata?: LocalRecordMetadata
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const item = {
        id: recordingId,
        blob: blob,
        createdAt: new Date().toISOString(),
        metadata: metadata || {}
      };
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Error saving video blob to IndexedDB:', e);
  }
}

export async function updateLocalRecordMetadata(
  recordingId: string,
  metadataUpdates: Partial<LocalRecordMetadata>
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(recordingId);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = {
            ...getReq.result,
            metadata: {
              ...(getReq.result.metadata || {}),
              ...metadataUpdates
            }
          };
          store.put(updated);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (e) {
    console.error('Error updating metadata in IndexedDB:', e);
  }
}

export async function getLocalVideoBlob(recordingId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(recordingId);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Error fetching local video blob from IndexedDB:', e);
    return null;
  }
}

export async function getAllLocalRecordings(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result || [];
        const mapped = results.map(item => ({
          id: item.id,
          resi: item.metadata?.resi || 'LOCAL_REC',
          customer: item.metadata?.companyName || 'Pelanggan',
          marketplace: item.metadata?.marketplace || 'OFFLINE',
          status: 'DONE',
          scan_type: item.metadata?.scanType || 'PACKING',
          items: [],
          videoPath: `local://${item.id}.mp4`,
          videoSize: item.blob?.size || 0,
          uploadStatus: item.metadata?.uploadStatus || 'LOCAL_SAVED',
          driveFileId: item.metadata?.driveFileId || null,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.createdAt || new Date().toISOString(),
          isLocal: true
        }));
        resolve(mapped);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Error getting local recordings from IndexedDB:', e);
    return [];
  }
}

export async function deleteLocalVideoBlob(recordingId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(recordingId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Error deleting local video blob:', e);
  }
}
