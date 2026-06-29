export default function LiveScanner() {
  return (
    <div className="flex flex-col h-full min-h-full">
      {/* Layout: Bento Grid Style */}
      <section className="flex-1 p-md lg:p-lg grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left: Webcam Area (Col 8) */}
        <div className="lg:col-span-8 space-y-md">
          <div className="relative aspect-video bg-black rounded-xl border-2 border-primary overflow-hidden shadow-sm group">
            {/* Placeholder for Live Stream */}
            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
              <div className="text-white/20 text-center">
                <span className="material-symbols-outlined text-6xl">photo_camera</span>
                <p className="font-label-caps text-label-caps mt-md">Connecting to Packing Camera...</p>
              </div>
            </div>
            {/* Video Background Image Injection */}
            <div className="absolute inset-0 opacity-60 pointer-events-none bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCZtJg3Wfzw1FYTH6r2L8VphHFkftmSPJnnIqyT8raIio7bzKl8_vxEk_-4gcfhzJj5UHJGUuCy4BxrSgFr8q5g9aHFub_Gy7BtB_ZGHziJtjLi3LiFO5tcFrqADf3-N7kUZYSI-CwJYm6VlKOxE0QOMz5Kr-jLHm1aHi_h-mWqtOodwTvcFgWRBHQBAi-5KqnuBN6zkMGlfVYgbqLJnQVcdaUCpKBBrmKcN_eZttyNpEtd4mQF5ynA')" }}></div>
            {/* Technical Overlays */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-status-success shadow-[0_0_15px_#00C853] animate-[moveScan_3s_linear_infinite]"></div>
            <div className="absolute top-md right-md flex items-center gap-sm bg-black/60 backdrop-blur-md px-md py-sm rounded-lg border border-white/10">
              <span className="w-3 h-3 bg-error rounded-full animate-pulse"></span>
              <span className="font-label-caps text-label-caps text-white">REC ● 00:42:15</span>
            </div>
            <div className="absolute bottom-md left-md p-md bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-white">
              <div className="grid grid-cols-2 gap-x-lg gap-y-xs">
                <span className="font-code-sm text-code-sm opacity-60 uppercase">Resolution</span>
                <span className="font-code-sm text-code-sm">1920x1080 (HD)</span>
                <span className="font-code-sm text-code-sm opacity-60 uppercase">Bitrate</span>
                <span className="font-code-sm text-code-sm">4.2 Mbps</span>
                <span className="font-code-sm text-code-sm opacity-60 uppercase">Station ID</span>
                <span className="font-code-sm text-code-sm">STN-JKT-01</span>
              </div>
            </div>
          </div>
          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-md items-stretch">
            <button className="flex-1 bg-surface-container-highest border-2 border-primary text-primary font-bold py-md px-xl rounded-lg hover:bg-primary-container/20 transition-all active:scale-95 flex items-center justify-center gap-md">
              <span className="material-symbols-outlined">videocam</span>
              <span className="font-headline-md text-[18px]">Mulai Rekam</span>
            </button>
            <button className="flex-1 bg-primary text-white font-bold py-md px-xl rounded-lg hover:bg-on-primary-container transition-all active:scale-95 shadow-lg flex items-center justify-center gap-md">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="font-headline-md text-[18px]">Selesai Packing</span>
            </button>
          </div>
        </div>

        {/* Right: Sidebar Data (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          {/* Order Detail Card (Auto-appears) */}
          <div className="bg-surface-container-lowest border border-ui-divider rounded-xl shadow-sm p-md flex flex-col">
            <div className="flex justify-between items-start mb-md">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Marketplace</p>
                <div className="flex items-center gap-sm">
                  <span className="w-6 h-6 bg-secondary-container rounded-full flex items-center justify-center text-white text-[10px] font-bold">S</span>
                  <h2 className="font-headline-md text-headline-md text-secondary font-bold">Shopee</h2>
                </div>
              </div>
              <span className="bg-primary-container text-on-primary-container px-sm py-xs font-label-caps text-[10px] rounded-lg">LIVE SCAN</span>
            </div>
            <div className="space-y-md border-y border-ui-divider py-md mb-md">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">No. Resi</p>
                <p className="font-code-sm text-[18px] font-bold text-on-surface select-all">JX123456789</p>
              </div>
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Customer</p>
                <p className="font-body-md text-body-md font-bold">Budi Santoso</p>
              </div>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-sm">Items list (2)</p>
              <ul className="space-y-sm">
                <li className="flex justify-between items-center bg-surface-container p-sm rounded-DEFAULT">
                  <span className="font-body-md text-body-md">Kaos Polos - Navy</span>
                  <span className="font-code-sm text-code-sm font-bold bg-white px-sm rounded">x1</span>
                </li>
                <li className="flex justify-between items-center bg-surface-container p-sm rounded-DEFAULT">
                  <span className="font-body-md text-body-md">Celana Chino - Khaki</span>
                  <span className="font-code-sm text-code-sm font-bold bg-white px-sm rounded">x1</span>
                </li>
              </ul>
            </div>
            <div className="mt-lg pt-md border-t border-dashed border-ui-divider">
              <p className="font-label-caps text-label-caps text-on-surface-variant">Catatan Pembeli:</p>
              <p className="italic text-on-surface-variant text-sm mt-xs">"Mohon cek jahitan, kak. Terima kasih!"</p>
            </div>
          </div>
          
          {/* Storage Usage Indicator */}
          <div className="bg-surface-container-low border border-ui-divider rounded-xl p-md mt-auto">
            <div className="flex justify-between items-end mb-sm">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Cloud Storage Usage</p>
                <p className="font-body-md text-body-md font-bold">75% Used</p>
              </div>
              <span className="material-symbols-outlined text-secondary">warning</span>
            </div>
            <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-secondary-container w-[75%] rounded-full"></div>
            </div>
            <p className="font-code-sm text-[10px] mt-sm text-on-surface-variant text-right">37.5 GB / 50 GB</p>
            <button className="w-full mt-md py-xs border border-secondary text-secondary rounded font-label-caps text-[12px] hover:bg-secondary-fixed transition-colors">UPGRADE STORAGE</button>
          </div>
        </div>
      </section>

      {/* Real-time Status Bar (Sticky Bottom) */}
      <footer className="bg-surface-container-lowest border-t border-ui-divider px-lg py-md flex flex-col md:flex-row items-center justify-between gap-md mt-auto sticky bottom-0">
        <div className="flex items-center gap-xl overflow-x-auto w-full md:w-auto no-scrollbar">
          <div className="flex items-center gap-md shrink-0">
            <div className="w-2 h-8 bg-status-success rounded-full"></div>
            <div>
              <p className="font-label-caps text-[10px] text-on-surface-variant">SELESAI</p>
              <p className="font-headline-md text-headline-md text-status-success font-bold">45</p>
            </div>
          </div>
          <div className="flex items-center gap-md shrink-0">
            <div className="w-2 h-8 bg-status-processing rounded-full"></div>
            <div>
              <p className="font-label-caps text-[10px] text-on-surface-variant">DIPROSES</p>
              <p className="font-headline-md text-headline-md text-status-processing font-bold">3</p>
            </div>
          </div>
          <div className="flex items-center gap-md shrink-0">
            <div className="w-2 h-8 bg-status-error rounded-full"></div>
            <div>
              <p className="font-label-caps text-[10px] text-on-surface-variant">GAGAL</p>
              <p className="font-headline-md text-headline-md text-status-error font-bold">0</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-md text-right">
          <div className="hidden sm:block">
            <p className="font-code-sm text-code-sm text-on-surface-variant">v2.4.1-Stable</p>
            <p className="font-label-caps text-[12px] font-bold">Developed by Nafindo Group</p>
          </div>
          <div className="h-8 w-px bg-ui-divider hidden sm:block"></div>
          <button className="bg-surface-container p-sm rounded-full flex items-center justify-center hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-primary">sync</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
