import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { syncPendingUploads } from '../lib/driveUpload';
import { getAllLocalRecordings, deleteLocalVideoBlob } from '../lib/videoStorage';

export default function Dashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    activeSub: any;
    pendingSub: any;
    daysRemaining: number | null;
    isExpired: boolean;
  }>({
    activeSub: null,
    pendingSub: null,
    daysRemaining: null,
    isExpired: false
  });
  const [stats, setStats] = useState<any>({
    total: 0,
    completed: 0,
    process: 0,
    failed: 0,
    pendingUploads: 0,
    videoCount: 0,
    orderTrends: { labels: [], data: [] },
    marketplaceDistribution: { labels: [], data: [] },
    storageMetrics: { totalVideosThisMonth: 0, totalSizeThisMonth: 0, avgSizeBytes: 0 }
  });

  const fetchStats = useCallback(async () => {
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

    // 2. Fetch Local IndexedDB Recordings
    let localList: any[] = [];
    try {
      localList = await getAllLocalRecordings();
    } catch (e) {
      console.warn('Local recordings fetch error:', e);
    }

    // 3. Fetch Remote Supabase Recordings
    let remoteRecords: any[] = [];
    try {
      const { data: recs, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', session.user.id)
        .neq('status', 'PROCESS');
      
      if (!error && recs) {
        remoteRecords = recs.map(h => ({
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
      console.warn('Supabase recordings fetch error:', err);
    }

    // 4. Deduplicate and Purge Un-uploaded Duplicate Ghost Entries
    const cleanMap = new Map<string, any>();
    const allRecords = [...remoteRecords, ...localList];

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
          if (existing.isLocal) {
            deleteLocalVideoBlob(existing.id);
          } else {
            supabase.from('recordings').delete().eq('id', existing.id).then();
          }
          cleanMap.set(key, { ...existing, ...item, id: item.id || existing.id });
        } else if (!itemIsUploaded && existingIsUploaded) {
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

    const list = Array.from(cleanMap.values());
    const total = list.length;
    const completed = list.filter(r => r.status === 'DONE').length;
    const process = list.filter(r => r.status === 'PROCESS').length;
    const failed = list.filter(r => r.status === 'FAILED').length;
    const pendingUploads = list.filter(r => !r.driveFileId && r.uploadStatus !== 'SUCCESS').length;

    const last7Days: string[] = [];
    const counts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      last7Days.push(dateStr);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const dayCount = list.filter(r => {
        const cd = new Date(r.createdAt || r.created_at);
        return cd >= dayStart && cd <= dayEnd;
      }).length;
      counts.push(dayCount);
    }

    // Marketplace distribution
    const mpMap: Record<string, number> = {};
    for (const item of list) {
      const mp = item.marketplace || 'OFFLINE';
      mpMap[mp] = (mpMap[mp] || 0) + 1;
    }
    const mpLabels = Object.keys(mpMap).length > 0 ? Object.keys(mpMap) : ['Direct / Offline'];
    const mpData = Object.keys(mpMap).length > 0 ? Object.values(mpMap) : [total || 1];

    const totalSizeBytes = list.reduce((sum, r) => sum + (Number(r.videoSize || r.video_size) || 0), 0);

    setStats({
      total,
      completed,
      process,
      failed,
      pendingUploads,
      videoCount: completed,
      orderTrends: { labels: last7Days, data: counts },
      marketplaceDistribution: { labels: mpLabels, data: mpData },
      storageMetrics: { totalVideosThisMonth: completed, totalSizeThisMonth: totalSizeBytes, avgSizeBytes: total ? Math.round(totalSizeBytes / total) : 0 }
    });

    // 5. Fetch Subscriptions & Calculate Expiration / Renewal
    try {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (subs && subs.length > 0) {
        const active = subs.find(s => s.status === 'ACTIVE');
        const pending = subs.find(s => s.status === 'PENDING_APPROVAL');
        
        let daysRem: number | null = null;
        let isExp = false;
        if (active && active.end_date) {
          const endMs = new Date(active.end_date).getTime();
          const nowMs = Date.now();
          daysRem = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
          if (daysRem <= 0) {
            isExp = true;
          }
        }

        setSubscriptionInfo({
          activeSub: active || null,
          pendingSub: pending || null,
          daysRemaining: daysRem,
          isExpired: isExp
        });
      }
    } catch (subErr) {
      console.warn('Subscription fetch error in Dashboard:', subErr);
    }
  }, []);

  const triggerAutoRetryUploads = useCallback(async () => {
    try {
      await syncPendingUploads();
    } catch (err) {
      console.warn('Pending sync error:', err);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (API_URL) {
        await fetch(`${API_URL}/api/recordings/retry-pending`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            accessToken: session.access_token
          })
        });
      }
    } catch (e) {
      // Backend not available in APK mode
    }
  }, []);

  useEffect(() => {
    fetchStats();
    triggerAutoRetryUploads();

    const onFocus = () => {
      fetchStats();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    const interval = setInterval(fetchStats, 5000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(interval);
    };
  }, [fetchStats, triggerAutoRetryUploads]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage('Sedang menyinkronkan rekaman ke Cloud Server...');
    try {
      const uploaded = await syncPendingUploads();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Refresh stats
        const { data: recs } = await supabase
          .from('recordings')
          .select('*')
          .eq('user_id', session.user.id);
        if (recs) {
          const total = recs.length;
          const completed = recs.filter(r => r.status === 'DONE').length;
          const process = recs.filter(r => r.status === 'PROCESS').length;
          const failed = recs.filter(r => r.status === 'FAILED').length;
          const pendingUploads = recs.filter(r => (r.upload_status === 'PENDING' || r.upload_status === 'UPLOADING' || r.upload_status === 'FAILED') && !r.drive_file_id).length;
          const videoCount = recs.filter(r => r.video_path || r.drive_file_id).length;
          setStats((prev: any) => ({
            ...prev,
            total,
            completed,
            process,
            failed,
            pendingUploads,
            videoCount
          }));
        }
      }
      if (uploaded > 0) {
        setSyncMessage(`Berhasil menyinkronkan ${uploaded} video ke Cloud Server!`);
      } else {
        setSyncMessage('Semua video rekaman telah tersimpan di Cloud Server.');
      }
    } catch (_) {
      setSyncMessage('Sinkronisasi selesai.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const lineChartData = {
    labels: stats.orderTrends?.labels || ['-'],
    datasets: [
      {
        label: 'Daily Orders',
        data: stats.orderTrends?.data || [0],
        borderColor: '#006e2a',
        backgroundColor: 'rgba(0, 110, 42, 0.05)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#006e2a',
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#E0E0E0' },
        ticks: { font: { family: 'JetBrains Mono', size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'JetBrains Mono', size: 10 } },
      },
    },
  };

  // Dynamic colors for marketplace distribution
  const mpColors = stats.marketplaceDistribution?.labels.map((lbl: string) => {
    if (lbl === 'SHOPEE') return '#ee4d2d';
    if (lbl === 'TOKOPEDIA') return '#00aa5b';
    if (lbl === 'TIKTOK') return '#000000';
    return '#005ac1'; // default color
  }) || [];

  const pieChartData = {
    labels: stats.marketplaceDistribution?.labels || ['No Data'],
    datasets: [
      {
        data: stats.marketplaceDistribution?.data?.length ? stats.marketplaceDistribution.data : [100],
        backgroundColor: mpColors.length ? mpColors : ['#e0e0e0'],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="max-w-[1440px] mx-auto p-2 sm:p-4 space-y-2 sm:space-y-4 flex flex-col min-h-full">
      {/* Top Header & Sync Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white border border-ui-divider rounded-xl p-2.5 sm:p-3 px-3 sm:px-4 shadow-sm">
        <div>
          <h1 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">Dashboard Buktiin</h1>
          <p className="font-body-md text-[11px] sm:text-xs text-on-surface-variant">Ringkasan aktivitas packing & sinkronisasi video ke Cloud Server</p>
        </div>
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-1 bg-primary text-white hover:opacity-90 px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all shadow-sm disabled:opacity-50"
          title="Sinkronkan rekaman yang belum terunggah ke Cloud Server"
        >
          <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>
            {isSyncing ? 'sync' : 'cloud_upload'}
          </span>
          <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Cloud'}</span>
        </button>
      </div>

      {/* Sync Banner Notification */}
      {syncMessage && (
        <div className="p-2 px-3 bg-primary-container text-on-primary-container text-[11px] sm:text-xs font-bold rounded-lg border border-primary/20 flex items-center justify-between animate-[fade-in_0.2s_ease-out]">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {/* Subscription Pending Approval Banner */}
      {subscriptionInfo.pendingSub && (
        <div className="p-2.5 sm:p-3 px-3 sm:px-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm animate-[fade-in_0.2s_ease-out]">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs">
            <span className="material-symbols-outlined text-base animate-spin text-amber-600">sync</span>
            <span>
              <strong>Pembayaran Sedang Diverifikasi:</strong> Pengajuan aktivasi paket <strong className="text-primary">{subscriptionInfo.pendingSub.plans?.name || 'Paket'}</strong> Anda sedang menunggu persetujuan (approval) admin.
            </span>
          </div>
          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full self-start sm:self-auto">
            PROSES VERIFIKASI
          </span>
        </div>
      )}

      {/* Subscription Expired Banner */}
      {subscriptionInfo.isExpired && subscriptionInfo.activeSub && (
        <div className="p-2.5 sm:p-3 px-3 sm:px-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm animate-[fade-in_0.2s_ease-out]">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 text-xs">
            <span className="material-symbols-outlined text-base text-red-600">error</span>
            <span>
              {subscriptionInfo.activeSub.plans?.name === 'FREE' ? (
                <>
                  <strong>Masa Uji Coba Gratis Berakhir (OFF):</strong> Masa aktif 7 hari Free Plan Anda telah habis. Upgrade ke paket berbayar untuk mengaktifkan kembali scanner & rekaman gudang.
                </>
              ) : (
                <>
                  <strong>Masa Langganan Telah Habis (OFF):</strong> Paket <strong>{subscriptionInfo.activeSub.plans?.name}</strong> Anda telah berakhir. Segera perpanjang paket untuk melanjutkan akses fitur & kuota rekaman.
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {subscriptionInfo.activeSub.plans?.name === 'FREE' ? (
              <Link
                to="/plans?mode=upgrade"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shadow-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">upgrade</span>
                Upgrade Paket
              </Link>
            ) : (
              <>
                <Link
                  to={`/payment?planId=${subscriptionInfo.activeSub.plan_id}&mode=renew`}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">autorenew</span>
                  Perpanjang Paket
                </Link>
                <Link
                  to="/plans?mode=upgrade"
                  className="bg-surface border border-red-500/50 hover:bg-red-500/10 text-red-700 dark:text-red-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">upgrade</span>
                  Upgrade Plan
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Subscription Renewal Warning Banner (<= 7 Days) */}
      {!subscriptionInfo.isExpired && subscriptionInfo.daysRemaining !== null && subscriptionInfo.daysRemaining <= 7 && subscriptionInfo.activeSub && (
        <div className="p-2.5 sm:p-3 px-3 sm:px-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm animate-[fade-in_0.2s_ease-out]">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs">
            <span className="material-symbols-outlined text-base text-amber-600">warning</span>
            <span>
              {subscriptionInfo.activeSub.plans?.name === 'FREE' ? (
                <>
                  <strong>Masa Uji Coba Gratis:</strong> Paket Free 7 Hari Anda tersisa <strong className="text-primary">{subscriptionInfo.daysRemaining} hari lagi</strong> ({new Date(subscriptionInfo.activeSub.end_date).toLocaleDateString('id-ID')}). Upgrade sekarang untuk menikmati fitur penuh.
                </>
              ) : (
                <>
                  <strong>Masa Langganan Segera Berakhir:</strong> Paket <strong>{subscriptionInfo.activeSub.plans?.name}</strong> Anda akan berakhir dalam <strong className="text-primary">{subscriptionInfo.daysRemaining} hari lagi</strong> ({new Date(subscriptionInfo.activeSub.end_date).toLocaleDateString('id-ID')}). Segera lakukan perpanjangan.
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {subscriptionInfo.activeSub.plans?.name === 'FREE' ? (
              <Link
                to="/plans?mode=upgrade"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shadow-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">upgrade</span>
                Upgrade Paket
              </Link>
            ) : (
              <>
                <Link
                  to={`/payment?planId=${subscriptionInfo.activeSub.plan_id}&mode=renew`}
                  className="bg-status-success hover:bg-status-success/90 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">autorenew</span>
                  Perpanjang Sekarang
                </Link>
                <Link
                  to="/plans?mode=upgrade"
                  className="bg-surface border border-primary/40 hover:bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">upgrade</span>
                  Upgrade Plan
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Daily Statistics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Total Orders */}
        <div className="bg-white border border-ui-divider hover:border-primary transition-all p-2.5 sm:p-3 flex flex-col justify-between rounded-xl">
          <div className="flex justify-between items-start mb-1">
            <span className="font-label-caps text-[10px] sm:text-xs text-on-surface-variant uppercase">Total Orders</span>
            <div className="bg-surface-container p-1 rounded">
              <span className="material-symbols-outlined text-primary text-base sm:text-lg">package</span>
            </div>
          </div>
          <div>
            <p className="font-display-lg text-2xl sm:text-3xl font-bold">{stats.total}</p>
            <p className="font-code-sm text-[10px] sm:text-xs text-primary">Pesanan masuk</p>
          </div>
        </div>

        {/* Selesai */}
        <div className="bg-white border border-ui-divider hover:border-primary transition-all p-2.5 sm:p-3 flex flex-col justify-between border-b-3 border-b-status-success rounded-xl">
          <div className="flex justify-between items-start mb-1">
            <span className="font-label-caps text-[10px] sm:text-xs text-on-surface-variant uppercase">Selesai</span>
            <div className="bg-surface-container p-1 rounded">
              <span className="material-symbols-outlined text-status-success text-base sm:text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <div>
            <p className="font-display-lg text-2xl sm:text-3xl font-bold">{stats.completed}</p>
            <p className="font-code-sm text-[10px] sm:text-xs text-status-success">Di-packing</p>
          </div>
        </div>

        {/* Proses */}
        <div className="bg-white border border-ui-divider hover:border-primary transition-all p-2.5 sm:p-3 flex flex-col justify-between border-b-3 border-b-status-processing rounded-xl">
          <div className="flex justify-between items-start mb-1">
            <span className="font-label-caps text-[10px] sm:text-xs text-on-surface-variant uppercase">Pending</span>
            <div className="bg-surface-container p-1 rounded">
              <span className="material-symbols-outlined text-status-processing text-base sm:text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
            </div>
          </div>
          <div>
            <p className="font-display-lg text-2xl sm:text-3xl font-bold">{stats.pendingUploads}</p>
            <p className="font-code-sm text-[10px] sm:text-xs text-on-surface-variant">Menunggu upload</p>
          </div>
        </div>

        {/* Video Uploads */}
        <div className="bg-white border border-ui-divider hover:border-primary transition-all p-2.5 sm:p-3 flex flex-col justify-between rounded-xl">
          <div className="flex justify-between items-start mb-1">
            <span className="font-label-caps text-[10px] sm:text-xs text-on-surface-variant uppercase">Video Proof</span>
            <div className="bg-surface-container p-1 rounded">
              <span className="material-symbols-outlined text-primary text-base sm:text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            </div>
          </div>
          <div>
            <p className="font-display-lg text-2xl sm:text-3xl font-bold">{stats.videoCount}</p>
            <p className="font-code-sm text-[10px] sm:text-xs text-primary">Terekam</p>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3">
        {/* Main Line Chart */}
        <div className="bg-white border border-ui-divider p-2.5 sm:p-4 lg:col-span-8 h-[220px] sm:h-[300px] flex flex-col rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="font-headline-md text-xs sm:text-sm font-bold">Tren Pesanan</h3>
              <p className="font-body-md text-[10px] text-on-surface-variant">Volume harian bulan ini</p>
            </div>
            <div className="flex gap-1">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">Harian</span>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <Line data={lineChartData} options={lineChartOptions as any} />
          </div>
        </div>

        {/* Marketplace Pie Chart */}
        <div className="bg-white border border-ui-divider p-2.5 sm:p-4 lg:col-span-4 h-[220px] sm:h-[300px] flex flex-col rounded-xl">
          <h3 className="font-headline-md text-xs sm:text-sm font-bold mb-1">Distribusi Channel</h3>
          <div className="flex-1 relative flex items-center justify-center">
            <Doughnut data={pieChartData} options={pieChartOptions as any} />
          </div>
          <div className="grid grid-cols-3 gap-1 mt-1">
            {stats.marketplaceDistribution?.labels.map((lbl: string, i: number) => {
              const total = stats.marketplaceDistribution.data.reduce((a: number, b: number) => a + b, 0);
              const val = stats.marketplaceDistribution.data[i];
              const pct = total ? Math.round((val / total) * 100) : 0;
              return (
                <div key={lbl} className="text-center">
                  <p className="font-label-caps text-[9px] text-on-surface-variant truncate">{lbl}</p>
                  <p className="font-bold text-xs text-primary">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Storage & Security Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 flex-1">
        {/* Storage Stats */}
        <div className="bg-white border border-ui-divider p-2.5 sm:p-4 lg:col-span-5 relative overflow-hidden rounded-xl">
          <div className="relative z-10">
            <h3 className="font-headline-md text-xs sm:text-sm font-bold mb-1">Penyimpanan & Efisiensi</h3>
            <p className="font-label-caps text-[9px] text-on-surface-variant mb-2">30 HARI TERAKHIR</p>
            <div className="space-y-2">
              <div>
                <p className="font-body-md text-[11px] text-on-surface-variant">Total Video Terupload</p>
                <p className="font-display-lg text-xl sm:text-2xl font-bold text-primary">{stats.storageMetrics?.totalVideosThisMonth || 0} Video</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-surface-container-low rounded border-l-3 border-status-success">
                  <p className="font-code-sm text-[10px] text-on-surface-variant">Ukuran Total</p>
                  <p className="font-bold text-xs">{((stats.storageMetrics?.totalSizeThisMonth || 0) / (1024*1024)).toFixed(2)} MB</p>
                </div>
                <div className="p-2 bg-surface-container-low rounded border-l-3 border-primary">
                  <p className="font-code-sm text-[10px] text-on-surface-variant">Rata-rata/Vid</p>
                  <p className="font-bold text-xs">{((stats.storageMetrics?.avgSizeBytes || 0) / (1024*1024)).toFixed(2)} MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Compliance */}
        <div className="bg-white border border-ui-divider p-2.5 sm:p-4 lg:col-span-7 flex flex-col rounded-xl">
          <h3 className="font-headline-md text-xs sm:text-sm font-bold mb-1.5">Keamanan Cloud Enterprise</h3>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 p-1.5 bg-surface-variant/20 rounded">
              <span className="material-symbols-outlined text-primary text-base">lock</span>
              <div>
                <p className="font-bold text-xs text-on-surface">AES-256 Cloud Encryption</p>
                <p className="text-[10px] text-on-surface-variant">Video dan data dienkripsi standar keamanan tinggi.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-1.5 bg-surface-variant/20 rounded">
              <span className="material-symbols-outlined text-status-success text-base">verified_user</span>
              <div>
                <p className="font-bold text-xs text-on-surface">OAuth 2.0 Direct Sync</p>
                <p className="text-[10px] text-on-surface-variant">Terhubung langsung ke Secure Cloud Server.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Footer */}
      <footer className="mt-2 border-t border-ui-divider py-1.5 flex flex-row justify-between items-center text-[10px] text-on-surface-variant">
        <p>© 2026 Nafindo Group.</p>
        <span className="font-code-sm">v4.0.0</span>
      </footer>
    </div>
  );
}
