import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalVideoBlob, getAllLocalRecordings, deleteLocalVideoBlob } from '../lib/videoStorage';
import { syncPendingUploads, uploadLocalRecordToDrive } from '../lib/driveUpload';
import { saveRecordingToGallery } from '../lib/gallerySaver';

const fallbackCopy = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    alert('Tautan Berhasil Disalin!\nAnda dapat mengirimkan link ini ke pelanggan AllShop Anda.');
  } catch (err) {
    alert('Gagal menyalin tautan. URL: ' + text);
  }
  document.body.removeChild(textArea);
};

const copyToClipboard = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Tautan Berhasil Disalin!\nAnda dapat mengirimkan link ini ke pelanggan AllShop Anda.');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
};

export default function UnboxingHistory() {
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
  const ITEMS_PER_PAGE = 20;

  const fetchHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // 1. Clean up dangling 'PROCESS' rows in Supabase
    try {
      await supabase
        .from('recordings')
        .delete()
        .eq('user_id', session.user.id)
        .eq('status', 'PROCESS');
    } catch (_) {}

    // 2. Fetch Local IndexedDB unboxing recordings
    const localRecords = await getAllLocalRecordings();
    const unboxingLocals = localRecords.filter(r => r.scan_type === 'UNBOXING');

    // 3. Fetch Remote Supabase Query
    let remoteRecords: any[] = [];
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('scan_type', 'UNBOXING')
        .neq('status', 'PROCESS')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        remoteRecords = data.map((r: any) => ({
          ...r,
          id: r.id,
          resi: r.resi,
          customer: r.customer || 'Pelanggan',
          marketplace: r.marketplace || 'OFFLINE',
          status: r.status || 'DONE',
          scan_type: 'UNBOXING',
          items: r.items || [],
          userId: r.user_id,
          videoPath: r.video_path,
          videoSize: Number(r.video_size) || 0,
          uploadStatus: r.upload_status || 'PENDING',
          driveFileId: r.drive_file_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          isLocal: false
        }));
      }
    } catch (error) {
      console.warn("Direct Supabase unboxing fetch error, using local data:", error);
    }

    // 4. Deduplicate and Purge Un-uploaded Duplicate Ghost Entries
    const cleanMap = new Map<string, any>();
    const allRecords = [...remoteRecords, ...unboxingLocals];

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
          // 'item' is uploaded, 'existing' is ghost -> delete!
          if (existing.isLocal) {
            deleteLocalVideoBlob(existing.id);
          } else {
            supabase.from('recordings').delete().eq('id', existing.id).then();
          }
          cleanMap.set(key, { ...existing, ...item, id: item.id || existing.id });
        } else if (!itemIsUploaded && existingIsUploaded) {
          // 'existing' is uploaded, 'item' is ghost -> delete!
          if (item.isLocal) {
            deleteLocalVideoBlob(item.id);
          } else {
            supabase.from('recordings').delete().eq('id', item.id).then();
          }
        } else {
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
    setSyncMessage('Sedang menyinkronkan video unboxing ke Cloud Server...');
    try {
      const uploadedCount = await syncPendingUploads();
      await fetchHistory();
      if (uploadedCount > 0) {
        setSyncMessage(`Berhasil menyinkronkan ${uploadedCount} video ke Cloud Server!`);
      } else {
        setSyncMessage('Semua rekaman unboxing telah tersimpan di Cloud Server.');
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
        alert(`Video unboxing resi ${record.resi} berhasil diunggah ke Cloud Server!`);
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
    // 1. Local IndexedDB
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

    // 2. Backend Stream
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
    
    // 3. Cloud Server Preview
    if (record.driveFileId) {
      setPlayingVideo({
        type: 'drive',
        driveFileId: record.driveFileId,
        resi: record.resi,
        record: record
      });
      return;
    }

    alert('Video tidak ditemukan di penyimpanan perangkat maupun Cloud Server.');
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

  const handleShare = (record: any, action: 'copy' | 'open') => {
    if (record.driveFileId) {
      const shareUrl = `https://nafindo.github.io/buktiin/#/?v=${record.driveFileId}`;
      if (action === 'copy') {
        copyToClipboard(shareUrl);
      } else {
        window.open(shareUrl, '_blank');
      }
    } else {
      alert('Video masih dalam proses sinkronisasi ke Cloud Server.\nMohon tunggu beberapa saat agar link Share tersedia.');
    }
  };

  const filteredHistory = history.filter(record => {
    let matchSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matchSearch = (record.resi && record.resi.toLowerCase().includes(q)) || 
                    (record.customer && record.customer.toLowerCase().includes(q));
    }

    let matchDate = true;
    if (startDate && endDate) {
      const recDate = new Date(record.createdAt);
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      matchDate = recDate >= s && recDate <= e;
    }

    return matchSearch && matchDate;
  });

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) || 1;
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  return (
    <div className="flex flex-col min-h-full">
      <section className="p-2 sm:p-3 flex-1 w-full flex flex-col space-y-2">
        {/* Top Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-end gap-2 mb-2">
          <div className="w-full sm:flex-1 flex flex-col justify-center">
            <label className="font-label-caps text-[10px] text-on-surface-variant mb-0.5">Cari Resi atau Nama Customer</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-ui-divider rounded-lg focus:border-primary outline-none text-xs" 
                placeholder="Contoh: RESI-012345678" 
                type="text" 
              />
            </div>
          </div>
          <div className="w-full sm:w-auto flex flex-col justify-center">
            <label className="font-label-caps text-[10px] text-on-surface-variant mb-0.5">Filter Rentang Tanggal</label>
            <div className="flex items-center gap-1.5">
              <input 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-28 sm:w-auto px-2 py-1.5 bg-surface border border-ui-divider rounded-lg focus:border-primary outline-none text-xs" 
                type="date" 
              />
              <span className="text-on-surface-variant text-xs">-</span>
              <input 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-28 sm:w-auto px-2 py-1.5 bg-surface border border-ui-divider rounded-lg focus:border-primary outline-none text-xs" 
                type="date" 
              />
            </div>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-1.5">
            <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className="py-1.5 px-2.5 bg-primary text-white hover:opacity-90 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
              title="Sinkronkan antrean video ke Cloud Server"
            >
              <span className={`material-symbols-outlined text-xs ${isSyncing ? 'animate-spin' : ''}`}>
                {isSyncing ? 'sync' : 'cloud_upload'}
              </span>
              <span>{isSyncing ? 'Sync...' : 'Sync Cloud'}</span>
            </button>
            <button 
              onClick={() => {
                if (filteredHistory.length === 0) return alert('Tidak ada data untuk diexport');
                const csvRows = [
                  ['Tanggal', 'Resi', 'Customer', 'Status'],
                  ...filteredHistory.map(r => [
                    new Date(r.createdAt).toLocaleString(),
                    r.resi,
                    r.customer || '-',
                    r.status
                  ])
                ];
                const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `unboxing_history_export_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
              }}
              className="w-full sm:w-auto py-1.5 px-2.5 bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              Export
            </button>
          </div>
        </div>

        {/* Sync Banner Notification */}
        {syncMessage && (
          <div className="p-2 px-3 bg-primary-container text-on-primary-container text-[11px] font-bold rounded-lg border border-primary/20 flex items-center justify-between animate-[fade-in_0.2s_ease-out]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">info</span>
              <span>{syncMessage}</span>
            </div>
            <button onClick={() => setSyncMessage(null)} className="opacity-70 hover:opacity-100">
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>
        )}

        {/* Unboxing History Table */}
        <div className="bg-white border border-ui-divider rounded-xl flex flex-col flex-1 overflow-hidden w-full shadow-sm">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-container text-left border-b border-ui-divider">
                <tr className="text-[10px] text-on-surface-variant uppercase font-semibold">
                  <th className="px-2.5 py-2 whitespace-nowrap">Tanggal</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">Resi</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">Customer</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">Status</th>
                  <th className="px-2.5 py-2 text-center whitespace-nowrap">Video</th>
                  <th className="px-2.5 py-2 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-divider">
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-on-surface-variant text-xs">
                      Belum ada riwayat rekaman unboxing
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((record, index) => {
                    const isCloudSynced = Boolean(record.driveFileId || record.uploadStatus === 'SUCCESS');

                    return (
                      <tr key={record.id || index} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-2.5 py-2 whitespace-nowrap text-[10px] text-on-surface-variant">
                          {new Date(record.createdAt).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                        </td>
                        <td className="px-2.5 py-2 font-mono font-bold whitespace-nowrap text-primary">
                          {record.resi}
                        </td>
                        <td className="px-2.5 py-2 whitespace-nowrap text-[11px] truncate max-w-[100px]">
                          {record.customer || '-'}
                        </td>
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          {record.status === 'DONE' && <span className="inline-block px-1.5 py-0.5 bg-status-success text-white text-[9px] rounded font-bold">Selesai</span>}
                          {record.status === 'PROCESS' && <span className="inline-block px-1.5 py-0.5 bg-status-processing text-white text-[9px] rounded font-bold">Proses</span>}
                          {record.status === 'FAILED' && <span className="inline-block px-1.5 py-0.5 bg-status-error text-white text-[9px] rounded font-bold">Gagal</span>}
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          <button 
                            onClick={() => handlePlayVideo(record)} 
                            className="text-primary hover:scale-110 transition-transform p-0.5 rounded-full hover:bg-primary/10"
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
                            {(record.videoPath || record.driveFileId) && (
                              <button 
                                onClick={() => handleDownloadVideo(record)} 
                                disabled={Boolean(downloadingId)}
                                className="w-6 h-6 flex items-center justify-center bg-surface-container hover:bg-primary/20 text-primary rounded transition-colors disabled:opacity-50" 
                                title="Simpan ke Galeri HP"
                              >
                                <span className="material-symbols-outlined text-sm">download</span>
                              </button>
                            )}
                            <button 
                              onClick={() => handleShare(record, 'copy')} 
                              className="w-6 h-6 flex items-center justify-center bg-surface-container hover:bg-primary/20 text-primary rounded transition-colors" 
                              title="Salin Link"
                            >
                              <span className="material-symbols-outlined text-sm">content_copy</span>
                            </button>
                            <button 
                              onClick={() => handleShare(record, 'open')} 
                              className="w-6 h-6 flex items-center justify-center bg-surface-container hover:bg-primary/20 text-primary rounded transition-colors" 
                              title="Buka Link"
                            >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </button>
                            <button 
                              onClick={() => setSelectedRecord(record)} 
                              className="w-6 h-6 flex items-center justify-center bg-surface-container hover:bg-primary/20 text-primary rounded transition-colors" 
                              title="Details"
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
          
          {/* Pagination Utility */}
          <div className="px-3 py-1.5 bg-white border-t border-ui-divider flex justify-between items-center text-[10px]">
            <p className="font-code-sm text-on-surface-variant">
              {filteredHistory.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} dari {filteredHistory.length} data
            </p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-6 h-6 flex items-center justify-center border border-ui-divider bg-surface hover:bg-surface-container-high transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded">
                <span className="material-symbols-outlined text-xs">chevron_left</span>
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center border transition-colors font-label-caps text-label-caps ${
                        currentPage === pageNum 
                          ? 'border-primary bg-primary text-white shadow-sm' 
                          : 'border-ui-divider bg-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="px-2 text-on-surface-variant">...</span>;
                }
                
                return null;
              })}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center border border-ui-divider bg-surface hover:bg-surface-container-high transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>

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
                <span className="font-bold text-xs text-on-surface">Video Bukti Unboxing</span>
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
                      alert("Video tidak dapat diputar.");
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
                      copyToClipboard(shareUrl);
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

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-lg backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-xl overflow-hidden shadow-xl border border-ui-divider flex flex-col p-lg gap-md">
            <h3 className="font-headline-md font-bold text-on-surface">Detail Order</h3>
            <div className="space-y-sm">
              <p className="font-code-sm text-on-surface-variant">Resi: <strong className="text-on-surface text-lg text-primary">{selectedRecord.resi}</strong></p>
              <p className="font-code-sm text-on-surface-variant">Customer: <strong className="text-on-surface">{selectedRecord.customer || '-'}</strong></p>
              <p className="font-code-sm text-on-surface-variant">Tanggal: <strong className="text-on-surface">{new Date(selectedRecord.createdAt).toLocaleString()}</strong></p>
              <p className="font-code-sm text-on-surface-variant">Ukuran Video: <strong className="text-on-surface">{selectedRecord.videoSize ? (selectedRecord.videoSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Tidak tersedia'}</strong></p>
              <p className="font-code-sm text-on-surface-variant">Status Cloud: <strong className="text-on-surface text-status-success">{selectedRecord.driveFileId || selectedRecord.uploadStatus === 'SUCCESS' ? 'Tersimpan di Cloud Server' : (selectedRecord.uploadStatus === 'UPLOADING' ? 'Sedang Diunggah ke Cloud' : 'Tersimpan Lokal')}</strong></p>
            </div>
            
            <div className="flex gap-sm mt-md">
              <button onClick={() => handleShare(selectedRecord, 'copy')} className="flex-1 py-sm bg-surface-container-highest text-on-surface font-bold rounded-DEFAULT hover:bg-surface-variant flex items-center justify-center gap-xs transition-colors">
                <span className="material-symbols-outlined text-sm">content_copy</span>
                Salin Link
              </button>
              <button onClick={() => handleShare(selectedRecord, 'open')} className="flex-1 py-sm bg-surface-container-highest text-on-surface font-bold rounded-DEFAULT hover:bg-surface-variant flex items-center justify-center gap-xs transition-colors">
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Buka Link
              </button>
              <button onClick={() => setSelectedRecord(null)} className="flex-1 py-sm bg-primary text-white font-bold rounded-DEFAULT hover:opacity-90 transition-opacity">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
