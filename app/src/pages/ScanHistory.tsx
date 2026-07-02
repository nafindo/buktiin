import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ScanHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handlePlayVideo = (videoPath: string) => {
    const filename = videoPath.split(/[\/\\]/).pop();
    if (filename) {
      setPlayingVideo(`http://localhost:3001/uploads/temp/${filename}`);
    }
  };

  const handleShare = (record: any) => {
    if (record.driveFileId) {
      // Changed to the custom branded link format
      const shareUrl = `https://nafindo.github.io/buktiin/#/?v=${record.driveFileId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Tautan Berhasil Disalin!\nAnda dapat mengirimkan link ini ke pelanggan AllShop Anda.');
      }).catch(() => {
        alert('Gagal menyalin tautan. URL: ' + shareUrl);
      });
    } else {
      alert('Video masih dalam proses sinkronisasi ke Enterprise Cloud Storage.\nMohon tunggu beberapa saat agar link Share tersedia.');
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      try {
        const response = await fetch(`http://localhost:3001/api/history?userId=${session.user.id}`);
        const result = await response.json();
        if (result.success) {
          setHistory(result.data);
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
      <section className="p-lg flex-1">
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

        {/* Table Section */}
        <div className="bg-surface-container-lowest border border-ui-divider overflow-x-auto">
          <table className="w-full border-collapse">
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
                paginatedHistory.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-md py-md font-code-sm whitespace-nowrap">{new Date(record.createdAt).toLocaleString()}</td>
                    <td className="px-md py-md font-code-sm font-bold whitespace-nowrap">{record.resi}</td>
                    <td className="px-md py-md font-body-md whitespace-nowrap">{record.customer || '-'}</td>
                    <td className="px-md py-md font-body-md min-w-[200px]">
                      {(() => {
                        try {
                          const items = JSON.parse(record.items);
                          return items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
                        } catch {
                          return record.items;
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
                        <button onClick={() => handlePlayVideo(record.videoPath)} className="text-primary hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined">play_circle</span>
                        </button>
                      ) : (
                        <button className="text-on-surface-variant opacity-20 cursor-not-allowed">
                          <span className="material-symbols-outlined">videocam_off</span>
                        </button>
                      )}
                    </td>
                    <td className="px-md py-md text-right whitespace-nowrap">
                      <button onClick={() => setSelectedRecord(record)} className="text-on-surface-variant font-code-sm opacity-50 hover:opacity-100">[ Details ]</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination Utility */}
          <div className="px-lg py-md bg-surface-container border-t border-ui-divider flex flex-col md:flex-row justify-between items-center gap-md">
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

      {/* Footer */}
      <footer className="mt-auto w-full px-lg py-md border-t border-ui-divider bg-surface flex flex-col md:flex-row justify-between items-center">
        <p className="font-code-sm text-code-sm text-on-surface-variant">© 2026 Nafindo Group. All Rights Reserved.</p>
        <div className="flex items-center gap-lg mt-md md:mt-0">
          <a className="font-label-caps text-code-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Documentation</a>
          <a className="font-label-caps text-code-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
          <span className="font-label-caps text-code-sm text-on-surface-variant border-l border-ui-divider pl-lg">Developed by Nafindo Group</span>
        </div>
      </footer>

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-lg backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-surface rounded-xl overflow-hidden shadow-xl border border-ui-divider flex flex-col">
            <div className="flex justify-between items-center p-md border-b border-ui-divider bg-surface-container-lowest">
              <h3 className="font-headline-md font-bold text-on-surface">Video Bukti Packing</h3>
              <button onClick={() => setPlayingVideo(null)} className="p-xs hover:bg-surface-variant rounded-full text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="relative aspect-video bg-black w-full">
              <video src={playingVideo} controls autoPlay className="w-full h-full object-contain" />
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
              <p className="font-code-sm text-on-surface-variant">Status Cloud: <strong className="text-on-surface">{selectedRecord.uploadStatus === 'SUCCESS' ? 'Tersimpan di Cloud' : 'Menunggu Sinkronisasi'}</strong></p>
            </div>
            
            <div className="flex gap-sm mt-md">
              <button onClick={() => handleShare(selectedRecord)} className="flex-1 py-sm bg-surface-container-highest text-on-surface font-bold rounded-DEFAULT hover:bg-surface-variant flex items-center justify-center gap-xs transition-colors">
                <span className="material-symbols-outlined text-sm">share</span>
                Share Link
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
