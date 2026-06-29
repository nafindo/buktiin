export default function ScanHistory() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Page Body */}
      <section className="p-lg flex-1">
        {/* Bento Search & Filter Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md mb-lg">
          {/* Search Section */}
          <div className="lg:col-span-6 bg-surface-container-lowest border border-ui-divider p-md flex flex-col justify-center">
            <label className="font-label-caps text-code-sm text-on-surface-variant mb-xs">Cari Resi atau Nama Customer</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input className="w-full pl-10 pr-md py-sm bg-surface border border-ui-divider focus:border-2 focus:border-primary outline-none font-body-md transition-all" placeholder="Contoh: RESI-012345678" type="text"/>
            </div>
          </div>
          {/* Date Range Filter */}
          <div className="lg:col-span-4 bg-surface-container-lowest border border-ui-divider p-md flex flex-col justify-center">
            <label className="font-label-caps text-code-sm text-on-surface-variant mb-xs">Filter Rentang Tanggal</label>
            <div className="flex items-center gap-2">
              <input className="flex-1 px-sm py-sm bg-surface border border-ui-divider focus:border-primary outline-none font-code-sm" type="date"/>
              <span className="text-on-surface-variant">to</span>
              <input className="flex-1 px-sm py-sm bg-surface border border-ui-divider focus:border-primary outline-none font-code-sm" type="date"/>
            </div>
          </div>
          {/* Export CTA */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-ui-divider p-md flex flex-col items-stretch justify-center">
            <button className="w-full h-full bg-on-surface text-surface py-md font-label-caps text-label-caps flex items-center justify-center gap-2 hover:bg-on-surface-variant transition-colors active:scale-95 duration-150">
              <span className="material-symbols-outlined text-md">download</span>
              Export CSV
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
              {/* Row 1 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-md py-md font-code-sm whitespace-nowrap">2026-10-24 14:22</td>
                <td className="px-md py-md font-code-sm font-bold whitespace-nowrap">RESI-88219901</td>
                <td className="px-md py-md font-body-md whitespace-nowrap">Andi Wijaya</td>
                <td className="px-md py-md font-body-md min-w-[200px]">2x Laptop Sleeve, 1x Mouse</td>
                <td className="px-md py-md whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 bg-status-success text-white font-label-caps text-[10px] rounded-xs uppercase">Selesai</span>
                </td>
                <td className="px-md py-md text-center">
                  <button className="text-primary hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">play_circle</span>
                  </button>
                </td>
                <td className="px-md py-md text-right whitespace-nowrap">
                  <button className="text-on-surface-variant font-code-sm opacity-50 hover:opacity-100">[ Details ]</button>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-md py-md font-code-sm whitespace-nowrap">2026-10-24 14:15</td>
                <td className="px-md py-md font-code-sm font-bold whitespace-nowrap">RESI-88219902</td>
                <td className="px-md py-md font-body-md whitespace-nowrap">Siti Aminah</td>
                <td className="px-md py-md font-body-md min-w-[200px]">5x Packing Tape</td>
                <td className="px-md py-md whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 bg-status-processing text-white font-label-caps text-[10px] rounded-xs uppercase">Proses</span>
                </td>
                <td className="px-md py-md text-center">
                  <button className="text-on-surface-variant opacity-20 cursor-not-allowed">
                    <span className="material-symbols-outlined">videocam_off</span>
                  </button>
                </td>
                <td className="px-md py-md text-right whitespace-nowrap">
                  <button className="text-on-surface-variant font-code-sm opacity-50 hover:opacity-100">[ Details ]</button>
                </td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-md py-md font-code-sm whitespace-nowrap">2026-10-24 13:58</td>
                <td className="px-md py-md font-code-sm font-bold whitespace-nowrap">RESI-88219895</td>
                <td className="px-md py-md font-body-md whitespace-nowrap">Budiono Siregar</td>
                <td className="px-md py-md font-body-md min-w-[200px]">1x Mechanical Keyboard</td>
                <td className="px-md py-md whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 bg-status-error text-white font-label-caps text-[10px] rounded-xs uppercase">Gagal</span>
                </td>
                <td className="px-md py-md text-center">
                  <button className="text-primary hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">play_circle</span>
                  </button>
                </td>
                <td className="px-md py-md text-right whitespace-nowrap">
                  <button className="text-on-surface-variant font-code-sm opacity-50 hover:opacity-100">[ Details ]</button>
                </td>
              </tr>
              {/* Row 4 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-md py-md font-code-sm whitespace-nowrap">2026-10-24 13:45</td>
                <td className="px-md py-md font-code-sm font-bold whitespace-nowrap">RESI-88219890</td>
                <td className="px-md py-md font-body-md whitespace-nowrap">Rina Kartika</td>
                <td className="px-md py-md font-body-md min-w-[200px]">1x Monitor 24", 1x HDMI</td>
                <td className="px-md py-md whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 bg-status-success text-white font-label-caps text-[10px] rounded-xs uppercase">Selesai</span>
                </td>
                <td className="px-md py-md text-center">
                  <button className="text-primary hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">play_circle</span>
                  </button>
                </td>
                <td className="px-md py-md text-right whitespace-nowrap">
                  <button className="text-on-surface-variant font-code-sm opacity-50 hover:opacity-100">[ Details ]</button>
                </td>
              </tr>
              {/* Row 5 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-md py-md font-code-sm whitespace-nowrap">2026-10-24 13:30</td>
                <td className="px-md py-md font-code-sm font-bold whitespace-nowrap">RESI-88219888</td>
                <td className="px-md py-md font-body-md whitespace-nowrap">Dedi Mulyadi</td>
                <td className="px-md py-md font-body-md min-w-[200px]">3x USB Hub Type-C</td>
                <td className="px-md py-md whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 bg-status-success text-white font-label-caps text-[10px] rounded-xs uppercase">Selesai</span>
                </td>
                <td className="px-md py-md text-center">
                  <button className="text-primary hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">play_circle</span>
                  </button>
                </td>
                <td className="px-md py-md text-right whitespace-nowrap">
                  <button className="text-on-surface-variant font-code-sm opacity-50 hover:opacity-100">[ Details ]</button>
                </td>
              </tr>
            </tbody>
          </table>
          
          {/* Pagination Utility */}
          <div className="px-lg py-md bg-surface-container border-t border-ui-divider flex flex-col md:flex-row justify-between items-center gap-md">
            <p className="font-code-sm text-code-sm text-on-surface-variant">Showing 1-25 of 1,204 results</p>
            <div className="flex items-center gap-xs">
              <button className="w-10 h-10 flex items-center justify-center border border-ui-divider bg-surface hover:bg-surface-container-high transition-colors active:scale-95">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center border border-primary bg-primary text-white font-label-caps text-label-caps shadow-sm">1</button>
              <button className="w-10 h-10 flex items-center justify-center border border-ui-divider bg-surface hover:bg-surface-container-high font-label-caps text-label-caps">2</button>
              <button className="w-10 h-10 flex items-center justify-center border border-ui-divider bg-surface hover:bg-surface-container-high font-label-caps text-label-caps">3</button>
              <span className="px-2 text-on-surface-variant">...</span>
              <button className="w-10 h-10 flex items-center justify-center border border-ui-divider bg-surface hover:bg-surface-container-high font-label-caps text-label-caps">48</button>
              <button className="w-10 h-10 flex items-center justify-center border border-ui-divider bg-surface hover:bg-surface-container-high transition-colors active:scale-95">
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
    </div>
  );
}
