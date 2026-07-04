
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <>
      {/* Trust Signals */}
      <section className="py-xl bg-surface border-t border-ui-divider">
        <div className="max-w-container-max mx-auto px-gutter flex flex-col md:flex-row justify-between items-center gap-xl pb-xl">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-label-caps text-label-caps text-primary uppercase mb-2">Developed by</span>
            <h4 className="font-headline-md text-headline-md font-bold tracking-tight">NAFINDO GROUP</h4>
          </div>
          <div className="flex gap-xl overflow-x-auto py-md grayscale opacity-60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">verified</span>
              <span className="font-bold">TIER 3 DATA CENTER</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">dns</span>
              <span className="font-bold">99.5% UPTIME</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">lock_reset</span>
              <span className="font-bold">AES-256 ENCRYPTION</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer Links */}
      <footer className="bg-surface-container py-lg px-gutter border-t border-ui-divider">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-md text-sm text-on-surface-variant">
          <p>&copy; {new Date().getFullYear()} Buktiin by Nafindo Group. All rights reserved.</p>
          <div className="flex gap-md">
            <Link to="/terms" className="hover:text-primary transition-colors">Syarat &amp; Ketentuan</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
