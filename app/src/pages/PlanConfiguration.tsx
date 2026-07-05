export default function PlanConfiguration() {
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
        {/* Free Plan */}
        <div className="bg-surface border border-ui-divider p-lg flex flex-col group hover:border-primary transition-all rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Tier 0</span>
              <h3 className="font-headline-md text-headline-md font-bold">Free</h3>
            </div>
            <button className="font-label-caps text-on-surface border border-on-surface px-sm py-xs hover:bg-on-surface hover:text-surface transition-colors rounded">[ Edit ]</button>
          </div>
          <div className="space-y-sm mb-lg">
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Storage</span>
              <span className="font-code-sm font-bold text-on-surface">5GB Cloud</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Orders</span>
              <span className="font-code-sm font-bold text-on-surface">100 / Mo</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Users</span>
              <span className="font-code-sm font-bold text-on-surface">1 Account</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Retention</span>
              <span className="font-code-sm font-bold text-on-surface">7 Days</span>
            </div>
          </div>
          <div className="mt-auto pt-md flex items-center gap-sm">
            <span className="w-2 h-2 bg-status-success rounded-full"></span>
            <span className="font-label-caps text-sm text-status-success">Active Deployment</span>
          </div>
        </div>

        {/* Basic Plan */}
        <div className="bg-surface border border-ui-divider p-lg flex flex-col group hover:border-primary transition-all rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Tier 1</span>
              <h3 className="font-headline-md text-headline-md font-bold">Basic</h3>
            </div>
            <button className="font-label-caps text-on-surface border border-on-surface px-sm py-xs hover:bg-on-surface hover:text-surface transition-colors rounded">[ Edit ]</button>
          </div>
          <div className="space-y-sm mb-lg">
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Storage</span>
              <span className="font-code-sm font-bold text-on-surface">50GB Cloud</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Orders</span>
              <span className="font-code-sm font-bold text-on-surface">1,000 / Mo</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Users</span>
              <span className="font-code-sm font-bold text-on-surface">3 Accounts</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Retention</span>
              <span className="font-code-sm font-bold text-on-surface">30 Days</span>
            </div>
          </div>
          <div className="mt-auto pt-md flex items-center gap-sm">
            <span className="w-2 h-2 bg-status-success rounded-full"></span>
            <span className="font-label-caps text-sm text-status-success">Active Deployment</span>
          </div>
        </div>

        {/* Starter Plan */}
        <div className="bg-surface border-2 border-primary p-lg flex flex-col group transition-all relative rounded-xl">
          <div className="absolute -top-3 right-lg bg-primary text-white font-label-caps text-xs px-sm py-1 rounded">MOST POPULAR</div>
          <div className="flex justify-between items-start mb-md">
            <div>
              <span className="font-label-caps text-label-caps text-primary">Tier 2</span>
              <h3 className="font-headline-md text-headline-md font-bold">Starter</h3>
            </div>
            <button className="font-label-caps text-on-surface border border-on-surface px-sm py-xs hover:bg-on-surface hover:text-white transition-colors rounded">[ Edit ]</button>
          </div>
          <div className="space-y-sm mb-lg">
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Storage</span>
              <span className="font-code-sm font-bold text-on-surface">250GB Cloud</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Orders</span>
              <span className="font-code-sm font-bold text-on-surface">5,000 / Mo</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Users</span>
              <span className="font-code-sm font-bold text-on-surface">10 Accounts</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Retention</span>
              <span className="font-code-sm font-bold text-on-surface">90 Days</span>
            </div>
          </div>
          <div className="mt-auto pt-md flex items-center gap-sm">
            <span className="w-2 h-2 bg-status-success rounded-full"></span>
            <span className="font-label-caps text-sm text-status-success">Active Deployment</span>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-surface border border-ui-divider p-lg flex flex-col group hover:border-primary transition-all rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Tier 3</span>
              <h3 className="font-headline-md text-headline-md font-bold">Pro</h3>
            </div>
            <button className="font-label-caps text-on-surface border border-on-surface px-sm py-xs hover:bg-on-surface hover:text-white transition-colors rounded">[ Edit ]</button>
          </div>
          <div className="space-y-sm mb-lg">
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Storage</span>
              <span className="font-code-sm font-bold text-on-surface">1TB Hybrid</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Orders</span>
              <span className="font-code-sm font-bold text-on-surface">25,000 / Mo</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Users</span>
              <span className="font-code-sm font-bold text-on-surface">50 Accounts</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Retention</span>
              <span className="font-code-sm font-bold text-on-surface">1 Year</span>
            </div>
          </div>
          <div className="mt-auto pt-md flex items-center gap-sm">
            <span className="w-2 h-2 bg-status-success rounded-full"></span>
            <span className="font-label-caps text-sm text-status-success">Active Deployment</span>
          </div>
        </div>

        {/* Business Plan */}
        <div className="bg-surface border border-ui-divider p-lg flex flex-col group hover:border-primary transition-all rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Tier 4</span>
              <h3 className="font-headline-md text-headline-md font-bold">Business</h3>
            </div>
            <button className="font-label-caps text-on-surface border border-on-surface px-sm py-xs hover:bg-on-surface hover:text-white transition-colors rounded">[ Edit ]</button>
          </div>
          <div className="space-y-sm mb-lg">
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Storage</span>
              <span className="font-code-sm font-bold text-on-surface">5TB Hybrid</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Orders</span>
              <span className="font-code-sm font-bold text-on-surface">100,000 / Mo</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Users</span>
              <span className="font-code-sm font-bold text-on-surface">Unlimited</span>
            </div>
            <div className="flex justify-between border-b border-ui-divider pb-xs">
              <span className="font-body-md text-on-surface-variant">Retention</span>
              <span className="font-code-sm font-bold text-on-surface">2 Years</span>
            </div>
          </div>
          <div className="mt-auto pt-md flex items-center gap-sm">
            <span className="w-2 h-2 bg-status-success rounded-full"></span>
            <span className="font-label-caps text-sm text-status-success">Active Deployment</span>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-on-surface text-surface p-lg flex flex-col group hover:brightness-110 transition-all rounded-xl">
          <div className="flex justify-between items-start mb-md">
            <div>
              <span className="font-label-caps text-label-caps text-surface-variant">Tier 5</span>
              <h3 className="font-headline-md text-headline-md font-bold">Enterprise</h3>
            </div>
            <button className="font-label-caps text-surface border border-surface px-sm py-xs hover:bg-surface hover:text-on-surface transition-colors rounded">[ Edit ]</button>
          </div>
          <div className="space-y-sm mb-lg">
            <div className="flex justify-between border-b border-surface-variant/30 pb-xs">
              <span className="font-body-md text-surface-variant">Storage</span>
              <span className="font-code-sm font-bold text-surface">Custom On-Prem</span>
            </div>
            <div className="flex justify-between border-b border-surface-variant/30 pb-xs">
              <span className="font-body-md text-surface-variant">Orders</span>
              <span className="font-code-sm font-bold text-surface">Unlimited</span>
            </div>
            <div className="flex justify-between border-b border-surface-variant/30 pb-xs">
              <span className="font-body-md text-surface-variant">Users</span>
              <span className="font-code-sm font-bold text-surface">Custom SSO</span>
            </div>
            <div className="flex justify-between border-b border-surface-variant/30 pb-xs">
              <span className="font-body-md text-surface-variant">Retention</span>
              <span className="font-code-sm font-bold text-surface">Indefinite</span>
            </div>
          </div>
          <div className="mt-auto pt-md flex items-center gap-sm">
            <span className="w-2 h-2 bg-primary-fixed rounded-full"></span>
            <span className="font-label-caps text-sm text-primary-fixed">Custom Quota</span>
          </div>
        </div>
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
              {/* Promo Row 1 */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-lg py-md font-code-sm font-bold">MERDEKA78</td>
                <td className="px-lg py-md font-body-md">15% Off</td>
                <td className="px-lg py-md font-body-md">IDR 2,500,000</td>
                <td className="px-lg py-md font-code-sm text-sm">31 Aug 2024</td>
                <td className="px-lg py-md">
                  <span className="bg-status-success text-white font-label-caps text-xs px-sm py-1 rounded">Selesai</span>
                </td>
                <td className="px-lg py-md font-code-sm">
                  <button className="hover:text-primary">[ Edit ]</button>
                  <button className="hover:text-status-error ml-md">[ Kill ]</button>
                </td>
              </tr>
              {/* Promo Row 2 */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-lg py-md font-code-sm font-bold">GAULPACK</td>
                <td className="px-lg py-md font-body-md">IDR 500k Flat</td>
                <td className="px-lg py-md font-body-md">IDR 5,000,000</td>
                <td className="px-lg py-md font-code-sm text-sm">31 Dec 2024</td>
                <td className="px-lg py-md">
                  <span className="bg-status-processing text-white font-label-caps text-xs px-sm py-1 rounded">Proses</span>
                </td>
                <td className="px-lg py-md font-code-sm">
                  <button className="hover:text-primary">[ Edit ]</button>
                  <button className="hover:text-status-error ml-md">[ Kill ]</button>
                </td>
              </tr>
              {/* Promo Row 3 */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-lg py-md font-code-sm font-bold">EARLYADOPTER</td>
                <td className="px-lg py-md font-body-md">50% Lifetime</td>
                <td className="px-lg py-md font-body-md">IDR 0</td>
                <td className="px-lg py-md font-code-sm text-sm">N/A</td>
                <td className="px-lg py-md">
                  <span className="bg-status-error text-white font-label-caps text-xs px-sm py-1 rounded">Gagal</span>
                </td>
                <td className="px-lg py-md font-code-sm">
                  <button className="hover:text-primary">[ Edit ]</button>
                  <button className="hover:text-status-error ml-md">[ Kill ]</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-lg py-sm bg-surface-container-low flex justify-end">
          <span className="font-code-sm text-xs text-on-surface-variant">Showing 3 of 12 promo codes</span>
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
