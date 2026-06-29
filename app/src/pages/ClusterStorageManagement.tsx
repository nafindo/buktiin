export default function ClusterStorageManagement() {
  return (
    <div className="p-lg pb-xl space-y-lg flex flex-col min-h-[calc(100vh-64px)] w-full max-w-container-max mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Cluster Storage Management</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Monitor nodes, load balancing, and automated migrations.</p>
      </div>
      
      {/* Backend Storage Nodes */}
      <div className="space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {/* Node 01 */}
          <div className="group relative overflow-hidden bg-surface-container-lowest border-2 border-primary rounded-lg p-lg flex items-center gap-lg shadow-sm">
            <div className="w-16 h-16 bg-primary-container rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>dns</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-headline-md text-[18px] font-bold">Gemini Node 01</h4>
                <span className="bg-status-success text-white px-2 py-[2px] rounded font-code-sm text-[10px]">ACTIVE</span>
              </div>
              <p className="font-code-sm text-code-sm text-on-surface-variant">142 Active Tenants Assigned</p>
              <div className="mt-sm flex items-center gap-lg">
                <span className="font-label-caps text-[12px] font-bold">5 TB CAPACITY</span>
                <span className="font-code-sm text-[12px] text-on-surface-variant">88.4% Used</span>
              </div>
            </div>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-status-error transition-colors">settings</button>
          </div>
          
          {/* Node 02 */}
          <div className="group relative overflow-hidden bg-surface-container-lowest border border-ui-divider rounded-lg p-lg flex items-center gap-lg shadow-sm">
            <div className="w-16 h-16 bg-surface-container-high rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">dns</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-headline-md text-[18px] font-bold">Gemini Node 02</h4>
                <span className="bg-status-processing text-white px-2 py-[2px] rounded font-code-sm text-[10px]">BALANCING</span>
              </div>
              <p className="font-code-sm text-code-sm text-on-surface-variant">12 Active Tenants Assigned</p>
              <div className="mt-sm flex items-center gap-lg">
                <span className="font-label-caps text-[12px] font-bold">5 TB CAPACITY</span>
                <span className="font-code-sm text-[12px] text-on-surface-variant">4.2% Used</span>
              </div>
            </div>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-status-error transition-colors">settings</button>
          </div>
          
          {/* Add New Node Placeholder */}
          <div className="border-2 border-dashed border-ui-divider rounded-lg p-lg flex flex-col items-center justify-center text-center hover:border-primary hover:bg-surface-container transition-all group cursor-pointer md:col-span-2">
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary mb-2 transition-colors">add_box</span>
            <p className="font-label-caps text-label-caps text-on-surface-variant">Expand Cluster Capacity</p>
            <p className="font-code-sm text-[11px] text-outline text-on-surface-variant mt-1">Provision New Gemini Storage Node</p>
          </div>
        </div>
      </div>

      {/* Migration and Activity */}
      <div className="space-y-md flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
          <div className="bg-surface-container-low border-l-4 border-primary p-md rounded flex items-center gap-md">
            <span className="material-symbols-outlined text-primary">balance</span>
            <div>
              <p className="font-label-caps text-[12px] font-bold text-primary">SMART LOAD BALANCING: ACTIVE</p>
              <p className="font-code-sm text-[11px] text-on-surface-variant">Auto-migrating upgraded users to Node 02 (Target: &lt; 90% Load)</p>
            </div>
          </div>
          <div className="bg-primary-container/10 border border-primary/20 p-md rounded flex items-center gap-md">
            <span className="material-symbols-outlined text-status-success">check_circle</span>
            <div>
              <p className="font-label-caps text-[12px] font-bold text-on-surface">MIGRATION STATUS</p>
              <p className="font-code-sm text-[11px] text-on-surface-variant">SUCCESS: User ID #8821 migrated to Node 02 (14.2 GB verified)</p>
            </div>
          </div>
        </div>

        <h3 className="font-label-caps text-label-caps text-on-surface font-bold uppercase tracking-widest mt-lg">Recent Evidence Activity</h3>
        <div className="bg-surface-container-lowest border border-ui-divider rounded-lg overflow-hidden shadow-sm">
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
              <tr className="hover:bg-surface-container-low transition-colors cursor-pointer">
                <td className="px-lg py-md border-b border-ui-divider font-code-sm">REC-20240520-001</td>
                <td className="px-lg py-md border-b border-ui-divider">Today, 14:32:01</td>
                <td className="px-lg py-md border-b border-ui-divider">1.2 GB</td>
                <td className="px-lg py-md border-b border-ui-divider text-primary font-bold">GEMINI_01</td>
                <td className="px-lg py-md border-b border-ui-divider text-right">
                  <button className="font-code-sm text-code-sm text-on-surface-variant hover:text-status-error">[ DELETE ]</button>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors cursor-pointer">
                <td className="px-lg py-md border-b border-ui-divider font-code-sm">REC-20240520-002</td>
                <td className="px-lg py-md border-b border-ui-divider">Today, 14:15:44</td>
                <td className="px-lg py-md border-b border-ui-divider">856 MB</td>
                <td className="px-lg py-md border-b border-ui-divider text-primary font-bold">GEMINI_01</td>
                <td className="px-lg py-md border-b border-ui-divider text-right">
                  <button className="font-code-sm text-code-sm text-on-surface-variant hover:text-status-error">[ DELETE ]</button>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors cursor-pointer">
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
      
      {/* Footer */}
      <footer className="flex flex-col md:flex-row justify-between items-center w-full pt-md border-t border-ui-divider bg-surface mt-auto">
        <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 md:mb-0">© 2026 Nafindo Group. All Rights Reserved.</span>
        <div className="flex items-center gap-md">
          <span className="font-code-sm text-code-sm text-on-surface-variant">BUKTIIN v2.4.0-build.88</span>
          <span className="font-code-sm text-code-sm text-on-surface-variant font-bold">Developed by Nafindo Group</span>
        </div>
      </footer>
    </div>
  );
}
