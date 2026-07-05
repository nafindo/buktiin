import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Recording {
  id: string;
  resi: string;
  created_at: string;
  video_size: number;
  storage_node: string;
}

interface ClusterStat {
  node_name: string;
  total_size_bytes: number;
  tenant_count: number;
}

export default function ClusterStorageManagement() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [clusterStats, setClusterStats] = useState<ClusterStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const pin = localStorage.getItem('admin_pin');
    
    if (!pin) {
      setError('Admin PIN not found');
      setLoading(false);
      return;
    }

    try {
      // Fetch Stats
      const { data: statsData, error: statsError } = await supabase.rpc('admin_get_cluster_stats', {
        pin_code: pin
      });
      if (statsError) throw statsError;
      
      // Fetch Recordings
      const { data: recsData, error: recsError } = await supabase.rpc('admin_get_recordings', {
        pin_code: pin,
        limit_num: 20
      });
      if (recsError) throw recsError;

      setClusterStats(statsData || []);
      setRecordings(recsData || []);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to fetch storage data: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, resi: string) => {
    if (!confirm(`Are you sure you want to permanently delete recording ${resi}? This action cannot be undone.`)) return;
    
    const pin = localStorage.getItem('admin_pin');
    try {
      const { error } = await supabase.rpc('admin_delete_recording', {
        pin_code: pin,
        p_id: id
      });
      if (error) throw error;
      
      // Refresh
      fetchData();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Helper to find specific node stats or default
  const getNodeStat = (nodeName: string) => {
    const stat = clusterStats.find(s => s.node_name === nodeName);
    return stat || { total_size_bytes: 0, tenant_count: 0 };
  };

  const node1 = getNodeStat('GEMINI_01');
  const node2 = getNodeStat('GEMINI_02');
  
  // Assuming 5TB capacity per node
  const capacityBytes = 5 * 1024 * 1024 * 1024 * 1024;
  const node1Usage = ((node1.total_size_bytes / capacityBytes) * 100).toFixed(2);
  const node2Usage = ((node2.total_size_bytes / capacityBytes) * 100).toFixed(2);

  return (
    <div className="p-lg pb-xl space-y-lg flex flex-col min-h-[calc(100vh-64px)] w-full max-w-container-max mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Cluster Storage Management</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Monitor nodes, load balancing, and automated migrations with real-time Supabase integration.</p>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-md rounded-lg font-body-md flex items-center gap-sm">
          <span className="material-symbols-outlined">warning</span>
          {error}
        </div>
      )}
      
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
              <p className="font-code-sm text-code-sm text-on-surface-variant">
                {loading ? '...' : node1.tenant_count} Active Tenants Assigned
              </p>
              <div className="mt-sm flex items-center gap-lg">
                <span className="font-label-caps text-[12px] font-bold">5 TB CAPACITY</span>
                <span className="font-code-sm text-[12px] text-on-surface-variant">
                  {loading ? '...' : `${node1Usage}% Used (${formatSize(node1.total_size_bytes)})`}
                </span>
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
              <p className="font-code-sm text-code-sm text-on-surface-variant">
                {loading ? '...' : node2.tenant_count} Active Tenants Assigned
              </p>
              <div className="mt-sm flex items-center gap-lg">
                <span className="font-label-caps text-[12px] font-bold">5 TB CAPACITY</span>
                <span className="font-code-sm text-[12px] text-on-surface-variant">
                  {loading ? '...' : `${node2Usage}% Used (${formatSize(node2.total_size_bytes)})`}
                </span>
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
              <p className="font-code-sm text-[11px] text-on-surface-variant">Distributing data automatically based on UUID hash</p>
            </div>
          </div>
          <div className="bg-primary-container/10 border border-primary/20 p-md rounded flex items-center gap-md">
            <span className="material-symbols-outlined text-status-success">check_circle</span>
            <div>
              <p className="font-label-caps text-[12px] font-bold text-on-surface">CLUSTER STATUS</p>
              <p className="font-code-sm text-[11px] text-on-surface-variant">RPC Integrations Active. Syncing with Supabase `recordings`.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-lg">
          <h3 className="font-label-caps text-label-caps text-on-surface font-bold uppercase tracking-widest">Recent Evidence Activity</h3>
          <button onClick={fetchData} className="text-primary hover:underline font-label-caps flex items-center gap-xs">
            <span className="material-symbols-outlined text-sm">refresh</span> Refresh
          </button>
        </div>

        <div className="bg-surface-container-lowest border border-ui-divider rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant">
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Recording RESI</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Timestamp</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Size</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Storage Node</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-lg py-xl text-center">
                      <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-md">progress_activity</span>
                      <p className="font-code-sm text-on-surface-variant">Fetching recordings...</p>
                    </td>
                  </tr>
                ) : recordings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-lg py-xl text-center font-code-sm text-on-surface-variant">
                      No recordings found in the cluster.
                    </td>
                  </tr>
                ) : (
                  recordings.map((rec) => (
                    <tr key={rec.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-md border-b border-ui-divider font-code-sm font-bold text-on-surface">{rec.resi || 'UNKNOWN'}</td>
                      <td className="px-lg py-md border-b border-ui-divider font-code-sm text-on-surface-variant">{formatDate(rec.created_at)}</td>
                      <td className="px-lg py-md border-b border-ui-divider font-code-sm">{formatSize(rec.video_size)}</td>
                      <td className="px-lg py-md border-b border-ui-divider">
                        <span className={`font-label-caps px-2 py-1 rounded text-[10px] ${rec.storage_node === 'GEMINI_01' ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface'}`}>
                          {rec.storage_node}
                        </span>
                      </td>
                      <td className="px-lg py-md border-b border-ui-divider text-right">
                        <button 
                          onClick={() => handleDelete(rec.id, rec.resi)}
                          className="font-code-sm text-code-sm text-on-surface-variant hover:text-status-error border border-transparent hover:border-status-error px-sm py-xs rounded transition-all"
                        >
                          [ DELETE ]
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="flex flex-col md:flex-row justify-between items-center w-full pt-md border-t border-ui-divider bg-surface mt-auto">
        <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 md:mb-0">© 2026 Nafindo Group. All Rights Reserved.</span>
        <div className="flex items-center gap-md">
          <span className="font-code-sm text-code-sm text-on-surface-variant">BUKTIIN v2.4.0-build.89</span>
          <span className="font-code-sm text-code-sm text-on-surface-variant font-bold">Developed by Nafindo Group</span>
        </div>
      </footer>
    </div>
  );
}
