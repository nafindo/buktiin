import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const pin = localStorage.getItem('admin_pin');
      if (!pin) {
        setError('No PIN found. Please login again.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('get_admin_dashboard_stats', { pin_code: pin });
        if (rpcError) throw rpcError;
        setStats(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load stats or invalid PIN.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-lg flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
          <p className="font-code-md text-on-surface-variant">Syncing live data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-lg flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="bg-error-container text-on-error-container p-lg rounded-xl max-w-md text-center">
          <span className="material-symbols-outlined text-4xl mb-sm">error</span>
          <p className="font-body-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-lg pb-xl space-y-lg flex flex-col min-h-[calc(100vh-64px)]">
      {/* Welcome Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg">System Dashboard</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Real-time performance metrics for EvidenceSaaS</p>
        </div>
        <div className="flex items-center gap-sm font-code-sm text-code-sm bg-surface-container-highest px-md py-xs border border-ui-divider rounded">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>
          LIVE SYSTEM STATUS: OPTIMAL
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Total Users */}
        <div className="bg-surface border border-ui-divider p-lg group hover:border-primary transition-colors rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">Total Users</p>
            <span className="material-symbols-outlined text-primary">group</span>
          </div>
          <p className="font-display-lg text-display-lg mb-xs">{stats?.total_users || 0}</p>
          <div className="flex items-center gap-xs font-code-sm text-code-sm text-status-success">
            <span className="material-symbols-outlined">trending_up</span>
            Real-time sync
          </div>
        </div>
        {/* Active Users */}
        <div className="bg-surface border border-ui-divider p-lg group hover:border-primary transition-colors rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">Active Users</p>
            <span className="material-symbols-outlined text-status-processing">person_celebrate</span>
          </div>
          <p className="font-display-lg text-display-lg mb-xs">{stats?.active_users || 0}</p>
          <div className="flex items-center gap-xs font-code-sm text-code-sm text-on-surface-variant">
            <span className="material-symbols-outlined">analytics</span>
            Active Subscriptions
          </div>
        </div>
        {/* Revenue */}
        <div className="bg-surface border border-ui-divider p-lg group hover:border-primary transition-colors rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">Revenue</p>
            <span className="material-symbols-outlined text-secondary">payments</span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="font-headline-md text-headline-md">Rp</span>
            <p className="font-display-lg text-display-lg mb-xs">{stats?.revenue ? (stats.revenue / 1000000).toFixed(1) + 'jt' : '0'}</p>
          </div>
          <div className="flex items-center gap-xs font-code-sm text-code-sm text-status-success">
            <span className="material-symbols-outlined">trending_up</span>
            Estimated MRR
          </div>
        </div>
        {/* New Users */}
        <div className="bg-surface border border-ui-divider p-lg group hover:border-primary transition-colors rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">New Users (24h)</p>
            <span className="material-symbols-outlined text-primary">person_add</span>
          </div>
          <p className="font-display-lg text-display-lg mb-xs">{stats?.new_users || 0}</p>
          <div className="flex items-center gap-xs font-code-sm text-code-sm text-status-success">
            <span className="material-symbols-outlined">arrow_upward</span>
            Joined recently
          </div>
        </div>
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Revenue Growth Chart */}
        <div className="lg:col-span-2 bg-surface border border-ui-divider p-lg rounded-xl">
          <div className="flex justify-between items-center mb-xl">
            <h3 className="font-headline-md text-headline-md">Revenue Growth</h3>
            <div className="flex gap-md font-label-caps text-label-caps">
              <span className="flex items-center gap-xs"><span className="w-3 h-3 bg-primary rounded-full"></span> Actual</span>
              <span className="flex items-center gap-xs"><span className="w-3 h-3 bg-ui-divider rounded-full"></span> Target</span>
            </div>
          </div>
          <div className="relative h-64 w-full flex items-end gap-2 border-b border-l border-ui-divider px-md pb-md">
            {/* Simple visualization of a line chart using div bars */}
            <div className="flex-1 flex flex-col justify-end gap-1">
              <div className="w-full bg-ui-divider h-24 opacity-30"></div>
              <div className="w-full bg-primary h-20 transition-all hover:h-24 cursor-pointer"></div>
              <p className="font-code-sm text-code-sm text-center mt-2">JAN</p>
            </div>
            <div className="flex-1 flex flex-col justify-end gap-1">
              <div className="w-full bg-ui-divider h-28 opacity-30"></div>
              <div className="w-full bg-primary h-24 transition-all hover:h-28 cursor-pointer"></div>
              <p className="font-code-sm text-code-sm text-center mt-2">FEB</p>
            </div>
            <div className="flex-1 flex flex-col justify-end gap-1">
              <div className="w-full bg-ui-divider h-32 opacity-30"></div>
              <div className="w-full bg-primary h-36 transition-all hover:h-40 cursor-pointer"></div>
              <p className="font-code-sm text-code-sm text-center mt-2">MAR</p>
            </div>
            <div className="flex-1 flex flex-col justify-end gap-1">
              <div className="w-full bg-ui-divider h-36 opacity-30"></div>
              <div className="w-full bg-primary h-40 transition-all hover:h-44 cursor-pointer"></div>
              <p className="font-code-sm text-code-sm text-center mt-2">APR</p>
            </div>
            <div className="flex-1 flex flex-col justify-end gap-1">
              <div className="w-full bg-ui-divider h-40 opacity-30"></div>
              <div className="w-full bg-primary h-44 transition-all hover:h-48 cursor-pointer"></div>
              <p className="font-code-sm text-code-sm text-center mt-2">MAY</p>
            </div>
            <div className="flex-1 flex flex-col justify-end gap-1">
              <div className="w-full bg-ui-divider h-48 opacity-30"></div>
              <div className="w-full bg-primary h-52 transition-all hover:h-56 cursor-pointer"></div>
              <p className="font-code-sm text-code-sm text-center mt-2">JUN</p>
            </div>
          </div>
        </div>
        
        {/* Plan Distribution */}
        <div className="bg-surface border border-ui-divider p-lg rounded-xl flex flex-col">
          <h3 className="font-headline-md text-headline-md mb-xl">Plan Distribution</h3>
          <div className="flex flex-col items-center justify-center space-y-lg flex-1">
            {/* Donut Chart UI */}
            <div className="relative w-48 h-48 rounded-full border-[16px] border-primary-container flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[16px] border-primary border-t-transparent border-r-transparent -rotate-45" style={{ margin: '-16px' }}></div>
              <div className="text-center z-10">
                <p className="font-headline-lg text-headline-lg">{stats?.active_users || 0}</p>
                <p className="font-code-sm text-code-sm text-on-surface-variant uppercase">Total Active</p>
              </div>
            </div>
            {/* Legend */}
            <div className="w-full grid grid-cols-2 gap-sm">
              <div className="flex items-center gap-xs font-code-sm text-code-sm"><span className="w-2 h-2 bg-primary"></span> Enterprise</div>
              <div className="flex items-center gap-xs font-code-sm text-code-sm"><span className="w-2 h-2 bg-primary-container"></span> Business</div>
              <div className="flex items-center gap-xs font-code-sm text-code-sm"><span className="w-2 h-2 bg-secondary"></span> Pro</div>
              <div className="flex items-center gap-xs font-code-sm text-code-sm"><span className="w-2 h-2 bg-status-processing"></span> Starter</div>
              <div className="flex items-center gap-xs font-code-sm text-code-sm"><span className="w-2 h-2 bg-ui-divider"></span> Basic</div>
              <div className="flex items-center gap-xs font-code-sm text-code-sm"><span className="w-2 h-2 bg-surface-variant"></span> Free</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <section className="bg-surface border border-ui-divider overflow-hidden rounded-xl">
        <div className="px-lg py-md border-b border-ui-divider bg-surface-container-low flex justify-between items-center">
          <h3 className="font-label-caps text-label-caps uppercase">System Activity Log</h3>
          <button className="font-code-sm text-code-sm text-primary flex items-center gap-xs hover:underline">
            View All Logs <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </button>
        </div>
        <div className="divide-y divide-ui-divider">
          <div className="px-lg py-md flex items-center gap-lg hover:bg-surface-container-lowest transition-colors">
            <span className="font-code-sm text-code-sm text-on-surface-variant shrink-0">14:22:05</span>
            <span className="material-symbols-outlined text-status-success">check_circle</span>
            <div className="flex-1">
              <p className="font-body-md text-body-md">Admin <strong>Syamsul.H</strong> updated system pricing for <strong>Starter Plan</strong>.</p>
            </div>
            <span className="font-code-sm text-code-sm px-sm py-xs bg-surface-container border border-ui-divider uppercase rounded">Config</span>
          </div>
          <div className="px-lg py-md flex items-center gap-lg hover:bg-surface-container-lowest transition-colors">
            <span className="font-code-sm text-code-sm text-on-surface-variant shrink-0">13:45:12</span>
            <span className="material-symbols-outlined text-status-processing">info</span>
            <div className="flex-1">
              <p className="font-body-md text-body-md">Automated scale-up triggered for <strong>Server Node-B2</strong>.</p>
            </div>
            <span className="font-code-sm text-code-sm px-sm py-xs bg-surface-container border border-ui-divider uppercase rounded">System</span>
          </div>
          <div className="px-lg py-md flex items-center gap-lg hover:bg-surface-container-lowest transition-colors">
            <span className="font-code-sm text-code-sm text-on-surface-variant shrink-0">12:10:30</span>
            <span className="material-symbols-outlined text-status-success">person_add</span>
            <div className="flex-1">
              <p className="font-body-md text-body-md">New Enterprise subscription confirmed: <strong>Global Logistics Corp</strong>.</p>
            </div>
            <span className="font-code-sm text-code-sm px-sm py-xs bg-surface-container border border-ui-divider uppercase rounded">Billing</span>
          </div>
          <div className="px-lg py-md flex items-center gap-lg hover:bg-surface-container-lowest transition-colors">
            <span className="font-code-sm text-code-sm text-on-surface-variant shrink-0">11:55:01</span>
            <span className="material-symbols-outlined text-status-error">warning</span>
            <div className="flex-1">
              <p className="font-body-md text-body-md">Failed login attempt detected from <strong>IP 182.253.xx.xx</strong>.</p>
            </div>
            <span className="font-code-sm text-code-sm px-sm py-xs bg-surface-container border border-ui-divider uppercase rounded">Security</span>
          </div>
        </div>
      </section>

      {/* Footer Shell */}
      <footer className="flex justify-between items-center py-md px-lg border-t border-ui-divider bg-surface mt-auto">
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
