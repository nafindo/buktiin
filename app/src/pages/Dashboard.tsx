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

export default function Dashboard() {
  const lineChartData = {
    labels: ['01 May', '05 May', '10 May', '15 May', '20 May', '25 May', '30 May'],
    datasets: [
      {
        label: 'Daily Orders',
        data: [150, 185, 160, 240, 280, 210, 320],
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

  const pieChartData = {
    labels: ['Shopee', 'Tokopedia', 'TikTok'],
    datasets: [
      {
        data: [60, 25, 15],
        backgroundColor: ['#006e2a', '#a04100', '#005ac1'],
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
            <p className="font-display-lg text-4xl font-bold">320</p>
            <p className="font-code-sm text-code-sm text-primary mt-xs">+12.5% from yesterday</p>
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
            <p className="font-display-lg text-4xl font-bold">280</p>
            <p className="font-code-sm text-code-sm text-status-success mt-xs">87.5% Success Rate</p>
          </div>
        </div>

        {/* Proses */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg flex flex-col justify-between border-b-4 border-b-status-processing rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Proses</span>
            <div className="bg-surface-container p-sm rounded">
              <span className="material-symbols-outlined text-status-processing" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
            </div>
          </div>
          <div>
            <p className="font-display-lg text-4xl font-bold">3</p>
            <p className="font-code-sm text-code-sm text-on-surface-variant mt-xs">Awaiting packing</p>
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
            <p className="font-display-lg text-4xl font-bold">278</p>
            <p className="font-code-sm text-code-sm text-primary mt-xs">99.2% Capture rate</p>
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
            <div className="text-center">
              <p className="font-label-caps text-[10px] text-on-surface-variant">SHOPEE</p>
              <p className="font-bold text-primary">60%</p>
            </div>
            <div className="text-center">
              <p className="font-label-caps text-[10px] text-on-surface-variant">TOKOPEDIA</p>
              <p className="font-bold text-secondary">25%</p>
            </div>
            <div className="text-center">
              <p className="font-label-caps text-[10px] text-on-surface-variant">TIKTOK</p>
              <p className="font-bold text-tertiary">15%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue & Activity Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-lg flex-1">
        {/* Revenue Stats */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg lg:col-span-5 relative overflow-hidden rounded-xl">
          <div className="relative z-10">
            <h3 className="font-headline-md text-headline-md font-bold mb-md">Revenue Statistics</h3>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-xl">LAST 30 DAYS</p>
            <div className="space-y-lg">
              <div>
                <p className="font-body-md text-on-surface-variant">Total Managed Value</p>
                <p className="font-display-lg text-3xl font-bold text-primary">Rp 124.500.000</p>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="p-md bg-surface-container-low rounded-DEFAULT border-l-4 border-status-success">
                  <p className="font-code-sm text-code-sm text-on-surface-variant">Net Profit</p>
                  <p className="font-bold">Rp 18.2M</p>
                </div>
                <div className="p-md bg-surface-container-low rounded-DEFAULT border-l-4 border-primary">
                  <p className="font-code-sm text-code-sm text-on-surface-variant">Tax Ded.</p>
                  <p className="font-bold">Rp 1.4M</p>
                </div>
              </div>
            </div>
          </div>
          {/* Atmospheric Grid Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#006e2a 0.5px, transparent 0.5px)", backgroundSize: "16px 16px" }}></div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-ui-divider hover:border-primary hover:bg-surface-container-low transition-all duration-200 p-lg lg:col-span-7 flex flex-col rounded-xl">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-headline-md text-headline-md font-bold">Recent Activity</h3>
            <button className="font-label-caps text-label-caps text-primary hover:underline">[ VIEW ALL ]</button>
          </div>
          <div className="space-y-md flex-1">
            {/* Activity Item 1 */}
            <div className="flex items-center gap-md p-md hover:bg-surface-variant transition-colors rounded-DEFAULT border border-transparent hover:border-ui-divider">
              <div className="w-10 h-10 bg-status-success/10 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-status-success">videocam</span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-on-surface font-semibold">Video proof uploaded for #ORD-8921</p>
                <p className="font-code-sm text-code-sm text-on-surface-variant">2 minutes ago • Packing Station 01</p>
              </div>
              <div className="text-right">
                <span className="px-md py-xs bg-status-success text-on-primary font-label-caps text-[10px] rounded-full">SELESAI</span>
              </div>
            </div>
            {/* Activity Item 2 */}
            <div className="flex items-center gap-md p-md hover:bg-surface-variant transition-colors rounded-DEFAULT border border-transparent hover:border-ui-divider">
              <div className="w-10 h-10 bg-tertiary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-tertiary">workspace_premium</span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-on-surface font-semibold">Warehouse "Store A" upgraded to Enterprise</p>
                <p className="font-code-sm text-code-sm text-on-surface-variant">15 minutes ago • Admin Action</p>
              </div>
              <div className="text-right">
                <span className="px-md py-xs border border-tertiary text-tertiary font-label-caps text-[10px] rounded-full">UPGRADE</span>
              </div>
            </div>
            {/* Activity Item 3 */}
            <div className="flex items-center gap-md p-md hover:bg-surface-variant transition-colors rounded-DEFAULT border border-transparent hover:border-ui-divider">
              <div className="w-10 h-10 bg-status-processing/10 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-status-processing">sync</span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-on-surface font-semibold">API Syncing with Shopee Warehouse</p>
                <p className="font-code-sm text-code-sm text-on-surface-variant">45 minutes ago • System</p>
              </div>
              <div className="text-right">
                <span className="px-md py-xs bg-status-processing text-on-primary font-label-caps text-[10px] rounded-full">PROSES</span>
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
