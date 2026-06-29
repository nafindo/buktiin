import { useState, useEffect } from 'react';

export default function Payment() {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyVA = () => {
    navigator.clipboard.writeText('12300882934402').then(() => {
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    });
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header can be added by layout, skipping to main */}
      
      <main className="flex-grow max-w-container-max mx-auto p-lg md:py-xl w-full">
        {/* Breadcrumb & Title */}
        <div className="mb-xl">
          <div className="flex items-center gap-xs text-on-surface-variant font-label-caps text-label-caps mb-sm">
            <a className="hover:text-primary transition-colors" href="#">DASHBOARD</a>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary">CHECKOUT</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Payment Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
          
          {/* Left Column: Payment Methods */}
          <div className="lg:col-span-7 space-y-lg">
            
            {/* Countdown Banner */}
            <div className="bg-surface-container-low border border-ui-divider p-md flex items-center justify-between rounded-DEFAULT">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-secondary">schedule</span>
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant">COMPLETE PAYMENT WITHIN</p>
                  <p className="font-code-sm text-headline-md text-secondary font-bold" id="timer">
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <span className="bg-status-processing text-white px-md py-xs font-label-caps text-label-caps rounded-DEFAULT">PROSES</span>
              </div>
            </div>

            {/* Payment Selection */}
            <section className="space-y-md">
              <h2 className="font-label-caps text-label-caps text-on-surface-variant border-l-4 border-primary pl-md">PAYMENT METHOD</h2>
              
              {/* Virtual Account Group */}
              <div className="border border-ui-divider bg-surface-background rounded-DEFAULT overflow-hidden">
                <div className="p-md bg-surface-container-low border-b border-ui-divider flex items-center justify-between">
                  <span className="font-label-caps text-label-caps font-bold">VIRTUAL ACCOUNT</span>
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
                <div className="divide-y divide-ui-divider">
                  
                  {/* BCA (Active/Specific) */}
                  <div className="p-lg bg-surface-container-lowest border-l-4 border-primary">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-md">
                      <div className="flex items-center gap-md">
                        <div className="w-16 h-10 border border-ui-divider flex items-center justify-center bg-white p-xs">
                          <span className="font-bold text-on-surface-variant">BCA</span>
                        </div>
                        <div>
                          <p className="font-body-md font-bold">Bank Central Asia</p>
                          <p className="font-code-sm text-on-surface-variant">Transfer via m-BCA / ATM</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    
                    <div className="bg-surface-container-low p-md flex items-center justify-between border border-dashed border-outline-variant">
                      <div>
                        <p className="font-label-caps text-label-caps text-on-surface-variant mb-xs">VA NUMBER</p>
                        <p className="font-code-sm text-headline-md tracking-widest font-bold text-on-surface">12300 88293 4402</p>
                      </div>
                      <button 
                        className="border border-on-surface-variant text-on-surface-variant px-md py-sm font-label-caps text-label-caps hover:bg-on-surface-variant hover:text-white transition-all active:scale-95" 
                        onClick={copyVA}
                      >
                        [ COPY ]
                      </button>
                    </div>
                    {showCopyFeedback && (
                      <div className="text-status-success font-code-sm mt-xs">Copied to clipboard!</div>
                    )}
                  </div>
                  
                  {/* BNI */}
                  <div className="p-lg flex items-center justify-between hover:bg-surface-container-low cursor-pointer transition-colors">
                    <div className="flex items-center gap-md">
                      <div className="w-16 h-10 border border-ui-divider flex items-center justify-center bg-white p-xs">
                        <span className="font-bold text-on-surface-variant">BNI</span>
                      </div>
                      <p className="font-body-md">Bank Negara Indonesia</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
                  </div>
                  
                  {/* Mandiri */}
                  <div className="p-lg flex items-center justify-between hover:bg-surface-container-low cursor-pointer transition-colors">
                    <div className="flex items-center gap-md">
                      <div className="w-16 h-10 border border-ui-divider flex items-center justify-center bg-white p-xs text-xs">
                        <span className="font-bold text-on-surface-variant">MANDIRI</span>
                      </div>
                      <p className="font-body-md">Bank Mandiri</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
                  </div>

                </div>
              </div>

              {/* E-Wallet Group */}
              <div className="border border-ui-divider bg-surface-background rounded-DEFAULT overflow-hidden">
                <div className="p-md bg-surface-container-low flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer">
                  <span className="font-label-caps text-label-caps font-bold">E-WALLET</span>
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </div>

              {/* QRIS Group */}
              <div className="border border-ui-divider bg-surface-background rounded-DEFAULT overflow-hidden">
                <div className="p-md bg-surface-container-low flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer">
                  <span className="font-label-caps text-label-caps font-bold">QRIS (SCAN TO PAY)</span>
                  <span className="material-symbols-outlined">qr_code_2</span>
                </div>
              </div>

            </section>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="lg:col-span-5 space-y-lg">
            <section className="border border-ui-divider bg-surface-background rounded-DEFAULT overflow-hidden">
              <div className="p-md bg-on-surface text-white flex items-center gap-md">
                <span className="material-symbols-outlined">receipt_long</span>
                <h2 className="font-label-caps text-label-caps">ORDER SUMMARY</h2>
              </div>
              <div className="p-lg space-y-md">
                
                {/* Product Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-body-lg font-bold">Starter Plan (Monthly)</p>
                    <p className="font-code-sm text-on-surface-variant">E-commerce Evidence Recording System</p>
                  </div>
                  <p className="font-code-sm text-on-surface">Rp 250.000</p>
                </div>
                
                <hr className="border-ui-divider" />
                
                {/* Breakdown */}
                <div className="space-y-sm">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <p className="font-body-md">Subtotal</p>
                    <p className="font-code-sm">Rp 250.000</p>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <p className="font-body-md">VAT (11%)</p>
                    <p className="font-code-sm">Rp 27.500</p>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <p className="font-body-md">Service Fee</p>
                    <p className="font-code-sm">Rp 2.500</p>
                  </div>
                </div>
                
                <div className="bg-primary-container/10 p-md border border-primary/20 rounded-DEFAULT">
                  <div className="flex justify-between items-center">
                    <p className="font-headline-md font-bold text-primary">TOTAL</p>
                    <p className="font-code-sm text-headline-md font-bold text-primary">Rp 280.000</p>
                  </div>
                </div>
                
                {/* Action */}
                <button className="w-full bg-primary text-white py-md font-label-caps text-label-caps font-bold hover:bg-primary-container transition-all active:scale-[0.98] rounded-DEFAULT">
                  I HAVE ALREADY PAID
                </button>
                <p className="font-code-sm text-center text-on-surface-variant leading-relaxed">
                  By paying, you agree to our Terms of Service and Logistics Evidence standard protocols.
                </p>
              </div>
            </section>
            
            {/* Help Block */}
            <div className="border border-ui-divider p-lg bg-surface-container-low flex items-center gap-md rounded-DEFAULT">
              <span className="material-symbols-outlined text-on-surface-variant">help_outline</span>
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">NEED ASSISTANCE?</p>
                <p className="font-body-md">Contact Operation Support 24/7</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-ui-divider w-full px-lg py-md mt-auto">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <p className="font-code-sm text-on-surface-variant">© 2026 Nafindo Group. All Rights Reserved.</p>
          <div className="flex gap-lg">
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors" href="#">Developed by Nafindo Group</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
