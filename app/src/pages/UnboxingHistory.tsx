import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  const [playingVideo, setPlayingVideo] = useState<{ type: 'local' | 'drive', url: string, driveFileId?: string } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const handlePlayVideo = (record: any) => {
    if (record.videoPath) {
      const filename = record.videoPath.split(/[\/\\]/).pop();
      if (filename) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
        setPlayingVideo({ type: 'local', url: `${API_URL}/api/stream/${filename}`, driveFileId: record.driveFileId });
        return;
      }
    }
    
    if (record.driveFileId) {
      setPlayingVideo({ type: 'drive', url: `https://drive.google.com/uc?export=download&id=${record.driveFileId}` });
      return;
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
      alert('Video masih dalam proses unggah ke Google Drive.\nMohon tunggu beberapa saat agar link Share tersedia.');
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      try {
        const { data, error } = await supabase
          .from('recordings')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('scan_type', 'UNBOXING')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        
        if (data) {
          // Map snake_case from DB to camelCase for UI
          const mappedData = data.map(r => ({
            ...r,
            userId: r.user_id,
            videoPath: r.video_path,
            videoSize: r.video_size,
            uploadStatus: r.upload_status,
            driveFileId: r.drive_file_id,
            createdAt: r.created_at,
            updatedAt: r.updated_at
          }));
          setHistory(mappedData);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };
    
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(record => {
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

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) || 1;
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const handleExportCSV = () => {
     if (filteredHistory.length === 0) return alert('Tidak ada data untuk diexport');
     const header = ['Tanggal', 'Resi', 'Customer', 'Status'];
     const rows = filteredHistory.map(r => [
        new Date(r.createdAt).toLocaleString(),
        r.resi,
        r.customer || '-',
        r.status
     ]);
     const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map(e => e.join(",")).join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "history_export.csv");
     document.body.appendChild(link);
     link.click();
     link.remove();
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Body */}
      <section className="p-md lg:p-lg flex-1 w-full flex flex-col space-y-md">
        {/* Bento Search & Filter Panel */}
        <div className="flex flex-col md:flex-row items-end gap-md mb-lg">
          {/* Search Section */}
          <div className="w-full md:flex-1 flex flex-col justify-center">
            <label className="font-label-caps text-code-sm text-on-surface-variant mb-xs">Cari Resi atau Nama Customer</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-md py-sm bg-surface border border-ui-divider rounded-DEFAULT focus:border-2 focus:border-primary outline-none font-body-md transition-all" placeholder="Contoh: RESI-012345678" type="text"/>
            </div>
          </div>
          {/* Date Range Filter */}
          <div className="w-full md:w-auto flex flex-col justify-center">
            <label className="font-label-caps text-code-sm text-on-surface-variant mb-xs">Filter Rentang Tanggal</label>
            <div className="flex items-center gap-sm">
              <input value={startDate} onChange={e => setStartDate(e.target.value)} className="w-32 md:w-auto px-sm py-sm bg-surface border border-ui-divider rounded-DEFAULT focus:border-primary outline-none font-code-sm" type="date"/>
              <span className="text-on-surface-variant text-sm font-bold">to</span>
              <input value={endDate} onChange={e => setEndDate(e.target.value)} className="w-32 md:w-auto px-sm py-sm bg-surface border border-ui-divider rounded-DEFAULT focus:border-primary outline-none font-code-sm" type="date"/>
            </div>
          </div>
          {/* Export CTA */}
          <div className="w-full md:w-auto flex flex-col items-stretch justify-end">
            <button onClick={handleExportCSV} className="w-full md:w-32 py-sm bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-white rounded-DEFAULT font-label-caps text-label-caps flex items-center justify-center gap-2 transition-all active:scale-95 duration-150">
              <span className="material-symbols-outlined text-md">download</span>
              Export
            </button>
          </div>
        </div>

        {/* History Data Section */}
        <div className="bg-white border border-ui-divider rounded-xl flex flex-col flex-1 overflow-hidden w-full">
          {/* Table Container */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container text-left border-b border-ui-divider">
              <tr>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">Tanggal</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">Resi</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">Customer</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">Items</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">Status</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant text-center whitespace-nowrap">Video</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-divider">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-md text-on-surface-variant font-code-sm">Belum ada riwayat rekaman</td>
                </tr>
              ) : (
                paginatedHistory.map((record, index) => {
                  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
                  const shareUrl = record.driveFileId ? `https://nafindo.github.io/buktiin/#/?v=${record.driveFileId}` : `${API_URL}/api/stream/${record.videoPath?.split(/[\\/\\\\]/).pop()}`;
                  const downloadUrl = record.driveFileId ? `https://drive.google.com/uc?export=download&id=${record.driveFileId}` : `${shareUrl}?download=1`;
                  return (
                    <tr key={record.id || index} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-md py-md font-code-sm whitespace-nowrap">{new Date(record.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                      <td className="px-md py-md font-code-sm font-bold whitespace-nowrap">{record.resi}</td>
                      <td className="px-md py-md font-body-md whitespace-nowrap">{record.customer || '-'}</td>
                      <td className="px-md py-md font-body-md min-w-[200px]">
                        {(() => {
                          try {
                            const items = typeof record.items === 'string' ? JSON.parse(record.items) : record.items;
                            if (Array.isArray(items)) {
                              return items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
                            }
                            return typeof items === 'object' ? JSON.stringify(items) : String(items);
                          } catch {
                            return typeof record.items === 'object' ? JSON.stringify(record.items) : String(record.items);
                          }
                        })()}
                      </td>
                      <td className="px-md py-md whitespace-nowrap">
                        {record.status === 'DONE' && <span className="inline-block px-2 py-0.5 bg-status-success text-white font-label-caps text-[10px] rounded-xs uppercase">Selesai</span>}
                        {record.status === 'PROCESS' && <span className="inline-block px-2 py-0.5 bg-status-processing text-white font-label-caps text-[10px] rounded-xs uppercase">Proses</span>}
                        {record.status === 'FAILED' && <span className="inline-block px-2 py-0.5 bg-status-error text-white font-label-caps text-[10px] rounded-xs uppercase">Gagal</span>}
                      </td>
                      <td className="px-md py-md text-center">
                        {record.videoPath ? (
                          <button onClick={() => handlePlayVideo(record)} className="text-primary hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">play_circle</span>
                          </button>
                        ) : (
                          <button className="text-on-surface-variant opacity-20 cursor-not-allowed">
                            <span className="material-symbols-outlined">videocam_off</span>
                          </button>
                        )}
                      </td>
                      <td className="px-md py-md text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-xs">
                          {(record.videoPath || record.driveFileId) && (
                            <button onClick={() => {
                              try {
                                if ((window as any).require) {
                                  const { ipcRenderer } = (window as any).require('electron');
                                  const filename = record.driveFileId ? `record-${record.resi}.mp4` : record.videoPath?.split(/[\\/\\\\]/).pop();
                                  ipcRenderer.send('download-file', { url: downloadUrl, filename: filename });
                                } else {
                                  const a = document.createElement('a');
                                  a.href = downloadUrl;
                                  a.download = record.driveFileId ? `record-${record.resi}.mp4` : (record.videoPath?.split(/[\\/\\\\]/).pop() || 'video.mp4');
                                  a.target = '_blank';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }
                              } catch (e) {
                                window.open(downloadUrl, '_blank');
                              }
                            }} className="text-primary hover:bg-primary/10 w-8 h-8 rounded-full transition-colors flex items-center justify-center" title="Download">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                            </button>
                          )}
                          <button onClick={() => handleShare(record, 'copy')} className="text-secondary hover:bg-secondary/10 w-8 h-8 rounded-full transition-colors flex items-center justify-center" title="Salin Link">
                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                          </button>
                          <button onClick={() => handleShare(record, 'open')} className="text-secondary hover:bg-secondary/10 w-8 h-8 rounded-full transition-colors flex items-center justify-center" title="Buka Link">
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </button>
                          <button onClick={() => setSelectedRecord(record)} className="text-on-surface-variant hover:bg-surface-variant w-8 h-8 rounded-full transition-colors flex items-center justify-center" title="Details">
                            <span className="material-symbols-outlined text-[18px]">info</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          </div>
          
          {/* Pagination Utility */}
          <div className="px-lg py-md bg-white border-t border-ui-divider flex flex-col md:flex-row justify-between items-center gap-md">
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Showing {filteredHistory.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length} results
            </p>
            <div className="flex items-center gap-xs">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center border border-ui-divider bg-surface hover:bg-surface-container-high transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {/* Show up to 3 pages around current page */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Simple logic: show first, last, current, and +/- 1 from current
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
                
                // Show ellipsis if there's a gap
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

      {/* Simplified Footer */}
      <footer className="mt-auto border-t border-ui-divider py-md flex justify-between items-center text-on-surface-variant px-lg">
        <p className="font-code-sm text-[10px] text-on-surface-variant">© 2026 Nafindo Group. All Rights Reserved. | BUKTIIN v2.4</p>
      </footer>

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-lg backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-surface rounded-xl overflow-hidden shadow-xl border border-ui-divider flex flex-col">
            <div className="flex justify-between items-center p-md border-b border-ui-divider bg-surface-container-lowest">
              <h3 className="font-headline-md font-bold text-on-surface">Video Bukti Unboxing</h3>
              <button onClick={() => setPlayingVideo(null)} className="p-xs hover:bg-surface-variant rounded-full text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="relative aspect-video bg-black w-full">
                {playingVideo && (
                  <video 
                    src={playingVideo.url} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain" 
                    onError={() => {
                      if (playingVideo.type === 'local' && playingVideo.driveFileId) {
                        setPlayingVideo({ type: 'drive', url: `https://drive.google.com/uc?export=download&id=${playingVideo.driveFileId}` });
                      } else {
                        alert("Video tidak dapat diputar.");
                      }
                    }}
                  />
                )}
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
              <p className="font-code-sm text-on-surface-variant">Resi: <strong className="text-on-surface text-lg">{selectedRecord.resi}</strong></p>
              <p className="font-code-sm text-on-surface-variant">Customer: <strong className="text-on-surface">{selectedRecord.customer || '-'}</strong></p>
              <p className="font-code-sm text-on-surface-variant">Tanggal: <strong className="text-on-surface">{new Date(selectedRecord.createdAt).toLocaleString()}</strong></p>
              <p className="font-code-sm text-on-surface-variant">Ukuran Video: <strong className="text-on-surface">{selectedRecord.videoSize ? (selectedRecord.videoSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Tidak tersedia'}</strong></p>
              <p className="font-code-sm text-on-surface-variant">Status Cloud: <strong className="text-on-surface">{selectedRecord.uploadStatus === 'SUCCESS' ? 'Tersimpan di Cloud' : 'Menunggu Sinkronisasi'}</strong></p>
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
