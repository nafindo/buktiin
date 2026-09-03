import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalVideoBlob, getAllLocalRecordings, deleteLocalVideoBlob } from '../lib/videoStorage';
import { syncPendingUploads, uploadLocalRecordToDrive } from '../lib/driveUpload';
import { saveRecordingToGallery } from '../lib/gallerySaver';

export default function ScanHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<{
    type: 'local' | 'stream' | 'drive';
    url?: string;
    driveFileId?: string;
    resi?: string;
    record?: any;
  } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // 1. Clean up dangling 'PROCESS' rows in Supabase (from interrupted scans)
    try {
      await supabase
        .from('recordings')
        .delete()
        .eq('user_id', session.user.id)
        .eq('status', 'PROCESS');
    } catch (_) {}

    // 2. Fetch Local IndexedDB recordings
    const localRecords = await getAllLocalRecordings();
    const packingLocals = localRecords.filter(r => !r.scan_type || r.scan_type === 'PACKING');

    // 3. Fetch Remote Supabase Query (exclude incomplete PROCESS rows)
    let remoteRecords: any[] = [];
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', session.user.id)
        .neq('status', 'PROCESS')
        .order('created_at', { ascending: false });

      if (!error && data) {
        remoteRecords = data
          .filter((h: any) => !h.scan_type || h.scan_type === 'PACKING')
          .map((h: any) => ({
            id: h.id,
            resi: h.resi,
            customer: h.customer || 'Pelanggan',
            marketplace: h.marketplace || 'OFFLINE',
            status: h.status || 'DONE',
            scan_type: h.scan_type || 'PACKING',
            items: h.items || [],
            videoPath: h.video_path,
            videoSize: Number(h.video_size) || 0,
            uploadStatus: h.upload_status || 'PENDING',
            driveFileId: h.drive_file_id,
            createdAt: h.created_at,
            updatedAt: h.updated_at,
            isLocal: false
          }));
      }
    } catch (err) {
      console.warn("Direct Supabase history fetch error, using local data:", err);
    }

    // 4. Deduplicate and Purge Un-uploaded Duplicate Ghost Entries
    const cleanMap = new Map<string, any>();
    const allRecords = [...remoteRecords, ...packingLocals];

    for (const item of allRecords) {
      const cleanResi = (item.resi || '').trim().toUpperCase();
      const key = (cleanResi && cleanResi !== 'LOCAL_REC' && cleanResi !== 'REC')
        ? `resi_${cleanResi}`
        : `id_${item.id}`;

      const existing = cleanMap.get(key);
      if (!existing) {
        cleanMap.set(key, item);
      } else {
        const itemIsUploaded = Boolean(item.driveFileId || item.uploadStatus === 'SUCCESS');
        const existingIsUploaded = Boolean(existing.driveFileId || existing.uploadStatus === 'SUCCESS');

        if (itemIsUploaded && !existingIsUploaded) {
          // 'item' is uploaded, 'existing' is an un-uploaded duplicate -> Delete the ghost!
          if (existing.isLocal) {
            deleteLocalVideoBlob(existing.id);
          } else {
            supabase.from('recordings').delete().eq('id', existing.id).then();
          }
          cleanMap.set(key, { ...existing, ...item, id: item.id || existing.id });
        } else if (!itemIsUploaded && existingIsUploaded) {
          // 'existing' is uploaded, 'item' is an un-uploaded duplicate -> Delete the ghost!
          if (item.isLocal) {
            deleteLocalVideoBlob(item.id);
          } else {
            supabase.from('recordings').delete().eq('id', item.id).then();
          }
        } else {
          // Both uploaded or both pending -> Merge
          cleanMap.set(key, { ...existing, ...item });
        }
      }
    }

    const sorted = Array.from(cleanMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setHistory(sorted);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage('Sedang menyinkronkan video ke Cloud Server...');
    try {
      const uploadedCount = await syncPendingUploads();
      await fetchHistory();
      if (uploadedCount > 0) {
        setSyncMessage(`Berhasil menyinkronkan ${uploadedCount} video ke Cloud Server!`);
      } else {
        setSyncMessage('Semua rekaman telah tersimpan di Cloud Server.');
      }
    } catch (e: any) {
      setSyncMessage('Sinkronisasi selesai dengan beberapa penyesuaian.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleSingleUpload = async (record: any) => {
    try {
      setIsSyncing(true);
      const res = await uploadLocalRecordToDrive(record.id, record.resi, record.marketplace);
      if (res.success) {
        alert(`Video resi ${record.resi} berhasil diunggah ke Cloud Server!`);
        fetchHistory();
      } else {
        alert(`Gagal mengunggah: ${res.error || 'Terjadi kesalahan'}`);
      }
    } catch (e: any) {
      alert(`Gagal: ${e.message || String(e)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePlayVideo = async (record: any) => {
    // 1. Check local IndexedDB first
    try {
      const localBlob = await getLocalVideoBlob(record.id);
      if (localBlob) {
        const blobUrl = URL.createObjectURL(localBlob);
        setPlayingVideo({
          type: 'local',
          url: blobUrl,
          driveFileId: record.driveFileId,
          resi: record.resi,
          record: record
        });
        return;
      }
    } catch (e) {
      console.warn("Local blob retrieval error:", e);
    }

    // 2. Check if backend stream URL is accessible
    if (record.videoPath && !record.videoPath.startsWith('local://')) {
      const filename = record.videoPath.split(/[\/\\]/).pop();
      if (filename) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
        setPlayingVideo({
          type: 'stream',
          url: `${API_URL}/api/stream/${filename}`,
          driveFileId: record.driveFileId,
          resi: record.resi,
          record: record
        });
        return;
      }
    }

    // 3. Fallback to Cloud Server Preview Player
    if (record.driveFileId) {
      setPlayingVideo({
        type: 'drive',
        driveFileId: record.driveFileId,
        resi: record.resi,
        record: record
      });
      return;
    }

    alert('Video rekaman tidak ditemukan di penyimpanan perangkat maupun Cloud Server.');
  };

  const handleDownloadVideo = async (record: any) => {
    if (!record) return;
    try {
      setDownloadingId(record.id || record.resi || 'downloading');
      setSyncMessage(`Menyimpan video resi ${record.resi || record.id} ke Galeri HP...`);
      const result = await saveRecordingToGallery(record);
      setSyncMessage(result.message);
      alert(result.message);
    } catch (e: any) {
      console.error("Download video error:", e);
      alert(e.message || 'Gagal menyimpan video ke galeri HP.');
    } finally {
      setDownloadingId(null);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleCopyLink = (url: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      alert('Tautan Berhasil Disalin!\nAnda dapat mengirimkan link ini ke pelanggan Anda.');
    } catch (err) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          alert('Tautan Berhasil Disalin!');
        }).catch(() => {
          alert('Gagal menyalin tautan. URL: ' + url);
        });
      } else {
        alert('Gagal menyalin tautan. URL: ' + url);
      }
    }
  };

  const handleShare = (record: any, action: 'copy' | 'open') => {
    if (record.driveFileId) {
      const shareUrl = `https://nafindo.github.io/buktiin/#/?v=${record.driveFileId}`;
      if (action === 'copy') {
        handleCopyLink(shareUrl);
      } else {
        window.open(shareUrl, '_blank');
      }
    } else {
      alert('Video masih dalam proses sinkronisasi ke Cloud Server.\nTautan publik akan tersedia otomatis setelah video terunggah.');
    }
  };

  const filteredHistory = history.filter(record => {
     const isPacking = !record.scan_type || record.scan_type === 'PACKING';
     if (!isPacking) return false;

     let matchSearch = true;
     if (searchQuery) {
        const q = searchQuery.toLowerCase();
        matchSearch = (record.resi && record.resi.toLowerCase().includes(q)) || 
                      (record.customer && record.customer.toLowerCase().includes(q));
     }
     let matchDate = true;
     if (startDate && endDate) {
        const d = new Date(record.createdAt);
        const s = new Date(startDate);
        const e = new Date(endDate);
        e.setHours(23,59,59,999);
        matchDate = d >= s && d <= e;
     }
     return matchSearch && matchDate;
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="bg-surface border-b border-ui-divider px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="font-headline-md text-sm sm:text-base font-bold text-on-surface">Riwayat Packing</h1>
          <p className="font-body-md text-[10px] sm:text-xs text-on-surface-variant">
            Daftar rekaman packing tersimpan di perangkat lokal dan cloud server.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1 bg-primary text-white hover:opacity-90 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm disabled:opacity-50"
            title="Sinkronkan video ke Cloud Server"
          >
            <span className={`material-symbols-outlined text-xs ${isSyncing ? 'animate-spin' : ''}`}>
              {isSyncing ? 'sync' : 'cloud_upload'}
            </span>
            <span>{isSyncing ? 'Sync...' : 'Sync Cloud'}</span>
          </button>
          <button 
            onClick={fetchHistory}
            className="flex items-center gap-1 bg-surface-container-high hover:bg-primary/20 text-on-surface px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-ui-divider"
          >
            <span className="material-symbols-outlined text-xs">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Sync Banner Notification */}
      {syncMessage && (
        <div className="mx-3 mt-2 p-2 px-3 bg-primary-container text-on-primary-container text-[11px] font-bold rounded-lg border border-primary/20 flex items-center justify-between animate-[fade-in_0.2s_ease-out]">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs">info</span>
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        <div className="sm:col-span-6 relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input 
            type="text"
            placeholder="Cari Resi / Toko..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-ui-divider rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <div className="sm:col-span-3">
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-surface border border-ui-divider rounded-lg px-2 py-1.5 text-xs"
          />
        </div>
        <div className="sm:col-span-3">
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-surface border border-ui-divider rounded-lg px-2 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="px-2 sm:px-3 pb-3 flex-1">
        <div className="bg-surface border border-ui-divider rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-high border-b border-ui-divider text-[10px] text-on-surface-variant uppercase font-semibold">
                  <th className="px-2.5 py-2">Waktu</th>
                  <th className="px-2.5 py-2">No. Resi</th>
                  <th className="px-2.5 py-2">Customer</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2 text-center">Video</th>
                  <th className="px-2.5 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-divider">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-1 block">videocam_off</span>
                      Belum ada riwayat rekaman packing.
                    </td>
                  </tr>
                ) : (
                  filteredHistory
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((record) => {
                      const isCloudSynced = Boolean(record.driveFileId || record.uploadStatus === 'SUCCESS');
                      return (
                        <tr key={record.id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="px-2.5 py-2 whitespace-nowrap text-[10px] text-on-surface-variant">
                            {new Date(record.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-2.5 py-2 font-mono font-bold text-primary whitespace-nowrap">
                            {record.resi}
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap text-[11px] truncate max-w-[100px]">
                            {record.customer}
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap">
                            {record.status === 'DONE' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                Selesai
                              </span>
                            )}
                            {record.status === 'PROCESS' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                Proses
                              </span>
                            )}
                            {record.status === 'FAILED' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-800">
                                Gagal
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 text-center">
                            <button 
                              onClick={() => handlePlayVideo(record)} 
                              className="text-primary hover:scale-110 transition-transform inline-flex items-center justify-center p-0.5 rounded-full hover:bg-primary/10"
                              title="Putar Video"
                            >
                              <span className="material-symbols-outlined text-xl">play_circle</span>
                            </button>
                          </td>
                          <td className="px-2.5 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {!isCloudSynced && (
                                <button 
                                  onClick={() => handleSingleUpload(record)}
                                  disabled={isSyncing}
                                  title="Upload ke Cloud Server Sekarang"
                                  className="w-6 h-6 flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 rounded transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                </button>
                              )}
                              <button 
                                onClick={() => handleDownloadVideo(record)} 
                                title="Unduh Video"
                                className="w-6 h-6 flex items-center justify-center bg-surface-container hover:bg-primary/20 text-primary rounded transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">download</span>
                              </button>
                              <button 
                                onClick={() => handleShare(record, 'copy')} 
                                title="Salin Link"
                                className="w-6 h-6 flex items-center justify-center bg-surface-container hover:bg-primary/20 text-primary rounded transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">share</span>
                              </button>
                              <button 
                                onClick={() => setSelectedRecord(record)} 
                                title="Detail"
                                className="w-6 h-6 flex items-center justify-center bg-surface-container hover:bg-primary/20 text-primary rounded transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">info</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredHistory.length > ITEMS_PER_PAGE && (
            <div className="px-3 py-2 bg-surface-container-high border-t border-ui-divider flex justify-between items-center text-[10px]">
              <span className="text-on-surface-variant">
                Halaman {currentPage} dari {Math.ceil(filteredHistory.length / ITEMS_PER_PAGE)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-surface border border-ui-divider rounded-lg disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredHistory.length / ITEMS_PER_PAGE), p + 1))}
                  disabled={currentPage === Math.ceil(filteredHistory.length / ITEMS_PER_PAGE)}
                  className="px-3 py-1 bg-surface border border-ui-divider rounded-lg disabled:opacity-40"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <div 
          onClick={() => {
            if (playingVideo.url && playingVideo.type === 'local') {
              URL.revokeObjectURL(playingVideo.url);
            }
            setPlayingVideo(null);
          }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 backdrop-blur-md"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-xl max-w-lg w-full max-h-[94vh] p-2.5 overflow-y-auto border border-ui-divider flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-ui-divider">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">play_circle</span>
                <span className="font-bold text-xs text-on-surface">Video Bukti Packing</span>
                {playingVideo.resi && (
                  <span className="text-[11px] font-mono text-primary font-bold">({playingVideo.resi})</span>
                )}
              </div>
              <button 
                data-modal-close="true"
                title="Tutup"
                onClick={() => {
                  if (playingVideo.url && playingVideo.type === 'local') {
                    URL.revokeObjectURL(playingVideo.url);
                  }
                  setPlayingVideo(null);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm font-bold">close</span>
              </button>
            </div>
            
            <div className="relative aspect-video max-h-[55vh] bg-black rounded-lg overflow-hidden shadow flex items-center justify-center mx-auto w-full">
              {playingVideo.type === 'drive' ? (
                <iframe 
                  src={`https://drive.google.com/file/d/${playingVideo.driveFileId}/preview`} 
                  className="w-full h-full border-0 rounded-lg"
                  allow="autoplay; fullscreen"
                  title="Pemutar Video Cloud"
                />
              ) : (
                <video 
                  src={playingVideo.url} 
                  controls 
                  autoPlay 
                  playsInline
                  className="w-full h-full object-contain"
                  onError={() => {
                    if (playingVideo.driveFileId) {
                      setPlayingVideo({
                        type: 'drive',
                        driveFileId: playingVideo.driveFileId,
                        resi: playingVideo.resi
                      });
                    } else {
                      alert('Video tidak dapat diputar.');
                    }
                  }}
                />
              )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-ui-divider gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDownloadVideo(playingVideo.record || { id: playingVideo.driveFileId, resi: playingVideo.resi, driveFileId: playingVideo.driveFileId })}
                  disabled={Boolean(downloadingId)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                  title="Simpan ke Galeri HP"
                >
                  <span className="material-symbols-outlined text-xs">download</span>
                  {downloadingId ? 'Menyimpan...' : 'Simpan ke Galeri'}
                </button>
                {playingVideo.driveFileId && (
                  <button
                    onClick={() => {
                      const shareUrl = `https://nafindo.github.io/buktiin/#/?v=${playingVideo.driveFileId}`;
                      handleCopyLink(shareUrl);
                    }}
                    className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">share</span>
                    Salin Link
                  </button>
                )}
              </div>
              <button
                data-modal-close="true"
                title="Tutup"
                onClick={() => {
                  if (playingVideo.url && playingVideo.type === 'local') {
                    URL.revokeObjectURL(playingVideo.url);
                  }
                  setPlayingVideo(null);
                }}
                className="px-3 py-1 bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">close</span>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-md backdrop-blur-sm">
          <div className="bg-surface rounded-2xl max-w-md w-full p-lg border border-ui-divider shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-on-surface">Detail Rekaman</h3>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-on-surface-variant block">No. Resi</span>
                <span className="font-mono font-bold text-primary text-base">{selectedRecord.resi}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">Waktu Rekaman</span>
                <span className="font-medium">{new Date(selectedRecord.createdAt).toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">Ukuran Video</span>
                <span className="font-medium">{selectedRecord.videoSize ? `${(selectedRecord.videoSize / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">Status Penyimpanan</span>
                <span className="font-medium text-status-success">
                  {selectedRecord.driveFileId || selectedRecord.uploadStatus === 'SUCCESS' ? 'Tersimpan di Cloud Server' : (selectedRecord.uploadStatus === 'UPLOADING' ? 'Sedang Diunggah ke Cloud' : 'Tersimpan Lokal')}
                </span>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  const rec = selectedRecord;
                  setSelectedRecord(null);
                  handlePlayVideo(rec);
                }}
                className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl hover:opacity-90 flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">play_circle</span>
                <span>Putar Video</span>
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2.5 bg-surface-container text-on-surface rounded-xl font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
