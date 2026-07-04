import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
            <Link to="/download" className="bg-primary-container text-on-primary-container px-md py-sm font-bold rounded-DEFAULT hover:opacity-90 transition-opacity">
              Mulai Gunakan BUKTIIN
            </Link>
          </nav>
        </header>

        {/* Main Grid Layout */}
        <main className="w-full max-w-[1400px] px-4 lg:px-lg py-6 lg:py-xl flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch mx-auto">
          
          {/* Left Sidebar: Masalah (Order 2 on Mobile, 1 on Desktop) */}
          <aside className="order-2 lg:order-1 col-span-1 md:col-span-1 lg:col-span-2 flex flex-col h-full">
            <div className="relative bg-error/10 border-2 border-error/20 rounded-2xl h-full flex flex-col items-center justify-between text-center shadow-inner overflow-hidden p-4 min-h-[350px] lg:min-h-[400px] group hover:border-error/40 transition-colors">
              {/* Banner Image (z:1) */}
              <div className="absolute inset-0 z-[1] flex justify-center items-center pointer-events-none">
                <img src={imgProblem} alt="Seller Stress" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-105" />
                <div className="absolute inset-0 bg-gradient-to-b from-error/10 to-background/90" />
              </div>
              
              {/* Judul di depan banner (z:2) */}
              <div className="relative z-[2] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl w-full mt-2 border border-error/20 shadow-lg transform -translate-y-1">
                <h2 className="text-sm lg:text-headline-sm text-error font-extrabold leading-tight">Sering Kena Retur Fiktif?</h2>
              </div>

              {/* Permasalahan Seller (z:3) */}
              <div className="relative z-[3] w-full bg-white/95 backdrop-blur-xl p-3 lg:p-4 rounded-xl mt-auto space-y-3 border border-error/20 shadow-xl">
                <div className="flex items-start gap-2 text-left">
                  <span className="material-symbols-outlined text-error text-base lg:text-lg shrink-0">cancel</span>
                  <span className="text-xs lg:text-sm font-bold text-on-surface leading-snug">Klaim barang kurang/rusak tanpa bukti</span>
                </div>
                <div className="flex items-start gap-2 text-left">
                  <span className="material-symbols-outlined text-error text-base lg:text-lg shrink-0">cancel</span>
                  <span className="text-xs lg:text-sm font-bold text-on-surface leading-snug">Rugi uang & barang melayang</span>
                </div>
                <div className="flex items-start gap-2 text-left">
                  <span className="material-symbols-outlined text-error text-base lg:text-lg shrink-0">cancel</span>
                  <span className="text-xs lg:text-sm font-bold text-on-surface leading-snug">Reputasi & rating toko anjlok</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Center: Video Player (Order 1 on Mobile, 2 on Desktop) */}
          <section className="order-1 lg:order-2 col-span-1 md:col-span-2 lg:col-span-8 flex flex-col items-center justify-center text-center w-full">
            <h1 className="text-2xl md:text-headline-lg mb-2 font-extrabold tracking-tight text-on-surface">Bukti Packing Pesanan Anda</h1>
            <p className="text-sm md:text-body-lg text-on-surface-variant mb-6 font-medium max-w-2xl">
              Penjual menggunakan teknologi cerdas <strong>BUKTIIN</strong> untuk menjamin transparansi & keamanan pesanan Anda.
            </p>

            {/* Container Video: Kembali menggunakan iframe Google Drive karena direct-stream diblokir oleh sistem keamanan Google. Diberikan min-height agar UI Play tidak tertumpuk */}
            <div className="w-full bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-surface ring-1 ring-ui-divider min-h-[260px] md:min-h-[auto] md:aspect-video relative group transition-transform duration-500 hover:scale-[1.01]">
              <iframe 
                src={`https://drive.google.com/file/d/${videoId}/preview`} 
                width="100%" 
                height="100%" 
                allow="autoplay; fullscreen; picture-in-picture"
                frameBorder="0"
                className="absolute inset-0 z-10 w-full h-full"
              ></iframe>
            </div>

            <div className="mt-6 lg:mt-8 bg-primary-container/50 border-2 border-primary/20 rounded-2xl p-4 w-full shadow-sm backdrop-blur-sm flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
              <p className="text-sm md:text-base text-on-primary-container font-bold">Pelanggan merasa aman, Anda pun tenang berbisnis.</p>
            </div>
          </section>

          {/* Right Sidebar: Kelebihan (Order 3 on Mobile, 3 on Desktop) */}
          <aside className="order-3 lg:order-3 col-span-1 md:col-span-1 lg:col-span-2 flex flex-col h-full">
            <div className="relative bg-primary/10 border-2 border-primary/20 rounded-2xl h-full flex flex-col items-center justify-between text-center shadow-inner overflow-hidden p-4 min-h-[350px] lg:min-h-[400px] group hover:border-primary/40 transition-colors">
              {/* Banner Image (z:1) */}
              <div className="absolute inset-0 z-[1] flex justify-center items-center pointer-events-none">
                <img src={imgSolution} alt="Seller Happy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-105" />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background/90" />
              </div>
              
              {/* Judul di depan banner (z:2) */}
              <div className="relative z-[2] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl w-full mt-2 border border-primary/20 shadow-lg transform -translate-y-1">
                <h2 className="text-sm lg:text-headline-sm text-primary font-extrabold leading-tight">Menangkan Tiap Sengketa!</h2>
              </div>

              {/* Solusi (z:3) */}
              <div className="relative z-[3] w-full bg-white/95 backdrop-blur-xl p-3 lg:p-4 rounded-xl mt-auto flex flex-col gap-4 border border-primary/20 shadow-xl">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 text-left">
                    <span className="material-symbols-outlined text-primary text-base lg:text-lg shrink-0">check_circle</span>
                    <span className="text-xs lg:text-sm font-bold text-on-surface leading-snug">Rekam otomatis via scan barcode</span>
                  </div>
                  <div className="flex items-start gap-2 text-left">
                    <span className="material-symbols-outlined text-primary text-base lg:text-lg shrink-0">cloud_done</span>
                    <span className="text-xs lg:text-sm font-bold text-on-surface leading-snug">Video aman di Cloud (memori lega)</span>
                  </div>
                  <div className="flex items-start gap-2 text-left">
                    <span className="material-symbols-outlined text-primary text-base lg:text-lg shrink-0">gavel</span>
                    <span className="text-xs lg:text-sm font-bold text-on-surface leading-snug">Punya bukti kuat 100% akurat</span>
                  </div>
                </div>
                <Link to="/download" className="w-full bg-primary text-white font-extrabold py-3 px-2 text-sm rounded-lg hover:opacity-90 hover:scale-[1.02] hover:shadow-lg transition-all text-center whitespace-nowrap animate-pulse-slow shadow-md flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-base">download</span> Daftar Gratis
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
      <Navbar />

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
                <Link to="/download" className="bg-primary text-on-primary px-xl py-md font-bold text-lg rounded hover:shadow-lg transition-all flex items-center gap-sm">
                  Mulai Sekarang
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <button className="border-2 border-on-surface text-on-surface px-xl py-md font-bold text-lg rounded hover:bg-on-surface hover:text-surface transition-all">
                  Lihat Demo
                </button>
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
              <div className="camera-viewport rounded-xl shadow-2xl border-4 border-primary">
                <img className="w-full h-full object-cover opacity-80" alt="Camera View" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqMgffZcBkI2Cbsw4yyvABB8lZkgwldqa38GNse6qqOoG95TKzuUMu_jsDgwP2XU0iTVIhtCU3gkbazL67CcdJVVmTrKIr86oKIunXGC9bjEjip_ERL336Sr1MCGev7Qhjhl2zfPnQPNxMdL4Co1gO0HzcqHhTTdkIQKFh2Lo3XjNI2wiwv0Z7zFcJ5iJV-AMkvvzaaFIu0hctKsNiWi2b15A1RjnQwlqPXwXf7hBiTv_pTRUzzuH7"/>
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded">
                  <div className="w-3 h-3 bg-red-600 rounded-full rec-indicator"></div>
                  <span className="font-code-sm text-code-sm text-white uppercase tracking-widest">REC ●</span>
                </div>
                <div className="absolute bottom-4 left-4 font-code-sm text-code-sm text-primary-fixed-dim bg-black/40 p-2">
                  FPS: 30 | 1080p | AES-256 ENCRYPTED
                </div>
                <div className="absolute inset-0 border-[20px] border-white/5 pointer-events-none"></div>
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
              <div className="flex items-center justify-center gap-md">
                <span className="font-body-md">Bulanan</span>
                <button className="w-14 h-8 bg-primary rounded-full relative p-1 transition-all">
                  <div className="w-6 h-6 bg-white rounded-full transition-all translate-x-6"></div>
                </button>
                <span className="font-body-md flex items-center gap-sm">
                  Tahunan 
                  <span className="bg-primary-container text-on-primary-container text-[10px] px-2 py-1 rounded-full font-bold">HEMAT 17%</span>
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              {/* Basic */}
              <div className="bg-surface border border-ui-divider p-lg rounded-xl flex flex-col hover:shadow-md transition-shadow">
                <div className="mb-lg">
                  <h5 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-xs">Basic</h5>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">Rp</span>
                    <span className="text-3xl font-extrabold tracking-tighter">49k</span>
                    <span className="text-on-surface-variant text-sm">/bln</span>
                  </div>
                </div>
                <ul className="space-y-sm text-sm mb-xl flex-1">
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> 1 Kamera</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> 500 Rekaman/Bulan</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> 7 Hari Cloud Storage</li>
                  <li className="flex items-center gap-sm opacity-30"><span className="material-symbols-outlined text-[18px]">block</span> Tanpa API Access</li>
                </ul>
                <Link to="/download" className="w-full py-sm border-2 border-primary text-primary font-bold rounded hover:bg-primary hover:text-white transition-all text-center block">Pilih Paket</Link>
              </div>
              {/* Starter */}
              <div className="bg-surface border-4 border-primary p-lg rounded-xl flex flex-col shadow-xl relative scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">Recommended</div>
                <div className="mb-lg">
                  <h5 className="font-label-caps text-label-caps uppercase text-primary mb-xs">Starter</h5>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">Rp</span>
                    <span className="text-3xl font-extrabold tracking-tighter">99k</span>
                    <span className="text-on-surface-variant text-sm">/bln</span>
                  </div>
                </div>
                <ul className="space-y-sm text-sm mb-xl flex-1">
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> 3 Kamera</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> 2.500 Rekaman/Bulan</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> 14 Hari Cloud Storage</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> Export CSV &amp; Webhook</li>
                </ul>
                <Link to="/download" className="w-full py-sm bg-primary text-white font-bold rounded hover:opacity-90 transition-all text-center block">Pilih Paket</Link>
              </div>
              {/* Pro */}
              <div className="bg-surface border border-ui-divider p-lg rounded-xl flex flex-col hover:shadow-md transition-shadow">
                <div className="mb-lg">
                  <h5 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-xs">Pro</h5>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">Rp</span>
                    <span className="text-3xl font-extrabold tracking-tighter">199k</span>
                    <span className="text-on-surface-variant text-sm">/bln</span>
                  </div>
                </div>
                <ul className="space-y-sm text-sm mb-xl flex-1">
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> 10 Kamera</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> 10.000 Rekaman/Bulan</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> 30 Hari Cloud Storage</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> Dedicated Support</li>
                </ul>
                <Link to="/download" className="w-full py-sm border-2 border-primary text-primary font-bold rounded hover:bg-primary hover:text-white transition-all text-center block">Pilih Paket</Link>
              </div>
              {/* Business */}
              <div className="bg-inverse-surface border border-outline p-lg rounded-xl flex flex-col text-surface">
                <div className="mb-lg">
                  <h5 className="font-label-caps text-label-caps uppercase text-primary-fixed mb-xs">Business</h5>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">Rp</span>
                    <span className="text-3xl font-extrabold tracking-tighter text-white">399k</span>
                    <span className="text-surface-variant text-sm">/bln</span>
                  </div>
                </div>
                <ul className="space-y-sm text-sm mb-xl flex-1">
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary-fixed text-[18px]">check_circle</span> Unlimited Kamera</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary-fixed text-[18px]">check_circle</span> 50.000 Rekaman/Bulan</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary-fixed text-[18px]">check_circle</span> 60 Hari Cloud Storage</li>
                  <li className="flex items-center gap-sm"><span className="material-symbols-outlined text-primary-fixed text-[18px]">check_circle</span> Custom API Integration</li>
                </ul>
                <Link to="/download" className="w-full py-sm bg-surface text-inverse-surface font-bold rounded hover:bg-primary-fixed transition-all text-center block">Hubungi Sales</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals and Footer */}
        <Footer />
      </main>
    </div>
  );
}
