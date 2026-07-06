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
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
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

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      try {
        const response = await fetch(`http://localhost:3001/api/dashboard?userId=${session.user.id}&accessToken=${session.access_token}`);
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };
    
    fetchStats();
  }, []);
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
    <div className="max-w-[1440px] mx-auto p-lg space-y-lg flex flex-col min-h-full">
      {/* Daily Statistics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Total Orders */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg flex flex-col justify-between rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Orders</span>
            <div className="bg-surface-container p-sm rounded">
              <span className="material-symbols-outlined text-primary">package</span>
            </div>
          </div>
          <div>
            <p className="font-display-lg text-4xl font-bold">{stats.total}</p>
            <p className="font-code-sm text-code-sm text-primary mt-xs">Total pesanan masuk</p>
          </div>
        </div>

        {/* Selesai */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg flex flex-col justify-between border-b-4 border-b-status-success rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Selesai</span>
            <div className="bg-surface-container p-sm rounded">
              <span className="material-symbols-outlined text-status-success" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <div>
            <p className="font-display-lg text-4xl font-bold">{stats.completed}</p>
            <p className="font-code-sm text-code-sm text-status-success mt-xs">Selesai di-packing</p>
          </div>
        </div>

        {/* Proses */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg flex flex-col justify-between border-b-4 border-b-status-processing rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Proses / Pending</span>
            <div className="bg-surface-container p-sm rounded">
              <span className="material-symbols-outlined text-status-processing" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
            </div>
          </div>
          <div>
            <p className="font-display-lg text-4xl font-bold">{stats.pendingUploads}</p>
            <p className="font-code-sm text-code-sm text-on-surface-variant mt-xs">Menunggu video diupload</p>
          </div>
        </div>

        {/* Video Uploads */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg flex flex-col justify-between rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Video Proof</span>
            <div className="bg-surface-container p-sm rounded">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            </div>
          </div>
          <div>
            <p className="font-display-lg text-4xl font-bold">{stats.videoCount}</p>
            <p className="font-code-sm text-code-sm text-primary mt-xs">Video berhasil direkam</p>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Main Line Chart */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg lg:col-span-8 h-[400px] flex flex-col rounded-xl">
          <div className="flex justify-between items-center mb-lg">
            <div>
              <h3 className="font-headline-md text-headline-md font-bold">Order Trends</h3>
              <p className="font-body-md text-on-surface-variant">Daily volume for the current month</p>
            </div>
            <div className="flex gap-sm">
              <button className="px-md py-xs border border-primary text-primary font-label-caps text-label-caps rounded-DEFAULT">Daily</button>
              <button className="px-md py-xs border border-ui-divider text-on-surface-variant font-label-caps text-label-caps rounded-DEFAULT hover:bg-surface-variant">Weekly</button>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <Line data={lineChartData} options={lineChartOptions as any} />
          </div>
        </div>

        {/* Marketplace Pie Chart */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg lg:col-span-4 h-[400px] flex flex-col rounded-xl">
          <h3 className="font-headline-md text-headline-md font-bold mb-md">Marketplace Distribution</h3>
          <div className="flex-1 relative flex items-center justify-center">
            <Doughnut data={pieChartData} options={pieChartOptions as any} />
          </div>
          <div className="grid grid-cols-3 gap-xs mt-md">
            {stats.marketplaceDistribution?.labels.map((lbl: string, i: number) => {
              const total = stats.marketplaceDistribution.data.reduce((a: number, b: number) => a + b, 0);
              const val = stats.marketplaceDistribution.data[i];
              const pct = total ? Math.round((val / total) * 100) : 0;
              return (
                <div key={lbl} className="text-center">
                  <p className="font-label-caps text-[10px] text-on-surface-variant truncate">{lbl}</p>
                  <p className="font-bold text-primary">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Storage & Security Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-lg flex-1">
        {/* Storage Stats */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg lg:col-span-5 relative overflow-hidden rounded-xl">
          <div className="relative z-10">
            <h3 className="font-headline-md text-headline-md font-bold mb-md">Storage & Efficiency</h3>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-xl">LAST 30 DAYS</p>
            <div className="space-y-lg">
              <div>
                <p className="font-body-md text-on-surface-variant">Total Videos Uploaded</p>
                <p className="font-display-lg text-3xl font-bold text-primary">{stats.storageMetrics?.totalVideosThisMonth || 0} Videos</p>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="p-md bg-surface-container-low rounded-DEFAULT border-l-4 border-status-success">
                  <p className="font-code-sm text-code-sm text-on-surface-variant">Total Size</p>
                  <p className="font-bold">{((stats.storageMetrics?.totalSizeThisMonth || 0) / (1024*1024)).toFixed(2)} MB</p>
                </div>
                <div className="p-md bg-surface-container-low rounded-DEFAULT border-l-4 border-primary">
                  <p className="font-code-sm text-code-sm text-on-surface-variant">Avg Size/Vid</p>
                  <p className="font-bold">{((stats.storageMetrics?.avgSizeBytes || 0) / (1024*1024)).toFixed(2)} MB</p>
                </div>
              </div>
            </div>
          </div>
          {/* Atmospheric Grid Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#006e2a 0.5px, transparent 0.5px)", backgroundSize: "16px 16px" }}></div>
        </div>

        {/* Security & Compliance */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg lg:col-span-7 flex flex-col rounded-xl">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-headline-md text-headline-md font-bold">Security & Compliance</h3>
          </div>
          <p className="text-body-md text-on-surface-variant mb-md">
            Sistem BUKTIIN dilengkapi dengan infrastruktur standar enterprise untuk memastikan keamanan data dan video bukti toko Anda 100% terjaga.
          </p>
          <div className="space-y-md flex-1">
            <div className="flex items-center gap-md p-md bg-surface-variant/30 rounded-lg">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 border border-ui-divider shadow-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">lock</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">AES-256 Cloud Encryption</p>
                <p className="text-sm text-on-surface-variant">Semua video dan data transaksi dienkripsi menggunakan standar militer.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-md p-md bg-surface-variant/30 rounded-lg">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 border border-ui-divider shadow-sm">
                <span className="material-symbols-outlined text-status-success text-[24px]">verified_user</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">OAuth 2.0 Secure Authorization</p>
                <p className="text-sm text-on-surface-variant">Sistem terhubung langsung ke jaringan Secure Cloud Server Enterprise (No-Knowledge Protocol).</p>
              </div>
            </div>
            
            <div className="flex items-center gap-md p-md bg-surface-variant/30 rounded-lg">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 border border-ui-divider shadow-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">dns</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">Tier 3 Data Center (99.9% Uptime)</p>
                <p className="text-sm text-on-surface-variant">Infrastruktur server andal memastikan API tidak pernah <i>down</i> saat sedang merekam.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-xl border-t border-ui-divider py-md flex flex-col md:flex-row justify-between items-center text-on-surface-variant">
        <p className="font-code-sm text-code-sm">© 2026 Nafindo Group. All Rights Reserved.</p>
        <div className="flex gap-lg items-center mt-md md:mt-0">
          <span className="font-label-caps text-label-caps">Developed by Nafindo Group</span>
          <span className="font-code-sm text-code-sm bg-surface-container px-sm py-1 rounded">BUILD_ID: B-9982</span>
        </div>
      </footer>
    </div>
  );
}
