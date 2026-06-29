export default function UserManagement() {
  return (
    <div className="p-lg pb-xl space-y-lg flex flex-col min-h-[calc(100vh-64px)] max-w-container-max mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">User Management</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Maintain and audit system access across warehouse tiers.</p>
        </div>
        <div className="flex items-center gap-md">
          <button className="flex items-center gap-sm bg-white border border-secondary text-secondary px-lg py-sm rounded transition-all hover:bg-surface-container-low">
            <span className="material-symbols-outlined">download</span>
            <span className="font-label-caps text-label-caps">EXPORT CSV</span>
          </button>
          <button className="flex items-center gap-sm bg-status-success text-white px-lg py-sm rounded font-bold shadow-sm transition-all hover:opacity-90">
            <span className="material-symbols-outlined">person_add</span>
            <span className="font-label-caps text-label-caps">INVITE USER</span>
          </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
        <div className="bg-white border border-ui-divider p-lg rounded-xl">
          <div className="flex justify-between items-start mb-sm">
            <span className="material-symbols-outlined text-primary text-3xl">group</span>
            <span className="font-code-sm text-code-sm text-status-success">+12%</span>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">TOTAL USERS</p>
          <p className="font-headline-md text-headline-md">1,284</p>
        </div>
        <div className="bg-white border border-ui-divider p-lg rounded-xl">
          <div className="flex justify-between items-start mb-sm">
            <span className="material-symbols-outlined text-status-processing text-3xl">verified</span>
            <span className="font-code-sm text-code-sm text-status-processing">92%</span>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">ACTIVE NOW</p>
          <p className="font-headline-md text-headline-md">156</p>
        </div>
        <div className="bg-white border border-ui-divider p-lg rounded-xl">
          <div className="flex justify-between items-start mb-sm">
            <span className="material-symbols-outlined text-secondary text-3xl">subscriptions</span>
            <span className="font-code-sm text-code-sm text-on-surface-variant">Enterprise</span>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">PLAN CONVERSION</p>
          <p className="font-headline-md text-headline-md">24.5%</p>
        </div>
        <div className="bg-white border border-ui-divider p-lg rounded-xl">
          <div className="flex justify-between items-start mb-sm">
            <span className="material-symbols-outlined text-status-error text-3xl">priority_high</span>
            <span className="font-code-sm text-code-sm text-status-error">Attention</span>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">EXPIRED TODAY</p>
          <p className="font-headline-md text-headline-md">3</p>
        </div>
      </div>

      {/* Table Filters */}
      <div className="bg-surface-container-low border border-ui-divider p-md flex flex-wrap items-center justify-between gap-md rounded-t-xl">
        <div className="flex items-center gap-md flex-1">
          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">filter_list</span>
            <input className="w-full bg-white border border-ui-divider rounded py-xs pl-xl pr-sm text-body-md" placeholder="Filter by Name or ID..." type="text"/>
          </div>
          <select className="bg-white border border-ui-divider rounded py-xs px-md font-body-md text-on-surface-variant outline-none">
            <option>All Plans</option>
            <option>Enterprise</option>
            <option>Pro</option>
            <option>Basic</option>
          </select>
          <select className="bg-white border border-ui-divider rounded py-xs px-md font-body-md text-on-surface-variant outline-none">
            <option>All Status</option>
            <option>Active</option>
            <option>Grace</option>
            <option>Expired</option>
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-code-sm text-code-sm text-on-surface-variant uppercase">Displaying 25 of 1,284 entries</span>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-ui-divider overflow-hidden rounded-b-xl shadow-sm mb-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container text-on-surface-variant border-b border-ui-divider">
            <tr>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider">Name</th>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider">Email</th>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider">Plan</th>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider">Status</th>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-divider">
            {/* Row 1 */}
            <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer active:bg-primary-container/10">
              <td className="py-md px-lg">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold">BS</div>
                  <span className="font-body-md text-body-md font-bold text-on-surface">Budi S.</span>
                </div>
              </td>
              <td className="py-md px-lg font-code-sm text-code-sm text-on-surface-variant">budi.s@warehouse.co.id</td>
              <td className="py-md px-lg"><span className="px-sm py-1 border border-ui-divider rounded font-code-sm text-code-sm bg-surface">Enterprise</span></td>
              <td className="py-md px-lg">
                <span className="bg-status-success text-white font-label-caps text-xs px-sm py-1 rounded">ACTIVE</span>
              </td>
              <td className="py-md px-lg text-right">
                <div className="flex justify-end gap-xs">
                  <button className="p-xs text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">edit</span></button>
                  <button className="p-xs text-on-surface-variant hover:text-status-error transition-colors"><span className="material-symbols-outlined">delete</span></button>
                  <button className="p-xs text-on-surface-variant hover:text-secondary transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
                </div>
              </td>
            </tr>
            {/* Row 2 */}
            <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer active:bg-primary-container/10">
              <td className="py-md px-lg">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-white font-bold">RW</div>
                  <span className="font-body-md text-body-md font-bold text-on-surface">Rina W.</span>
                </div>
              </td>
              <td className="py-md px-lg font-code-sm text-code-sm text-on-surface-variant">rina.w@logistic.net</td>
              <td className="py-md px-lg"><span className="px-sm py-1 border border-ui-divider rounded font-code-sm text-code-sm bg-surface">Pro</span></td>
              <td className="py-md px-lg">
                <span className="bg-status-processing text-white font-label-caps text-xs px-sm py-1 rounded">GRACE</span>
              </td>
              <td className="py-md px-lg text-right">
                <div className="flex justify-end gap-xs">
                  <button className="p-xs text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span></button>
                  <button className="p-xs text-on-surface-variant hover:text-status-error transition-colors"><span className="material-symbols-outlined">delete</span></button>
                  <button className="p-xs text-on-surface-variant hover:text-secondary transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
                </div>
              </td>
            </tr>
            {/* Row 3 */}
            <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer active:bg-primary-container/10">
              <td className="py-md px-lg">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-dim flex items-center justify-center text-on-surface font-bold">AK</div>
                  <span className="font-body-md text-body-md font-bold text-on-surface">Andi K.</span>
                </div>
              </td>
              <td className="py-md px-lg font-code-sm text-code-sm text-on-surface-variant">andi.k@transhub.io</td>
              <td className="py-md px-lg"><span className="px-sm py-1 border border-ui-divider rounded font-code-sm text-code-sm bg-surface">Basic</span></td>
              <td className="py-md px-lg">
                <span className="bg-status-error text-white font-label-caps text-xs px-sm py-1 rounded">EXPIRED</span>
              </td>
              <td className="py-md px-lg text-right">
                <div className="flex justify-end gap-xs">
                  <button className="p-xs text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">edit</span></button>
                  <button className="p-xs text-on-surface-variant hover:text-status-error transition-colors"><span className="material-symbols-outlined">delete</span></button>
                  <button className="p-xs text-on-surface-variant hover:text-secondary transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
                </div>
              </td>
            </tr>
            {/* Row 4 */}
            <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer active:bg-primary-container/10">
              <td className="py-md px-lg">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">SP</div>
                  <span className="font-body-md text-body-md font-bold text-on-surface">Siti P.</span>
                </div>
              </td>
              <td className="py-md px-lg font-code-sm text-code-sm text-on-surface-variant">siti.permata@buktiin.ai</td>
              <td className="py-md px-lg"><span className="px-sm py-1 border border-ui-divider rounded font-code-sm text-code-sm bg-surface">Enterprise</span></td>
              <td className="py-md px-lg">
                <span className="bg-status-success text-white font-label-caps text-xs px-sm py-1 rounded">ACTIVE</span>
              </td>
              <td className="py-md px-lg text-right">
                <div className="flex justify-end gap-xs">
                  <button className="p-xs text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">edit</span></button>
                  <button className="p-xs text-on-surface-variant hover:text-status-error transition-colors"><span className="material-symbols-outlined">delete</span></button>
                  <button className="p-xs text-on-surface-variant hover:text-secondary transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="p-md bg-surface border-t border-ui-divider flex justify-between items-center">
          <button className="px-lg py-xs border border-ui-divider rounded font-label-caps text-xs text-on-surface-variant hover:bg-surface-container transition-all">PREVIOUS</button>
          <div className="flex gap-xs">
            <button className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded font-bold">2</button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded font-bold">3</button>
            <span className="flex items-center px-xs">...</span>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded font-bold">52</button>
          </div>
          <button className="px-lg py-xs border border-ui-divider rounded font-label-caps text-xs text-on-surface-variant hover:bg-surface-container transition-all">NEXT</button>
        </div>
      </div>

      {/* Utility Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg opacity-80 mt-auto">
        <div className="flex items-center gap-md p-lg bg-surface-container-low border-l-4 border-primary rounded">
          <span className="material-symbols-outlined text-primary text-3xl">info</span>
          <div className="font-body-md text-body-md">
            <span className="font-bold">Pro Tip:</span> Rapid search is enabled using the <code className="bg-surface-container px-1 font-code-sm">Ctrl + K</code> shortcut for global user lookup across all warehouses.
          </div>
        </div>
        <div className="flex items-center gap-md p-lg bg-surface-container-low border-l-4 border-secondary rounded">
          <span className="material-symbols-outlined text-secondary text-3xl">terminal</span>
          <div className="font-code-sm text-code-sm text-on-surface-variant">
            SYSTEM_ID: XA-449-PRIME | REPLICA_SYNC: SUCCESSFUL | LATENCY: 12ms
          </div>
        </div>
      </div>
      
      {/* Footer Shell */}
      <footer className="flex justify-between items-center py-md px-lg border-t border-ui-divider bg-surface mt-lg">
        <div className="flex items-center gap-lg font-code-sm text-code-sm text-on-surface-variant">
          <a className="hover:text-primary transition-opacity" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-opacity" href="#">Terms of Service</a>
          <span className="text-ui-divider">|</span>
          <span className="font-bold text-on-surface">v1.2.4</span>
        </div>
        <div className="font-code-sm text-code-sm font-bold text-on-surface uppercase tracking-wider">
          Developed by Nafindo Group
        </div>
      </footer>
    </div>
  );
}
