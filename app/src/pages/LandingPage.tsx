import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import imgProblem from '../assets/images/promo-problem.png';
import imgSolution from '../assets/images/promo-solution.png';
import logoImg from '../assets/images/logo.png';

const planDescriptions: Record<string, string> = {
  'FREE': 'Trial',
  'BASIC': 'Seller pemula',
  'STARTER': 'Seller growing',
  'PRO': 'Seller established',
  'BUSINESS': 'Tim/Warehouse',
  'ENTERPRISE': 'Large ops'
};

const planDevices: Record<string, string> = {
  'FREE': '1 Akun (Tidak bisa tambah staf)',
  'BASIC': '1 Akun (Tidak bisa tambah staf)',
  'STARTER': 'Maksimal 3 Akun',
  'PRO': 'Maksimal 10 Akun',
  'BUSINESS': 'Maksimal 50 Akun',
  'ENTERPRISE': 'Custom Multi-Akun'
};

export default function LandingPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const videoId = searchParams.get('v');

  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
      if (data) setPlans(data);
      setLoading(false);
    };
    if (!videoId) {
      fetchPlans();
    }
  }, [videoId]);

  const toggleBilling = () => {
    setIsAnnual(!isAnnual);
  };
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

  return (
    <div className="bg-background text-on-surface font-body-md industrial-pattern selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface border-b border-ui-divider flex justify-center">
        <nav className="w-full max-w-container-max flex justify-between items-center px-lg py-md h-20">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Buktiin Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tighter">BUKTIIN</span>
          </Link>
          <div className="hidden md:flex items-center gap-xl">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-on-surface-variant hover:text-primary transition-colors font-body-md">Fitur</button>
            <button onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })} className="text-on-surface-variant hover:text-primary transition-colors font-body-md">Manfaat</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-on-surface-variant hover:text-primary transition-colors font-body-md">Harga</button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-on-surface-variant hover:text-primary transition-colors font-body-md">Bantuan</button>
          </div>
          <div className="flex items-center gap-md">
            <Link to="/launch" className="bg-primary text-on-primary px-lg py-sm font-bold rounded hover:opacity-90 transition-opacity">
              Buka Aplikasi
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative flex items-center justify-center overflow-hidden py-16 md:py-24 px-gutter min-h-[calc(100vh-80px)]">
          <div className="max-w-container-max w-full grid grid-cols-1 lg:grid-cols-2 gap-xl items-center relative z-10">
            <div className="space-y-md">
              <div className="inline-flex items-center gap-sm bg-primary-container/10 border border-primary-container px-sm py-1">
                <span className="font-label-caps text-label-caps text-primary uppercase">E-Commerce Protection #1</span>
              </div>
              <h1 className="font-display-lg text-display-lg leading-tight">
                Bukti Packing, <br/><span className="text-primary">Aman Kirim.</span>
              </h1>
              <p className="text-body-lg text-on-surface-variant max-w-md">
                Solusi otomatisasi rekaman packing untuk seller e-commerce. Lindungi bisnismu dari komplain palsu dengan bukti video yang akurat dan tersertifikasi.
              </p>
              <div className="flex flex-wrap gap-md pt-sm">
                <Link to="/launch" className="bg-primary text-on-primary px-xl py-md font-bold text-lg rounded hover:shadow-lg transition-all flex items-center gap-sm">
                  Buka Aplikasi
                  <span className="material-symbols-outlined">open_in_new</span>
                </Link>
                <Link to="/login" className="border-2 border-on-surface text-on-surface px-xl py-md font-bold text-lg rounded hover:bg-on-surface hover:text-surface transition-all flex items-center gap-sm">
                  Daftar / Konsol Admin
                </Link>
              </div>
              <div className="flex items-center gap-lg pt-md">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-gray-200 overflow-hidden">
                    <img className="w-full h-full object-cover" alt="User 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0VGEOBsBR2olQTDi7g3CeCilAKsZ1XyVDzdis_sCRJfyWZR2PdrelzLa649-uQY8QO0l8i86C5f6DlNLU6KIrKCPgoCknKmzxMimG1GZNOr-_uazwAX22sVBQkpCeUDtaYpECNUWe1ZeJKvtuD1p5kk1hASIlbtgareR47gu1PHTI4aKzcPmzpyc1GZdBpMpKZnGYQSgZ4zUZrHJZq-1DbPPFQdybz6p1w3Daw54nAm8sDLZDgA94"/>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-gray-200 overflow-hidden">
                    <img className="w-full h-full object-cover" alt="User 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhTamigkiWU01eQh1UL651Hwrs_GlsjLphuDTOk5RGQV5jmeLQ9ZGkWRsogO5z5kpfK3KDmZjnpZndesELKTTK7wwQzM7oUt-kqUtzqCAYi2aLVSIuq5q-DXZMMhHv4Z8paPb_ALLeTX0hXwRKF1qybfqU1tw_f-MPTvPJ6npHcDidtRR7yXb0fajGkLqudbX3A2hi4uT-CPNLoE_Dh8V6g1BL9LTvNZ1Pq3pKYQr9nY-ZQuclBWsE"/>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-gray-200 overflow-hidden flex items-center justify-center bg-primary text-white text-xs font-bold">+500</div>
                </div>
                <p className="text-sm font-label-caps text-on-surface-variant uppercase tracking-wider">Dipercaya 500+ Seller Lokal</p>
              </div>
            </div>
            <div className="relative">
              <div className="camera-viewport rounded-xl shadow-2xl border-4 border-primary bg-black overflow-hidden relative aspect-video flex items-center justify-center">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/-A2lx4D6B7o?si=w4Oq-FCKSYZ4mB5I&autoplay=1&mute=1&loop=1" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="absolute inset-0 z-10"
                ></iframe>
                
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded z-20 pointer-events-none">
                  <div className="w-3 h-3 bg-red-600 rounded-full rec-indicator"></div>
                  <span className="font-code-sm text-code-sm text-white uppercase tracking-widest">REC ●</span>
                </div>
                <div className="absolute bottom-4 left-4 font-code-sm text-code-sm text-primary-fixed-dim bg-black/40 p-2 z-20 pointer-events-none">
                  FPS: 30 | 1080p | AES-256 ENCRYPTED
                </div>
                <div className="absolute inset-0 border-[20px] border-white/5 pointer-events-none z-20"></div>
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-status-processing/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </section>

        {/* Problem & Solution */}
        <section className="bg-surface-container py-xl px-gutter border-y border-ui-divider">
          <div className="max-w-container-max mx-auto">
            <div className="flex flex-col md:flex-row gap-xl items-center">
              <div className="flex-1 space-y-md">
                <h2 className="font-headline-lg text-headline-lg">Lelah dengan <span className="text-error">Komplain Palsu?</span></h2>
                <p className="text-body-md text-on-surface-variant">
                  Seringkali seller kehilangan uang karena pembeli mengklaim barang kurang, rusak, atau salah kirim tanpa bukti yang jelas. BUKTIIN hadir untuk memberikan "Garis Pertahanan" terakhir Anda.
                </p>
                <ul className="space-y-sm">
                  <li className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-error">close</span>
                    <span>Rugi operasional akibat retur yang tidak valid.</span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-error">close</span>
                    <span>Proses investigasi komplain yang memakan waktu lama.</span>
                  </li>
                  <li className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-error">close</span>
                    <span>Reputasi toko turun karena rating rendah dari pembeli nakal.</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 bg-surface-container-lowest p-xl rounded-xl border border-ui-divider shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-lg opacity-10">
                  <span className="material-symbols-outlined text-[120px]">security</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-md">Solusi Automasi Video</h3>
                <p className="text-body-md mb-lg">
                  Rekam setiap proses packing secara otomatis hanya dengan sekali scan barcode pesanan. Video langsung terunggah ke cloud dan siap digunakan saat dibutuhkan.
                </p>
                <div className="grid grid-cols-2 gap-md">
                  <div className="bg-primary/5 p-md border border-primary/20 rounded">
                    <div className="text-primary font-bold text-xl">100%</div>
                    <div className="text-xs uppercase font-label-caps opacity-70">Akurasi Bukti</div>
                  </div>
                  <div className="bg-primary/5 p-md border border-primary/20 rounded">
                    <div className="text-primary font-bold text-xl">0 detik</div>
                    <div className="text-xs uppercase font-label-caps opacity-70">Waktu Tunggu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-xl px-gutter max-w-container-max mx-auto" id="features">
          <div className="text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg mb-sm">Fitur Berstandar Industri</h2>
            <p className="text-on-surface-variant">Teknologi tinggi untuk alur kerja yang sederhana.</p>
          </div>
          <div className="bento-grid">
            <div className="col-span-12 md:col-span-8 bg-surface border border-ui-divider p-lg rounded-xl hover:border-primary transition-colors group">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <span className="material-symbols-outlined text-primary text-4xl mb-md">barcode_scanner</span>
                  <h3 className="font-headline-md text-headline-md mb-sm">Live Scanner Intelligence</h3>
                  <p className="text-on-surface-variant max-w-lg">Sistem mendeteksi barcode secara otomatis. Tidak perlu klik tombol 'Record', cukup arahkan paket ke kamera dan biarkan BUKTIIN bekerja.</p>
                </div>
                <div className="mt-xl bg-surface-container rounded-lg p-md border border-ui-divider group-hover:bg-primary-container/10 transition-colors">
                  <div className="flex items-center gap-sm text-sm font-code-sm">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    SCANNER ACTIVE: WAITING FOR INPUT...
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 bg-surface border border-ui-divider p-lg rounded-xl hover:border-primary transition-colors">
              <span className="material-symbols-outlined text-status-processing text-4xl mb-md">speed</span>
              <h3 className="font-headline-md text-headline-md mb-sm">Async Compressing</h3>
              <p className="text-on-surface-variant">Teknologi kompresi di latar belakang. Packing terus jalan tanpa perlu menunggu video selesai diunggah.</p>
            </div>
            <div className="col-span-12 md:col-span-4 bg-surface border border-ui-divider p-lg rounded-xl hover:border-primary transition-colors">
              <span className="material-symbols-outlined text-secondary text-4xl mb-md">cloud_sync</span>
              <h3 className="font-headline-md text-headline-md mb-sm">Hybrid Storage</h3>
              <p className="text-on-surface-variant">Penyimpanan cloud aman dengan fitur auto-delete cerdas untuk efisiensi biaya penyimpanan Anda.</p>
            </div>
            <div className="col-span-12 md:col-span-8 bg-inverse-surface text-surface p-lg rounded-xl overflow-hidden relative">
              <div className="relative z-10">
                <span className="material-symbols-outlined text-primary-fixed text-4xl mb-md">analytics</span>
                <h3 className="font-headline-md text-headline-md mb-sm">Efficiency Audit</h3>
                <p className="text-surface-variant max-w-md">Analisis kecepatan packing tim Anda. Temukan bottleneck dan tingkatkan produktivitas warehouse hingga 30%.</p>
              </div>
              <div className="absolute bottom-0 right-0 p-lg opacity-20 pointer-events-none">
                <span className="material-symbols-outlined text-[180px]">trending_up</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-xl px-gutter bg-surface" id="benefits">
          <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl">
            <div className="text-center p-md">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-md">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
              </div>
              <h4 className="font-headline-md text-headline-md mb-sm text-lg">Proteksi Kerugian</h4>
              <p className="text-on-surface-variant text-sm">Cegah kerugian finansial akibat klaim barang rusak atau hilang yang tidak berdasar.</p>
            </div>
            <div className="text-center p-md">
              <div className="w-16 h-16 bg-status-processing/10 rounded-full flex items-center justify-center mx-auto mb-md">
                <span className="material-symbols-outlined text-status-processing text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
              </div>
              <h4 className="font-headline-md text-headline-md mb-sm text-lg">Kepercayaan Pembeli</h4>
              <p className="text-on-surface-variant text-sm">Lampirkan link video bukti packing pada pesanan untuk meningkatkan rasa aman pembeli Anda.</p>
            </div>
            <div className="text-center p-md">
              <div className="w-16 h-16 bg-on-surface/10 rounded-full flex items-center justify-center mx-auto mb-md">
                <span className="material-symbols-outlined text-on-surface text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
              </div>
              <h4 className="font-headline-md text-headline-md mb-sm text-lg">Audit Warehouse</h4>
              <p className="text-on-surface-variant text-sm">Pantau SOP packing secara remote dan pastikan kualitas kontrol tetap terjaga setiap hari.</p>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-xl px-gutter bg-surface-container-low border-y border-ui-divider" id="pricing">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-xl">
              <h2 className="font-headline-lg text-headline-lg mb-md">Pilih Paket Sesuai Skalamu</h2>
              <div className="flex items-center justify-center gap-md mt-md">
                <span className={`font-label-caps text-label-caps ${!isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`} id="monthly-label">Bulanan</span>
                <button 
                  className="relative w-14 h-7 bg-surface-container-highest rounded-full p-1 focus:outline-none transition-colors" 
                  onClick={toggleBilling}
                >
                  <div className={`w-5 h-5 bg-primary rounded-full transition-transform transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}></div>
                </button>
                <span className={`font-label-caps text-label-caps ${isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`} id="annual-label">
                  Tahunan <span className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full ml-1 font-bold">HEMAT 17%</span>
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-md mt-xl">
              {loading ? (
                <div className="w-full text-center py-xl text-on-surface-variant">Memuat daftar harga...</div>
              ) : (
                plans.map((plan) => (
                  <div key={plan.id} className={`pricing-card w-full sm:w-[320px] lg:w-[280px] flex-shrink-0 flex flex-col bg-surface border ${plan.name === 'STARTER' ? 'border-2 border-primary shadow-lg scale-105 z-10' : 'border-ui-divider hover:shadow-md'} p-md rounded-xl relative overflow-hidden transition-all duration-200`}>
                    {plan.name === 'STARTER' && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest mt-4 z-20">Recommended</div>
                    )}
                    <div className="mb-md mt-2">
                      <h5 className={`font-label-caps text-label-caps uppercase ${plan.name === 'STARTER' ? 'text-primary' : plan.name === 'BUSINESS' ? 'text-primary-fixed' : 'text-on-surface-variant'} mb-xs`}>{plan.name}</h5>
                      <div className="flex items-baseline gap-1">
                        {plan.name !== 'ENTERPRISE' && (
                          <span className="text-lg font-bold">Rp</span>
                        )}
                        <span className="text-3xl font-extrabold tracking-tighter">
                          {plan.name === 'ENTERPRISE' ? 'Custom' : (isAnnual ? plan.price * 10 : plan.price).toLocaleString('id-ID')}
                        </span>
                        {plan.name !== 'ENTERPRISE' && (
                          <span className="text-on-surface-variant text-sm">/{isAnnual ? 'yr' : 'mo'}</span>
                        )}
                      </div>
                      <p className="font-body-sm text-[13px] text-on-surface-variant mt-sm min-h-[40px]">{planDescriptions[plan.name] || 'Pilihan terbaik untuk bisnis Anda'}</p>
                    </div>
                    <ul className="space-y-sm text-sm mb-xl flex-1 border-t border-ui-divider pt-md">
                      <li className="flex items-center gap-sm">
                        <span className={`material-symbols-outlined text-[18px] ${plan.name === 'BUSINESS' ? 'text-primary-fixed' : 'text-primary'}`}>check_circle</span> 
                        {plan.name === 'ENTERPRISE' ? 'Unlimited Storage' : ((plan.storageLimit || plan.storagelimit) / 1000) + 'GB Storage'}
                      </li>
                      <li className="flex items-center gap-sm">
                        <span className={`material-symbols-outlined text-[18px] ${plan.name === 'BUSINESS' ? 'text-primary-fixed' : 'text-primary'}`}>check_circle</span> 
                        {plan.name === 'ENTERPRISE' ? 'Unlimited Orders' : (plan.orderLimit || plan.orderlimit).toLocaleString('id-ID') + ' Orders/day'}
                      </li>
                      <li className="flex items-center gap-sm">
                        <span className={`material-symbols-outlined text-[18px] ${plan.name === 'BUSINESS' ? 'text-primary-fixed' : 'text-primary'}`}>check_circle</span> 
                        {plan.retentionDays || plan.retentiondays} Hari Cloud Storage
                      </li>
                      <li className="flex items-center gap-sm">
                        <span className={`material-symbols-outlined text-[18px] ${plan.name === 'BUSINESS' ? 'text-primary-fixed' : 'text-primary'}`}>devices</span> 
                        {planDevices[plan.name]}
                      </li>
                    </ul>
                    <Link to="/login" className={`w-full py-sm font-bold rounded transition-all text-center block ${
                      plan.name === 'STARTER' 
                        ? 'bg-primary text-white hover:opacity-90' 
                        : plan.name === 'BUSINESS' 
                          ? 'bg-surface-container-highest text-on-surface hover:bg-primary-fixed' 
                          : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                    }`}>
                      {plan.name === 'ENTERPRISE' ? 'Hubungi Sales' : 'Pilih Paket'}
                    </Link>
                  </div>
                ))
              )}
            </div>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-xl bg-surface">
          <div className="max-w-container-max mx-auto px-gutter flex flex-col md:flex-row justify-between items-center gap-xl border-b border-ui-divider pb-xl">
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
      </main>
    </div>
  );
}
