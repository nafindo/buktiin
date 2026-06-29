import { useState } from 'react';

export default function SelectPlan() {
  const [isAnnual, setIsAnnual] = useState(false);

  const toggleBilling = () => {
    setIsAnnual(!isAnnual);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* TopNavBar is handled by layout if applicable, or we just render the content below */}
      
      <main className="flex-grow container mx-auto px-lg py-xl max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-xl">
          <h1 className="font-headline-lg text-headline-lg mb-sm">Upgrade Your Evidence System</h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto mb-md">
            Scale your packing station security with automated video recording and cloud storage designed for modern e-commerce teams.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-md mt-md">
            <span className={`font-label-caps text-label-caps ${!isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`} id="monthly-label">Monthly</span>
            <button 
              className="relative w-14 h-7 bg-surface-container-highest rounded-full p-1 focus:outline-none transition-colors" 
              onClick={toggleBilling}
            >
              <div className={`w-5 h-5 bg-primary rounded-full transition-transform transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
            <span className={`font-label-caps text-label-caps ${isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`} id="annual-label">
              Annual <span className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full ml-1">SAVE 17%</span>
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md items-stretch">
          
          {/* Basic Tier */}
          <div className="pricing-card flex flex-col bg-surface border border-ui-divider p-md rounded-xl relative overflow-hidden hover:-translate-y-1 transition-transform duration-200">
            <div className="mb-md">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-xs">BASIC</h3>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-md text-headline-md">Rp</span>
                <span className="font-headline-lg text-headline-lg transition-transform duration-200">
                  {isAnnual ? '40k' : '49k'}
                </span>
                <span className="text-on-surface-variant font-code-sm text-code-sm">/mo</span>
              </div>
              <p className="text-[12px] text-on-surface-variant mt-xs">For solo sellers.</p>
            </div>
            <div className="flex-grow space-y-md border-t border-ui-divider pt-md">
              <ul className="space-y-sm">
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>20GB Storage</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>50 Orders/day</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>1 User Access</span>
                </li>
              </ul>
            </div>
            <button className="mt-xl w-full py-md border border-on-surface text-on-surface font-bold hover:bg-surface-container transition-all rounded-DEFAULT">Select Basic</button>
          </div>

          {/* Starter Tier (Recommended) */}
          <div className="pricing-card flex flex-col bg-surface border-2 border-primary p-md rounded-xl relative shadow-lg hover:-translate-y-1 transition-transform duration-200">
            <div className="absolute top-0 right-0">
              <span className="bg-primary text-white font-label-caps text-[10px] px-3 py-1 rounded-tr-lg rounded-bl-lg">RECOMMENDED</span>
            </div>
            <div className="mb-md">
              <h3 className="font-label-caps text-label-caps text-primary mb-xs mt-2">STARTER</h3>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-md text-headline-md text-on-surface">Rp</span>
                <span className="font-headline-lg text-headline-lg transition-transform duration-200">
                  {isAnnual ? '82k' : '99k'}
                </span>
                <span className="text-on-surface-variant font-code-sm text-code-sm">/mo</span>
              </div>
              <p className="text-[12px] text-on-surface-variant mt-xs">Perfect for growing stores.</p>
            </div>
            <div className="flex-grow space-y-md border-t border-ui-divider pt-md">
              <ul className="space-y-sm">
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span className="font-bold text-on-surface">100GB Storage</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>200 Orders/day</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>3 User Access</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>Priority Log History</span>
                </li>
              </ul>
            </div>
            <button className="mt-xl w-full py-md bg-primary text-white font-bold hover:opacity-90 active:scale-95 transition-all rounded-DEFAULT">Start Free Trial</button>
          </div>

          {/* Pro Tier */}
          <div className="pricing-card flex flex-col bg-surface border border-ui-divider p-md rounded-xl hover:-translate-y-1 transition-transform duration-200">
            <div className="mb-md">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-xs">PRO</h3>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-md text-headline-md">Rp</span>
                <span className="font-headline-lg text-headline-lg transition-transform duration-200">
                  {isAnnual ? '165k' : '199k'}
                </span>
                <span className="text-on-surface-variant font-code-sm text-code-sm">/mo</span>
              </div>
              <p className="text-[12px] text-on-surface-variant mt-xs">Advanced warehouse needs.</p>
            </div>
            <div className="flex-grow space-y-md border-t border-ui-divider pt-md">
              <ul className="space-y-sm">
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>250GB Storage</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>500 Orders/day</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>10 User Access</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>Multi-station Sync</span>
                </li>
              </ul>
            </div>
            <button className="mt-xl w-full py-md border border-on-surface text-on-surface font-bold hover:bg-surface-container transition-all rounded-DEFAULT">Select Pro</button>
          </div>

          {/* Business Tier */}
          <div className="pricing-card flex flex-col bg-surface border border-ui-divider p-md rounded-xl hover:-translate-y-1 transition-transform duration-200">
            <div className="mb-md">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-xs">BUSINESS</h3>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-md text-headline-md">Rp</span>
                <span className="font-headline-lg text-headline-lg transition-transform duration-200">
                  {isAnnual ? '331k' : '399k'}
                </span>
                <span className="text-on-surface-variant font-code-sm text-code-sm">/mo</span>
              </div>
              <p className="text-[12px] text-on-surface-variant mt-xs">Enterprise-grade scale.</p>
            </div>
            <div className="flex-grow space-y-md border-t border-ui-divider pt-md">
              <ul className="space-y-sm">
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>500GB Storage</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>Unlimited Orders</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>Unlimited Users</span>
                </li>
                <li className="flex items-center gap-2 font-body-md text-[14px]">
                  <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                  <span>API Access</span>
                </li>
              </ul>
            </div>
            <button className="mt-xl w-full py-md border border-on-surface text-on-surface font-bold hover:bg-surface-container transition-all rounded-DEFAULT">Select Business</button>
          </div>

        </div>

        {/* Trust Section (Bento Inspired) */}
        <div className="mt-xl grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="bg-surface-container-low p-md rounded-xl border border-ui-divider flex gap-md items-center">
            <div className="bg-primary-container p-sm rounded-DEFAULT">
              <span className="material-symbols-outlined text-on-primary-container">shield</span>
            </div>
            <div>
              <h4 className="font-label-caps text-label-caps">Secure Evidence</h4>
              <p className="text-[12px] text-on-surface-variant">Encrypted cloud storage for all packing logs.</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-md rounded-xl border border-ui-divider flex gap-md items-center">
            <div className="bg-secondary-container p-sm rounded-DEFAULT">
              <span className="material-symbols-outlined text-white">bolt</span>
            </div>
            <div>
              <h4 className="font-label-caps text-label-caps">Instantly Scan</h4>
              <p className="text-[12px] text-on-surface-variant">Direct integration with packing barcodes.</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-md rounded-xl border border-ui-divider flex gap-md items-center">
            <div className="bg-tertiary-container p-sm rounded-DEFAULT">
              <span className="material-symbols-outlined text-on-tertiary-container">support_agent</span>
            </div>
            <div>
              <h4 className="font-label-caps text-label-caps">24/7 Support</h4>
              <p className="text-[12px] text-on-surface-variant">Our local team is ready to help your warehouse.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-ui-divider w-full px-lg py-md flex flex-col md:flex-row justify-between items-center gap-md mt-auto">
        <div className="font-label-caps text-label-caps text-on-surface-variant">
          © 2026 Nafindo Group. All Rights Reserved.
        </div>
        <div className="flex gap-md items-center font-code-sm text-code-sm text-on-surface-variant">
          <span>v2.4.0-stable</span>
          <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
          <span>Developed by Nafindo Group</span>
        </div>
      </footer>
    </div>
  );
}
