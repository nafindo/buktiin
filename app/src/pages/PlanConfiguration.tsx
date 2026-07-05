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
        <button className="bg-primary text-white font-bold px-lg py-sm flex items-center gap-sm hover:brightness-110 transition-all rounded">
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
                <button className={`font-label-caps px-sm py-xs transition-colors rounded
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
    </div>
  );
}
