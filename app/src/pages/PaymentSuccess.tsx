export default function PaymentSuccess() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-xl px-lg">
        <div className="max-w-[700px] w-full flex flex-col items-center">
          
          {/* Success Icon & Headline */}
          <div className="text-center mb-xl">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-status-success rounded-full mb-md animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] shadow-lg">
              <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Pembayaran Berhasil!</h1>
            <p className="text-on-surface-variant font-body-lg text-body-lg">Akun Anda telah ditingkatkan ke paket Pro.</p>
          </div>

          {/* Bento Layout Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md w-full">
            
            {/* Plan Details Card */}
            <div className="bg-surface-container-low border border-ui-divider p-lg flex flex-col rounded-xl">
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">RINCIAN PAKET</span>
              </div>
              <div className="space-y-md flex-grow">
                <div>
                  <p className="font-headline-md text-headline-md font-bold text-primary">Professional Plan</p>
                  <p className="text-on-surface-variant font-code-sm text-code-sm">Billed Monthly</p>
                </div>
                <ul className="space-y-sm">
                  <li className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-status-success text-[18px]">verified</span>
                    <span className="font-body-md text-body-md">50GB Cloud Storage</span>
                  </li>
                  <li className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-status-success text-[18px]">verified</span>
                    <span className="font-body-md text-body-md">2 Active Operators</span>
                  </li>
                  <li className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-status-success text-[18px]">verified</span>
                    <span className="font-body-md text-body-md">Unlimited Evidence Videos</span>
                  </li>
                  <li className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-status-success text-[18px]">verified</span>
                    <span className="font-body-md text-body-md">1080p Recording Quality</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Invoice Summary Card */}
            <div className="bg-surface-container-low border border-ui-divider p-lg flex flex-col rounded-xl">
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">RINGKASAN INVOICE</span>
              </div>
              <div className="space-y-sm font-code-sm text-code-sm text-on-surface-variant flex-grow">
                <div className="flex justify-between py-xs border-b border-ui-divider">
                  <span>Invoice Number</span>
                  <span className="text-on-surface font-bold">INV/2026/0402/8892</span>
                </div>
                <div className="flex justify-between py-xs border-b border-ui-divider">
                  <span>Payment Date</span>
                  <span className="text-on-surface">Oct 24, 2026 • 14:32</span>
                </div>
                <div className="flex justify-between py-xs border-b border-ui-divider">
                  <span>Payment Method</span>
                  <span className="text-on-surface">VA BCA</span>
                </div>
                <div className="flex justify-between py-xs border-b border-ui-divider">
                  <span>Subtotal</span>
                  <span className="text-on-surface">Rp 299.000</span>
                </div>
                <div className="flex justify-between py-xs border-b border-ui-divider">
                  <span>Tax (11%)</span>
                  <span className="text-on-surface">Rp 32.890</span>
                </div>
                <div className="flex justify-between pt-md">
                  <span className="text-on-surface font-label-caps text-label-caps">TOTAL</span>
                  <span className="text-primary font-headline-md text-headline-md font-bold">Rp 331.890</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-md mt-md">
              <button className="flex-1 bg-status-success text-white font-bold py-md px-lg flex items-center justify-center gap-sm hover:opacity-90 active:scale-95 transition-all rounded-DEFAULT">
                <span className="material-symbols-outlined">qr_code_scanner</span>
                Mulai Packing Sekarang
              </button>
              <button className="flex-1 border-2 border-on-surface text-on-surface font-bold py-md px-lg flex items-center justify-center gap-sm hover:bg-surface-variant active:scale-95 transition-all rounded-DEFAULT">
                <span className="material-symbols-outlined">download</span>
                Download Invoice
              </button>
            </div>

            {/* Support Info */}
            <div className="md:col-span-2 bg-surface p-md border-t border-ui-divider flex flex-col md:flex-row justify-between items-center gap-md rounded-b-xl">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 bg-tertiary-container rounded-full flex items-center justify-center text-on-tertiary-container">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface">Butuh bantuan?</p>
                  <p className="text-on-surface-variant font-code-sm text-code-sm">Tim support kami siap membantu kendala Anda.</p>
                </div>
              </div>
              <div className="flex gap-md">
                <a className="flex items-center gap-xs font-code-sm text-code-sm text-primary hover:underline" href="#">
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  support@buktiin.id
                </a>
                <a className="flex items-center gap-xs font-code-sm text-code-sm text-primary hover:underline" href="#">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  +62 812 3456 7890
                </a>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-ui-divider flex flex-col md:flex-row justify-between items-center w-full px-lg py-md mt-auto">
        <div className="font-label-caps text-label-caps text-on-surface-variant mb-xs md:mb-0">
          © 2026 Nafindo Group. All Rights Reserved.
        </div>
        <div className="font-code-sm text-code-sm text-on-surface-variant">
          Developed by Nafindo Group
        </div>
      </footer>
    </div>
  );
}
