import { Link, useLocation, Navigate } from 'react-router-dom';
import imgProblem from '../assets/images/promo-problem.png';
import imgSolution from '../assets/images/promo-solution.png';
import logoImg from '../assets/images/logo.png';

export default function LandingPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const videoId = searchParams.get('v');

  // If a video ID is provided in the URL, render the Customer Promo Player instead
  if (videoId) {
    return (
      <div className="bg-background text-on-surface font-body-md industrial-pattern min-h-screen flex flex-col items-center">
        {/* Simple Header */}
        <header className="w-full bg-surface border-b border-ui-divider flex justify-center sticky top-0 z-50">
          <nav className="w-full max-w-container-max flex justify-between items-center px-lg py-md h-20">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="Buktiin Logo" className="w-8 h-8 rounded-lg shadow-sm" />
              <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tighter">BUKTIIN</span>
            </Link>
            <Link to="/login" className="bg-primary-container text-on-primary-container px-md py-sm font-bold rounded-DEFAULT hover:opacity-90 transition-opacity">
              Mulai Gunakan BUKTIIN
            </Link>
          </nav>
        </header>

        {/* Main Grid Layout */}
        <main className="w-full max-w-[1400px] px-lg py-xl flex-1 flex flex-col lg:flex-row gap-xl items-stretch justify-center mx-auto">
          
          {/* Left Sidebar: Masalah */}
          <aside className="w-full lg:w-[15%] flex flex-col gap-md">
            <div className="relative bg-error/10 border-2 border-error/20 rounded-xl h-full flex flex-col items-center justify-between text-center shadow-inner overflow-hidden p-3 min-h-[400px]">
              {/* Banner Image (z:1) */}
              <div className="absolute inset-0 z-[1] flex justify-center items-center pointer-events-none">
                <img src={imgProblem} alt="Seller Stress" className="w-full h-full object-cover opacity-90" />
              </div>
              
              {/* Judul di depan banner (z:2) */}
              <div className="relative z-[2] bg-white/80 backdrop-blur-sm px-2 py-3 rounded-lg w-full mt-1 border border-white/50 shadow-sm">
                <h2 className="font-headline-sm text-headline-sm text-error font-extrabold leading-tight">Sering Kena Retur Fiktif?</h2>
              </div>

              {/* Permasalahan Seller (z:3) */}
              <div className="relative z-[3] w-full bg-white/95 backdrop-blur-md p-3 rounded-lg mt-auto space-y-3 border border-error/20 shadow-lg">
                <div className="flex items-start gap-2 text-left">
                  <span className="material-symbols-outlined text-error text-lg mt-0.5">cancel</span>
                  <span className="text-xs font-bold text-on-surface leading-snug">Klaim barang kurang/rusak tanpa bukti</span>
                </div>
                <div className="flex items-start gap-2 text-left">
                  <span className="material-symbols-outlined text-error text-lg mt-0.5">cancel</span>
                  <span className="text-xs font-bold text-on-surface leading-snug">Rugi uang & barang melayang</span>
                </div>
                <div className="flex items-start gap-2 text-left">
                  <span className="material-symbols-outlined text-error text-lg mt-0.5">cancel</span>
                  <span className="text-xs font-bold text-on-surface leading-snug">Reputasi & rating toko anjlok</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Center: Video Player */}
          <section className="w-full lg:w-[70%] flex flex-col items-center text-center">
            <h1 className="font-headline-lg text-headline-lg mb-sm font-extrabold">Bukti Packing Pesanan Anda</h1>
            <p className="text-on-surface-variant mb-lg font-medium">
              Penjual menggunakan teknologi <strong>BUKTIIN</strong> untuk menjamin transparansi pengemasan pesanan Anda.
            </p>

            <div className="w-full bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-surface border-ui-divider aspect-video relative group">
              <iframe 
                src={`https://drive.google.com/file/d/${videoId}/preview`} 
                width="100%" 
                height="100%" 
                allow="autoplay" 
                className="absolute inset-0 z-10"
              ></iframe>
            </div>

            <div className="mt-xl bg-primary-container border-2 border-primary/30 rounded-xl p-md w-full shadow-md">
              <p className="text-body-md text-on-primary-container font-bold">Pelanggan merasa aman, Anda pun tenang berbisnis.</p>
            </div>
          </section>

          {/* Right Sidebar: Kelebihan */}
          <aside className="w-full lg:w-[15%] flex flex-col gap-md">
            <div className="relative bg-primary/10 border-2 border-primary/20 rounded-xl h-full flex flex-col items-center justify-between text-center shadow-inner overflow-hidden p-3 min-h-[400px]">
              {/* Banner Image (z:1) */}
              <div className="absolute inset-0 z-[1] flex justify-center items-center pointer-events-none">
                <img src={imgSolution} alt="Seller Happy" className="w-full h-full object-cover opacity-90" />
              </div>
              
              {/* Judul di depan banner (z:2) */}
              <div className="relative z-[2] bg-white/80 backdrop-blur-sm px-2 py-3 rounded-lg w-full mt-1 border border-white/50 shadow-sm">
                <h2 className="font-headline-sm text-headline-sm text-primary font-extrabold leading-tight">Menangkan Tiap Sengketa!</h2>
              </div>

              {/* Solusi (z:3) */}
              <div className="relative z-[3] w-full bg-white/95 backdrop-blur-md p-3 rounded-lg mt-auto flex flex-col gap-3 border border-primary/20 shadow-lg">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 text-left">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
                    <span className="text-xs font-bold text-on-surface leading-snug">Rekam otomatis via scan barcode</span>
                  </div>
                  <div className="flex items-start gap-2 text-left">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
                    <span className="text-xs font-bold text-on-surface leading-snug">Video aman di Cloud (memori lega)</span>
                  </div>
                  <div className="flex items-start gap-2 text-left">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5">check_circle</span>
                    <span className="text-xs font-bold text-on-surface leading-snug">Punya bukti kuat 100% akurat</span>
                  </div>
                </div>
                <Link to="/register" className="w-full bg-primary text-white font-extrabold py-2 px-1 text-[13px] rounded-lg hover:opacity-90 hover:shadow-lg transition-all text-center whitespace-nowrap animate-pulse-slow">
                  Daftar Gratis
                </Link>
              </div>
            </div>
          </aside>
        </main>
      </div>
    );
  }

  return <Navigate to="/login" replace />;
}
