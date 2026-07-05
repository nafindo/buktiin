import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState('STARTER');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const pin = localStorage.getItem('admin_pin');
    if (!pin) {
      setError('No Admin PIN found. Please login.');
      setLoading(false);
      return;
    }

    try {
      const { data: result, error: rpcError } = await supabase.rpc('get_admin_users_list', { pin_code: pin });
      if (rpcError) throw rpcError;
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch users. Check PIN or permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const pin = localStorage.getItem('admin_pin');
    try {
      const { error: rpcError } = await supabase.rpc('admin_delete_user', { 
        pin_code: pin, 
        target_user_id: selectedUser.id 
      });
      if (rpcError) throw rpcError;
      setDeleteModalOpen(false);
      fetchUsers(); // Refresh
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const pin = localStorage.getItem('admin_pin');
    try {
      const { error: rpcError } = await supabase.rpc('admin_update_user_plan', { 
        pin_code: pin, 
        target_user_id: selectedUser.id,
        new_plan_name: selectedPlan
      });
      if (rpcError) throw rpcError;
      setEditModalOpen(false);
      fetchUsers(); // Refresh
    } catch (err) {
      console.error(err);
      alert('Failed to update plan.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDelete = (user: any) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setSelectedPlan(user.plan === 'No Plan' ? 'FREE' : user.plan.toUpperCase());
    setEditModalOpen(true);
  };

  if (loading && !data) {
    return (
      <div className="p-lg flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
          <p className="font-code-md text-on-surface-variant">Fetching users...</p>
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
    <div className="p-lg pb-xl space-y-lg flex flex-col min-h-[calc(100vh-64px)] max-w-container-max mx-auto w-full relative">
      {/* Modals */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-surface rounded-xl p-lg max-w-md w-full shadow-lg">
            <h3 className="font-headline-md mb-md">Confirm Deletion</h3>
            <p className="font-body-md text-on-surface-variant mb-lg">Are you sure you want to permanently delete <strong>{selectedUser?.email}</strong> and all their associated data? This action cannot be undone.</p>
            <div className="flex justify-end gap-md">
              <button onClick={() => setDeleteModalOpen(false)} disabled={actionLoading} className="px-lg py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={actionLoading} className="px-lg py-sm font-label-md bg-status-error text-white rounded hover:opacity-90 transition-opacity">
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-surface rounded-xl p-lg max-w-md w-full shadow-lg">
            <h3 className="font-headline-md mb-md">Change Subscription</h3>
            <p className="font-body-md text-on-surface-variant mb-md">Update the plan for <strong>{selectedUser?.email}</strong>.</p>
            <select 
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full bg-surface-container border border-ui-divider rounded-lg p-md mb-lg font-body-md outline-none focus:border-primary"
            >
              <option value="FREE">Free</option>
              <option value="BASIC">Basic</option>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
              <option value="BUSINESS">Business</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <div className="flex justify-end gap-md">
              <button onClick={() => setEditModalOpen(false)} disabled={actionLoading} className="px-lg py-sm font-label-md text-on-surface-variant hover:bg-surface-container rounded transition-colors">Cancel</button>
              <button onClick={handleUpdatePlan} disabled={actionLoading} className="px-lg py-sm font-label-md bg-primary text-on-primary rounded hover:opacity-90 transition-opacity">
                {actionLoading ? 'Saving...' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">User Management</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Maintain and audit system access across warehouse tiers.</p>
        </div>
        <div className="flex items-center gap-md">
          <button onClick={fetchUsers} className="flex items-center gap-sm bg-white border border-ui-divider text-on-surface px-lg py-sm rounded transition-all hover:bg-surface-container-low">
            <span className="material-symbols-outlined">refresh</span>
            <span className="font-label-caps text-label-caps">REFRESH</span>
          </button>
          <button className="flex items-center gap-sm bg-status-success text-white px-lg py-sm rounded font-bold shadow-sm transition-all hover:opacity-90">
            <span className="material-symbols-outlined">person_add</span>
            <span className="font-label-caps text-label-caps">INVITE USER</span>
          </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        <div className="bg-white border border-ui-divider p-lg rounded-xl">
          <div className="flex justify-between items-start mb-sm">
            <span className="material-symbols-outlined text-primary text-3xl">group</span>
            <span className="font-code-sm text-code-sm text-status-success">Live</span>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">TOTAL USERS</p>
          <p className="font-headline-md text-headline-md">{data?.total_users || 0}</p>
        </div>
        <div className="bg-white border border-ui-divider p-lg rounded-xl">
          <div className="flex justify-between items-start mb-sm">
            <span className="material-symbols-outlined text-status-processing text-3xl">verified</span>
            <span className="font-code-sm text-code-sm text-status-processing">Active Sub</span>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">ACTIVE SUBSCRIPTIONS</p>
          <p className="font-headline-md text-headline-md">{data?.active_users || 0}</p>
        </div>
        <div className="bg-white border border-ui-divider p-lg rounded-xl">
          <div className="flex justify-between items-start mb-sm">
            <span className="material-symbols-outlined text-status-error text-3xl">priority_high</span>
            <span className="font-code-sm text-code-sm text-status-error">Attention</span>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant">EXPIRED TODAY</p>
          <p className="font-headline-md text-headline-md">{data?.expired_today || 0}</p>
        </div>
      </div>

      {/* Table Filters */}
      <div className="bg-surface-container-low border border-ui-divider p-md flex flex-wrap items-center justify-between gap-md rounded-t-xl">
        <div className="flex items-center gap-md flex-1">
          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">filter_list</span>
            <input className="w-full bg-white border border-ui-divider rounded py-xs pl-xl pr-sm text-body-md" placeholder="Search functionality..." type="text" disabled/>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-code-sm text-code-sm text-on-surface-variant uppercase">Total {data?.users?.length || 0} entries</span>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-ui-divider overflow-hidden rounded-b-xl shadow-sm mb-xl overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
          <thead className="bg-surface-container text-on-surface-variant border-b border-ui-divider">
            <tr>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider">Name</th>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider">Email</th>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider">Plan</th>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider">Joined</th>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider">Status</th>
              <th className="py-md px-lg font-label-caps text-label-caps uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-divider">
            {data?.users && data.users.length > 0 ? (
              data.users.map((user: any) => (
                <tr key={user.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer active:bg-primary-container/10">
                  <td className="py-md px-lg">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold uppercase">
                        {user.name ? user.name.substring(0,2) : '?'}
                      </div>
                      <span className="font-body-md text-body-md font-bold text-on-surface">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-md px-lg font-code-sm text-code-sm text-on-surface-variant">{user.email}</td>
                  <td className="py-md px-lg"><span className="px-sm py-1 border border-ui-divider rounded font-code-sm text-code-sm bg-surface">{user.plan}</span></td>
                  <td className="py-md px-lg font-code-sm text-code-sm text-on-surface-variant">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="py-md px-lg">
                    <span className={`${user.status === 'ACTIVE' ? 'bg-status-success' : 'bg-status-error'} text-white font-label-caps text-xs px-sm py-1 rounded`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-md px-lg text-right">
                    <div className="flex justify-end gap-xs">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(user); }} className="p-xs text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span></button>
                      <button onClick={(e) => { e.stopPropagation(); openDelete(user); }} className="p-xs text-on-surface-variant hover:text-status-error transition-colors"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
               <tr>
                  <td colSpan={6} className="py-xl text-center text-on-surface-variant font-code-sm">No users found.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Utility Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg opacity-80 mt-auto">
        <div className="flex items-center gap-md p-lg bg-surface-container-low border-l-4 border-primary rounded">
          <span className="material-symbols-outlined text-primary text-3xl">info</span>
          <div className="font-body-md text-body-md">
            <span className="font-bold">Pro Tip:</span> Click the edit icon to change user's active subscription tier globally.
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
