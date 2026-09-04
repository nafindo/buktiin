import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Plan {
  id: string;
  name: string;
  price: number;
  storagelimit: number;
  orderlimit: number;
  retentiondays: number;
  accountlimit: number;
}

export default function PlanConfiguration() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    storagelimit: 0,
    orderlimit: 0,
    retentiondays: 0,
    accountlimit: 0
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 0,
      storagelimit: 5000,
      orderlimit: 100,
      retentiondays: 7,
      accountlimit: 1
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      storagelimit: plan.storagelimit,
      orderlimit: plan.orderlimit,
      retentiondays: plan.retentiondays,
      accountlimit: plan.accountlimit
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    
    const pin = localStorage.getItem('admin_pin');
    if (!pin) {
      setError('Admin PIN not found. Please log in again.');
      setActionLoading(false);
      return;
    }

    try {
      if (editingPlan) {
        // Update existing plan
        const { error: rpcError } = await supabase.rpc('admin_update_plan', {
          pin_code: pin,
          p_id: editingPlan.id,
          p_name: formData.name,
          p_price: formData.price,
          p_storagelimit: formData.storagelimit,
          p_orderlimit: formData.orderlimit,
          p_retentiondays: formData.retentiondays,
          p_accountlimit: formData.accountlimit
        });
        if (rpcError) throw rpcError;
      } else {
        // Add new plan
        const { error: rpcError } = await supabase.rpc('admin_add_plan', {
          pin_code: pin,
          p_name: formData.name,
          p_price: formData.price,
          p_storagelimit: formData.storagelimit,
          p_orderlimit: formData.orderlimit,
          p_retentiondays: formData.retentiondays,
          p_accountlimit: formData.accountlimit
        });
        if (rpcError) throw rpcError;
      }
      
      setIsModalOpen(false);
      fetchPlans(); // Refresh the grid
    } catch (err: any) {
      console.error(err);
      setError(`Failed to save plan: ${err.message || JSON.stringify(err)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatStorage = (mb: number) => {
    if (mb >= 10000000) return 'Custom On-Prem';
    if (mb >= 1000000) return `${mb / 1000000}TB Hybrid`;
    if (mb >= 1000) return `${mb / 1000}GB Cloud`;
    return `${mb}MB Cloud`;
  };

  const formatOrders = (orders: number) => {
    if (orders >= 10000) return 'Unlimited';
    return `${orders.toLocaleString()} / Mo`;
  };

  const formatUsers = (users: number) => {
    if (users >= 999999) return 'Custom SSO';
    if (users >= 1000) return 'Unlimited';
    return `${users} Account${users > 1 ? 's' : ''}`;
  };

  const formatRetention = (days: number) => {
    if (days >= 365 * 2) return '2 Years';
    if (days >= 365) return '1 Year';
    return `${days} Days`;
  };

  return (
    <div className="p-lg pb-xl space-y-lg flex flex-col min-h-[calc(100vh-64px)] max-w-container-max mx-auto w-full industrial-grid">
      {/* Header Section */}
      <section className="mb-xl flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Plan & Pricing Configuration</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage global service limits, storage tiers, and promotional discount cycles.</p>
        </div>
        <button onClick={openAddModal} className="bg-primary text-white font-bold px-lg py-sm flex items-center gap-sm hover:brightness-110 transition-all rounded">
          <span className="material-symbols-outlined">add_circle</span>
          [ + Add New Plan ]
        </button>
      </section>

      {/* Bento Grid of Plans */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg mb-xl">
        {loading ? (
          <div className="col-span-full py-xl text-center flex flex-col items-center">
             <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-md">progress_activity</span>
             <p className="font-code-sm text-on-surface-variant">Loading plans from Supabase...</p>
          </div>
        ) : plans.map((plan, index) => {
          const isEnterprise = plan.name === 'ENTERPRISE';
          const isPopular = plan.name === 'STARTER';

          return (
            <div 
              key={plan.id}
              className={`p-lg flex flex-col group transition-all rounded-xl relative
                ${isEnterprise ? 'bg-on-surface text-surface hover:brightness-110' : 'bg-surface hover:border-primary'}
                ${isPopular ? 'border-2 border-primary' : 'border border-ui-divider'}
              `}
            >
              {isPopular && (
                <div className="absolute -top-3 right-lg bg-primary text-white font-label-caps text-xs px-sm py-1 rounded">MOST POPULAR</div>
              )}
              
              <div className="flex justify-between items-start mb-md">
                <div>
                  <span className={`font-label-caps text-label-caps ${isEnterprise ? 'text-surface-variant' : (isPopular ? 'text-primary' : 'text-on-surface-variant')}`}>
                    Tier {index}
                  </span>
                  <h3 className="font-headline-md text-headline-md font-bold uppercase">{plan.name}</h3>
                </div>
                <button onClick={() => openEditModal(plan)} className={`font-label-caps px-sm py-xs transition-colors rounded
                  ${isEnterprise ? 'text-surface border border-surface hover:bg-surface hover:text-on-surface' : 'text-on-surface border border-on-surface hover:bg-on-surface hover:text-surface'}
                `}>[ Edit ]</button>
              </div>

              <div className="space-y-sm mb-lg">
                <div className={`flex justify-between border-b pb-xs ${isEnterprise ? 'border-surface-variant/30' : 'border-ui-divider'}`}>
                  <span className={`font-body-md ${isEnterprise ? 'text-surface-variant' : 'text-on-surface-variant'}`}>Storage</span>
                  <span className={`font-code-sm font-bold ${isEnterprise ? 'text-surface' : 'text-on-surface'}`}>
                    {formatStorage(plan.storagelimit)}
                  </span>
                </div>
                <div className={`flex justify-between border-b pb-xs ${isEnterprise ? 'border-surface-variant/30' : 'border-ui-divider'}`}>
                  <span className={`font-body-md ${isEnterprise ? 'text-surface-variant' : 'text-on-surface-variant'}`}>Orders</span>
                  <span className={`font-code-sm font-bold ${isEnterprise ? 'text-surface' : 'text-on-surface'}`}>
                    {formatOrders(plan.orderlimit)}
                  </span>
                </div>
                <div className={`flex justify-between border-b pb-xs ${isEnterprise ? 'border-surface-variant/30' : 'border-ui-divider'}`}>
                  <span className={`font-body-md ${isEnterprise ? 'text-surface-variant' : 'text-on-surface-variant'}`}>Users</span>
                  <span className={`font-code-sm font-bold ${isEnterprise ? 'text-surface' : 'text-on-surface'}`}>
                    {formatUsers(plan.accountlimit)}
                  </span>
                </div>
                <div className={`flex justify-between border-b pb-xs ${isEnterprise ? 'border-surface-variant/30' : 'border-ui-divider'}`}>
                  <span className={`font-body-md ${isEnterprise ? 'text-surface-variant' : 'text-on-surface-variant'}`}>Retention</span>
                  <span className={`font-code-sm font-bold ${isEnterprise ? 'text-surface' : 'text-on-surface'}`}>
                    {formatRetention(plan.retentiondays)}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-md flex items-center gap-sm">
                <span className={`w-2 h-2 rounded-full ${isEnterprise ? 'bg-primary-fixed' : 'bg-status-success'}`}></span>
                <span className={`font-label-caps text-sm ${isEnterprise ? 'text-primary-fixed' : 'text-status-success'}`}>
                  {isEnterprise ? 'Custom Quota' : 'Active Deployment'}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Promo & Discount Codes Section */}
      <section className="bg-surface border border-ui-divider overflow-hidden rounded-xl">
        <div className="px-lg py-md border-b border-ui-divider bg-surface-container-low flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md font-bold">Promo & Discount Codes</h3>
          <button className="border border-on-surface font-label-caps px-md py-xs flex items-center gap-sm hover:bg-on-surface hover:text-white transition-all rounded">
            <span className="material-symbols-outlined">local_offer</span>
            [ + Add Promo ]
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container font-label-caps text-sm border-b border-ui-divider">
                <th className="px-lg py-md">Promo Code</th>
                <th className="px-lg py-md">Discount</th>
                <th className="px-lg py-md">Min Purchase</th>
                <th className="px-lg py-md">Validity</th>
                <th className="px-lg py-md">Status</th>
                <th className="px-lg py-md">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-divider">
              <tr className="hover:bg-surface-container-low transition-colors">
                <td colSpan={6} className="px-lg py-xl text-center font-code-sm text-on-surface-variant">
                  Promo feature is currently disabled. Coming soon.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer Anchor */}
      <footer className="flex justify-between items-center py-md px-lg border-t border-ui-divider bg-surface mt-auto">
        <div className="flex gap-md">
          <a className="font-code-sm text-code-sm uppercase tracking-wider text-on-surface-variant hover:text-primary" href="#">Privacy Policy</a>
          <a className="font-code-sm text-code-sm uppercase tracking-wider text-on-surface-variant hover:text-primary" href="#">Terms of Service</a>
          <span className="font-code-sm text-code-sm uppercase tracking-wider text-on-surface-variant">v1.2.4</span>
        </div>
        <div className="font-code-sm text-code-sm font-bold text-on-surface uppercase">
          Developed by Nafindo Group
        </div>
      </footer>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-ui-divider">
            <div className="px-lg py-md border-b border-ui-divider bg-surface-container-low flex justify-between items-center">
              <h3 className="font-headline-md font-bold text-on-surface">
                {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Add New Plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-lg space-y-md">
              {error && (
                <div className="bg-error-container text-on-error-container p-sm rounded font-body-sm mb-md">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block font-label-md text-on-surface mb-xs">Plan Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface-container-low border border-ui-divider rounded px-md py-sm font-body-md text-on-surface focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Price (IDR)</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                    className="w-full bg-surface-container-low border border-ui-divider rounded px-md py-sm font-body-md text-on-surface focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Storage Limit (MB)</label>
                  <input 
                    type="number" 
                    value={formData.storagelimit}
                    onChange={(e) => setFormData({...formData, storagelimit: parseInt(e.target.value) || 0})}
                    className="w-full bg-surface-container-low border border-ui-divider rounded px-md py-sm font-body-md text-on-surface focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Order Limit / Mo</label>
                  <input 
                    type="number" 
                    value={formData.orderlimit}
                    onChange={(e) => setFormData({...formData, orderlimit: parseInt(e.target.value) || 0})}
                    className="w-full bg-surface-container-low border border-ui-divider rounded px-md py-sm font-body-md text-on-surface focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Retention Days</label>
                  <input 
                    type="number" 
                    value={formData.retentiondays}
                    onChange={(e) => setFormData({...formData, retentiondays: parseInt(e.target.value) || 0})}
                    className="w-full bg-surface-container-low border border-ui-divider rounded px-md py-sm font-body-md text-on-surface focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-md text-on-surface mb-xs">Account / User Limit</label>
                <input 
                  type="number" 
                  value={formData.accountlimit}
                  onChange={(e) => setFormData({...formData, accountlimit: parseInt(e.target.value) || 0})}
                  className="w-full bg-surface-container-low border border-ui-divider rounded px-md py-sm font-body-md text-on-surface focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="pt-md flex justify-end gap-sm border-t border-ui-divider mt-lg">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-lg py-sm font-label-md text-on-surface hover:bg-surface-container-low rounded transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="px-lg py-sm font-label-md bg-primary text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50">
                  {actionLoading ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
