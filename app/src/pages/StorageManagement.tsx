export default function StorageManagement() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="px-lg py-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Storage Management</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage your cloud evidence capacity and archival rules.</p>
      </div>
      
      <div className="px-lg pb-xl space-y-lg max-w-container-max mx-auto w-full flex-1">
        {/* Top Section */}
        <div className="flex flex-col gap-lg">
          {/* Storage Usage Card */}
          <div className="p-xl bg-surface-container-lowest border border-ui-divider rounded-lg flex flex-col justify-between hover:border-primary hover:bg-surface-container-low transition-all duration-200">
            <div className="flex justify-between items-start mb-md">
              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Current Usage</span>
                <h3 className="font-headline-md text-headline-md font-bold">37.5 GB <span className="font-normal text-on-surface-variant">/ 50 GB</span></h3>
              </div>
              <div className="bg-status-processing px-3 py-1 rounded-DEFAULT">
                <span className="font-label-caps text-label-caps text-white text-[12px]">Starter Plan</span>
              </div>
            </div>
            
            <div className="w-full h-8 bg-surface-container rounded-DEFAULT overflow-hidden relative border border-ui-divider mb-lg">
              {/* Progress Bar */}
              <div className="h-full bg-status-processing transition-all duration-500 ease-out" style={{ width: '75%' }}></div>
              <div className="absolute inset-0 flex items-center justify-end px-md">
                <span className="font-code-sm text-code-sm font-bold text-on-surface-variant">75% USED</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-md">
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Your storage is reaching its limit. Upgrade now to avoid service interruption during high-volume periods.</p>
              <button className="w-full sm:w-auto px-lg py-md bg-primary text-white font-bold rounded-DEFAULT hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">upgrade</span>
                UPGRADE PLAN
              </button>
            </div>
          </div>

        </div>

        {/* Recent Large Files / Video Management */}
        <div className="space-y-md pb-lg">
          <h3 className="font-label-caps text-label-caps text-on-surface font-bold uppercase tracking-widest">Recent Evidence Activity</h3>
          <div className="bg-surface-container-lowest border border-ui-divider rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant">
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Recording ID</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Timestamp</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Size</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Storage Node</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-lg py-md border-b border-ui-divider font-code-sm">REC-20240520-001</td>
                  <td className="px-lg py-md border-b border-ui-divider">Today, 14:32:01</td>
                  <td className="px-lg py-md border-b border-ui-divider">1.2 GB</td>
                  <td className="px-lg py-md border-b border-ui-divider text-primary font-bold">GEMINI_01</td>
                  <td className="px-lg py-md border-b border-ui-divider text-right">
                    <button className="font-code-sm text-code-sm text-on-surface-variant hover:text-status-error">[ DELETE ]</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-lg py-md border-b border-ui-divider font-code-sm">REC-20240520-002</td>
                  <td className="px-lg py-md border-b border-ui-divider">Today, 14:15:44</td>
                  <td className="px-lg py-md border-b border-ui-divider">856 MB</td>
                  <td className="px-lg py-md border-b border-ui-divider text-primary font-bold">GEMINI_01</td>
                  <td className="px-lg py-md border-b border-ui-divider text-right">
                    <button className="font-code-sm text-code-sm text-on-surface-variant hover:text-status-error">[ DELETE ]</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-lg py-md border-b border-ui-divider font-code-sm">REC-20240519-094</td>
                  <td className="px-lg py-md border-b border-ui-divider">Yesterday, 18:22:12</td>
                  <td className="px-lg py-md border-b border-ui-divider">2.4 GB</td>
                  <td className="px-lg py-md border-b border-ui-divider text-on-surface-variant font-bold">LOCAL_CACHE</td>
                  <td className="px-lg py-md border-b border-ui-divider text-right">
                    <button className="font-code-sm text-code-sm text-on-surface-variant hover:text-status-error">[ DELETE ]</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="px-lg py-md bg-surface-container-low flex justify-center">
              <button className="font-label-caps text-label-caps text-primary hover:underline">VIEW ALL RECORDINGS</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto flex flex-col md:flex-row justify-between items-center w-full px-lg py-md border-t border-ui-divider bg-surface">
        <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 md:mb-0">© 2026 Nafindo Group. All Rights Reserved.</span>
        <div className="flex items-center gap-md">
          <span className="font-code-sm text-code-sm text-on-surface-variant">BUKTIIN v2.4.0-build.88</span>
          <span className="font-code-sm text-code-sm text-on-surface-variant font-bold">Developed by Nafindo Group</span>
        </div>
      </footer>
    </div>
  );
}
