import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface StorageNode {
  id: string;
  name: string;
  folder_id: string;
  is_active: boolean;
  tenant_count: number;
  allocated_quota_mb: number;
  real_usage_bytes: number;
}

interface TenantAllocation {
  user_id: string;
  email: string;
  plan_name: string;
  node_id: string;
  node_name: string;
  folder_id: string;
}

export default function ClusterStorageManagement() {
  const [nodes, setNodes] = useState<StorageNode[]>([]);
  const [tenants, setTenants] = useState<TenantAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isMigrateOpen, setIsMigrateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [newNodeForm, setNewNodeForm] = useState({ name: '', folder_id: '' });
  const [migrateForm, setMigrateForm] = useState({ user_id: '', email: '', target_node_id: '' });

  // 5TB Max Capacity in Bytes & MB
  const MAX_CAPACITY_TB = 5;
  const MAX_CAPACITY_MB = MAX_CAPACITY_TB * 1024 * 1024;
  const MAX_CAPACITY_BYTES = MAX_CAPACITY_MB * 1024 * 1024;

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
      // Fetch Nodes
      const { data: nodesData, error: nodesError } = await supabase.rpc('admin_get_storage_nodes', { pin_code: pin });
      if (nodesError) throw nodesError;
      
      // Fetch Tenant Allocations
      const { data: tenantsData, error: tenantsError } = await supabase.rpc('admin_get_tenant_allocations', { pin_code: pin });
      if (tenantsError) throw tenantsError;

      // Type cast or default new fields in case the SQL hasn't been updated yet by the user
      const safeNodes = (nodesData || []).map((n: any) => ({
        ...n,
        allocated_quota_mb: Number(n.allocated_quota_mb || 0),
        real_usage_bytes: Number(n.real_usage_bytes || 0)
      }));

      setNodes(safeNodes);
      setTenants(tenantsData || []);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to fetch data: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const pin = localStorage.getItem('admin_pin');
    
    try {
      const { error } = await supabase.rpc('admin_add_storage_node', {
        pin_code: pin,
        p_name: newNodeForm.name,
        p_folder_id: newNodeForm.folder_id
      });
      if (error) throw error;
      
      setIsAddNodeOpen(false);
      setNewNodeForm({ name: '', folder_id: '' });
      fetchData();
    } catch (err: any) {
      alert(`Failed to add server: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const openMigrateModal = (tenant: TenantAllocation) => {
    setMigrateForm({
      user_id: tenant.user_id,
      email: tenant.email,
      target_node_id: tenant.node_id || ''
    });
    setIsMigrateOpen(true);
  };

  const handleMigrate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    // Instead of simple SQL update, we call our backend API to actually move files
    try {
      const token = localStorage.getItem('access_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const res = await fetch(`${API_URL}/api/admin/migrate-server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: migrateForm.user_id,
          targetNodeId: migrateForm.target_node_id,
          pinCode: localStorage.getItem('admin_pin')
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Migration failed');
      
      setIsMigrateOpen(false);
      alert('Migration successful! Files moved instantly via Google Drive API.');
      fetchData();
    } catch (err: any) {
      alert(`Migration failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssignment = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove the server assignment for ${email}?`)) return;
    
    const pin = localStorage.getItem('admin_pin');
    try {
      // Deleting assignment is just migrating to NULL node
      const { error } = await supabase.rpc('admin_migrate_tenant_server', {
        pin_code: pin,
        p_user_id: userId,
        p_node_id: null
      });
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Failed to delete assignment: ${err.message}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-lg pb-xl space-y-lg flex flex-col min-h-[calc(100vh-64px)] w-full max-w-container-max mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Cluster Storage Management</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage Google Drive Servers and allocate tenants dynamically.</p>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-md rounded-lg font-body-md flex items-center gap-sm">
          <span className="material-symbols-outlined">warning</span>
          {error}
        </div>
      )}
      
      {/* Google Drive Servers Grid */}
      <div className="space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          
          {nodes.map((node) => {
            const quotaPercent = Math.min(100, (node.allocated_quota_mb / MAX_CAPACITY_MB) * 100).toFixed(2);
            const realPercent = Math.min(100, (node.real_usage_bytes / MAX_CAPACITY_BYTES) * 100).toFixed(2);

            return (
              <div key={node.id} className="group relative overflow-hidden bg-surface-container-lowest border border-ui-divider hover:border-primary rounded-lg p-lg flex flex-col gap-md shadow-sm transition-all">
                <div className="flex items-start gap-md">
                  <div className="w-12 h-12 bg-primary-container/20 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-xs">
                      <h4 className="font-headline-sm text-[16px] font-bold truncate" title={node.name}>{node.name}</h4>
                      {node.is_active && (
                        <span className="bg-status-success text-white px-2 py-[2px] rounded font-code-sm text-[10px] shrink-0">ACTIVE</span>
                      )}
                    </div>
                    <a 
                      href={`https://drive.google.com/drive/u/0/folders/${node.folder_id}`} 
                      target="_blank" rel="noreferrer"
                      className="font-code-sm text-[11px] text-primary hover:underline truncate block"
                      title={node.folder_id}
                    >
                      ID: {node.folder_id}
                    </a>
                  </div>
                </div>

                <div className="space-y-sm mt-xs">
                  {/* Indicator 1: Allocated Quota */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">ALLOCATED QUOTA</span>
                      <span className="font-code-sm text-[10px] text-on-surface-variant">{formatSize(node.allocated_quota_mb * 1024 * 1024)} / 5 TB</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${quotaPercent}%` }}></div>
                    </div>
                  </div>

                  {/* Indicator 2: Real Usage */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">REAL USAGE (VIDEOS)</span>
                      <span className="font-code-sm text-[10px] text-on-surface-variant">{formatSize(node.real_usage_bytes)} / 5 TB</span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                      <div className="bg-status-processing h-full rounded-full" style={{ width: `${realPercent}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-sm border-t border-ui-divider flex justify-between items-center">
                  <span className="font-code-sm text-[12px] text-on-surface-variant">
                    <strong className="text-on-surface">{node.tenant_count || 0}</strong> Tenants Assigned
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Add New Node Button */}
          <div 
            onClick={() => setIsAddNodeOpen(true)}
            className="border-2 border-dashed border-ui-divider rounded-lg p-lg flex flex-col items-center justify-center text-center hover:border-primary hover:bg-surface-container transition-all group cursor-pointer min-h-[140px]"
          >
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary mb-2 transition-colors">add_to_drive</span>
            <p className="font-label-caps text-label-caps text-on-surface-variant group-hover:text-primary">Add New Storage Node</p>
            <p className="font-code-sm text-[11px] text-on-surface-variant mt-1">Link a new Google Drive Folder</p>
          </div>
        </div>
      </div>

      {/* Tenant Allocations Table */}
      <div className="space-y-md flex-1">
        <div className="flex justify-between items-center mt-lg">
          <h3 className="font-label-caps text-label-caps text-on-surface font-bold uppercase tracking-widest">Tenant Allocations</h3>
          <button onClick={fetchData} className="text-primary hover:underline font-label-caps flex items-center gap-xs">
            <span className="material-symbols-outlined text-sm">refresh</span> Refresh
          </button>
        </div>

        <div className="bg-surface-container-lowest border border-ui-divider rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant">
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Account Email</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Active Plan</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider">Storage Server</th>
                  <th className="px-lg py-md font-label-caps text-label-caps border-b border-ui-divider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-lg py-xl text-center">
                      <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-md">progress_activity</span>
                      <p className="font-code-sm text-on-surface-variant">Loading tenants...</p>
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-lg py-xl text-center font-code-sm text-on-surface-variant">
                      No tenants found.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.user_id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-md border-b border-ui-divider font-code-sm font-bold text-on-surface">{t.email}</td>
                      <td className="px-lg py-md border-b border-ui-divider font-label-caps text-xs">
                        <span className="bg-surface-container-high px-2 py-1 rounded">{t.plan_name || 'NO PLAN'}</span>
                      </td>
                      <td className="px-lg py-md border-b border-ui-divider">
                        {t.node_id ? (
                          <div>
                            <p className="font-bold text-sm text-on-surface">{t.node_name}</p>
                            <a 
                              href={`https://drive.google.com/drive/u/0/folders/${t.folder_id}`} 
                              target="_blank" rel="noreferrer"
                              className="font-code-sm text-[10px] text-primary hover:underline flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px]">link</span> {t.folder_id}
                            </a>
                          </div>
                        ) : (
                          <span className="text-status-error font-code-sm text-[11px] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-lg py-md border-b border-ui-divider text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => openMigrateModal(t)}
                          className="font-code-sm text-code-sm text-primary hover:bg-primary/10 border border-primary px-sm py-xs rounded transition-all"
                        >
                          [ MIGRATE ]
                        </button>
                        <button 
                          onClick={() => handleDeleteAssignment(t.user_id, t.email)}
                          disabled={!t.node_id}
                          className="font-code-sm text-code-sm text-status-error hover:bg-status-error/10 border border-status-error px-sm py-xs rounded transition-all disabled:opacity-30"
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
          <span className="font-code-sm text-code-sm text-on-surface-variant">BUKTIIN v2.5.0-drive.1</span>
          <span className="font-code-sm text-code-sm text-on-surface-variant font-bold">Developed by Nafindo Group</span>
        </div>
      </footer>

      {/* Add Node Modal */}
      {isAddNodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-ui-divider">
            <div className="px-lg py-md border-b border-ui-divider bg-surface-container-low flex justify-between items-center">
              <h3 className="font-headline-md font-bold text-on-surface">Add Storage Server</h3>
              <button onClick={() => setIsAddNodeOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddNode} className="p-lg space-y-md">
              <div>
                <label className="block font-label-md text-on-surface mb-xs">Server Name</label>
                <input 
                  type="text" 
                  value={newNodeForm.name}
                  onChange={(e) => setNewNodeForm({...newNodeForm, name: e.target.value})}
                  placeholder="e.g. Google Drive VIP"
                  className="w-full bg-surface-container-low border border-ui-divider rounded px-md py-sm font-body-md text-on-surface focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-label-md text-on-surface mb-xs">Google Drive Folder ID</label>
                <input 
                  type="text" 
                  value={newNodeForm.folder_id}
                  onChange={(e) => setNewNodeForm({...newNodeForm, folder_id: e.target.value})}
                  placeholder="e.g. 1RzzoTN6TAWdjzchTclguya..."
                  className="w-full bg-surface-container-low border border-ui-divider rounded px-md py-sm font-code-sm text-on-surface focus:border-primary outline-none"
                  required
                />
              </div>
              <div className="pt-md flex justify-end gap-sm border-t border-ui-divider mt-lg">
                <button type="button" onClick={() => setIsAddNodeOpen(false)} className="px-lg py-sm font-label-md text-on-surface hover:bg-surface-container-low rounded">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-lg py-sm font-label-md bg-primary text-white rounded hover:opacity-90 disabled:opacity-50">
                  {actionLoading ? 'Saving...' : 'Save Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Migrate Modal */}
      {isMigrateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-ui-divider">
            <div className="px-lg py-md border-b border-ui-divider bg-surface-container-low flex justify-between items-center">
              <h3 className="font-headline-md font-bold text-on-surface">Migrate Tenant Server</h3>
              <button onClick={() => setIsMigrateOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleMigrate} className="p-lg space-y-md">
              <div>
                <label className="block font-label-md text-on-surface mb-xs">Tenant Account</label>
                <div className="w-full bg-surface-container-lowest border border-ui-divider rounded px-md py-sm font-code-sm text-on-surface-variant opacity-70">
                  {migrateForm.email}
                </div>
              </div>
              <div>
                <label className="block font-label-md text-on-surface mb-xs">Target Storage Server</label>
                <select 
                  value={migrateForm.target_node_id}
                  onChange={(e) => setMigrateForm({...migrateForm, target_node_id: e.target.value})}
                  className="w-full bg-surface-container-low border border-ui-divider rounded px-md py-sm font-body-md text-on-surface focus:border-primary outline-none"
                  required
                >
                  <option value="" disabled>-- Select a server --</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} (ID: {n.folder_id})</option>
                  ))}
                </select>
                <p className="font-code-sm text-[11px] text-on-surface-variant mt-2">
                  Notice: This only redirects future uploads to the new server. Existing files remain in the old drive unless manually moved.
                </p>
              </div>
              <div className="pt-md flex justify-end gap-sm border-t border-ui-divider mt-lg">
                <button type="button" onClick={() => setIsMigrateOpen(false)} className="px-lg py-sm font-label-md text-on-surface hover:bg-surface-container-low rounded">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-lg py-sm font-label-md bg-primary text-white rounded hover:opacity-90 disabled:opacity-50">
                  {actionLoading ? 'Migrating...' : 'Confirm Migration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
