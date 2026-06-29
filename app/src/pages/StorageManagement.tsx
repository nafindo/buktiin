export default function StorageManagement() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="px-lg py-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Storage Management</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage your cloud evidence capacity and archival rules.</p>
      </div>
      
      <div className="px-lg pb-xl space-y-lg max-w-container-max mx-auto w-full flex-1">
        {/* Top Bento Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Storage Usage Card (Priority 1) */}
          <div className="lg:col-span-2 p-xl bg-surface-container-lowest border border-ui-divider rounded-lg flex flex-col justify-between hover:border-primary hover:bg-surface-container-low transition-all duration-200">
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

          {/* Auto-Delete Settings Card */}
          <div className="p-xl bg-surface-container-lowest border border-ui-divider rounded-lg hover:border-primary hover:bg-surface-container-low transition-all duration-200">
            <div className="flex items-center gap-2 mb-md">
              <span className="material-symbols-outlined text-primary">auto_delete</span>
              <h3 className="font-label-caps text-label-caps text-on-surface font-bold uppercase">Archival Policy</h3>
            </div>
            
            <div className="space-y-lg mt-lg">
              <div className="flex items-center justify-between">
                <span className="font-body-md text-body-md">Auto-Delete Old Files</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="space-y-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant text-[12px]">Retention Period</span>
                <div className="flex items-center gap-sm">
                  <input type="number" defaultValue="30" className="flex-1 bg-surface-container border border-ui-divider px-md py-sm font-code-sm text-center focus:border-primary outline-none" />
                  <span className="font-body-md text-body-md">Days</span>
                </div>
              </div>
              <p className="font-code-sm text-[11px] text-on-surface-variant italic">Files will be permanently deleted after 30 days of inactivity to free up space.</p>
            </div>
          </div>
        </div>

        {/* Backend Storage Nodes */}
        <div className="space-y-md">
          <div className="flex justify-between items-end">
            <h3 className="font-label-caps text-label-caps text-on-surface font-bold uppercase tracking-widest">Storage Nodes & Cloud Integration</h3>
            <button className="flex items-center gap-1 text-primary font-label-caps text-label-caps hover:underline transition-all">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              ADD STORAGE ACCOUNT
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Google Gemini Node */}
            <div className="group relative overflow-hidden bg-surface-container-lowest border-2 border-primary rounded-lg p-lg flex items-center gap-lg">
              <div className="w-16 h-16 bg-primary-container rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-headline-md text-[18px] font-bold">Google Gemini Storage</h4>
                  <span className="bg-status-success text-white px-2 py-[2px] rounded-DEFAULT font-code-sm text-[10px]">CONNECTED</span>
                </div>
                <p className="font-code-sm text-code-sm text-on-surface-variant">primary-operator@buktiin.cloud</p>
                <div className="mt-sm flex items-center gap-lg">
                  <span className="font-label-caps text-[12px] font-bold">5 TB CAPACITY</span>
                  <span className="font-code-sm text-[12px] text-on-surface-variant">0.7% Used</span>
                </div>
              </div>
              <button className="material-symbols-outlined text-on-surface-variant hover:text-status-error transition-colors">settings</button>
            </div>
            
            {/* Add New Storage Placeholder */}
            <div className="border-2 border-dashed border-ui-divider rounded-lg p-lg flex flex-col items-center justify-center text-center hover:border-primary hover:bg-surface-container transition-all group cursor-pointer">
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary mb-2 transition-colors">add_box</span>
              <p className="font-label-caps text-label-caps text-on-surface-variant">Expand Capacity</p>
              <p className="font-code-sm text-[11px] text-outline text-on-surface-variant mt-1">Add AWS S3, Google Drive, or Local NAS</p>
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
