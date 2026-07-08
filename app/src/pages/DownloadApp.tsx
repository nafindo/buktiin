
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DownloadApp: React.FC = () => {
  return (
    <div className="bg-background text-on-surface font-body-md industrial-pattern selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 pb-xl px-gutter flex flex-col items-center">
        <div className="text-center space-y-md max-w-3xl mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-sm bg-primary-container/10 border border-primary-container px-sm py-1 rounded-full mb-4">
            <span className="font-label-caps text-label-caps text-primary uppercase">Tersedia Sekarang</span>
          </div>
          <h1 className="font-display-md text-display-md font-extrabold text-primary leading-tight">
            Mulai Amankan <br/><span className="text-on-surface">Proses Packing Anda</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant font-medium">
            Unduh BUKTIIN untuk platform perangkat yang Anda gunakan. Dirancang khusus untuk kecepatan tinggi di environment warehouse e-commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl w-full max-w-5xl">
          {/* Windows Download */}
          <div className="bg-surface border border-ui-divider rounded-2xl p-xl flex flex-col items-center text-center shadow-lg hover:shadow-xl hover:border-primary transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <span className="material-symbols-outlined text-[180px]">desktop_windows</span>
            </div>
            
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-lg z-10 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-inner">
              <span className="material-symbols-outlined text-6xl">desktop_windows</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg font-bold mb-sm z-10">Windows PC</h2>
            <p className="text-on-surface-variant text-base mb-xl z-10">Solusi optimal untuk PC admin kasir atau workstation packing dengan OS Windows 10 & 11.</p>
            
            <a href="downloads/Buktiin-Web-Setup.exe" download className="mt-auto w-full bg-primary text-white font-bold py-4 px-xl rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all z-10 flex items-center justify-center gap-3 shadow-md hover:shadow-lg text-lg">
              <span className="material-symbols-outlined">download</span>
              Download untuk Windows
            </a>
            <div className="mt-4 text-xs text-on-surface-variant z-10 font-mono">Versi 1.0.0 • 64-bit • Gratis</div>
          </div>

          {/* Android Download */}
          <div className="bg-surface-container-lowest border border-ui-divider rounded-2xl p-xl flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[180px]">android</span>
            </div>
            
            <div className="w-24 h-24 bg-surface-variant/30 text-on-surface-variant rounded-full flex items-center justify-center mb-lg z-10">
              <span className="material-symbols-outlined text-6xl">android</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg font-bold mb-sm z-10 text-on-surface-variant">Android App</h2>
            <p className="text-on-surface-variant text-base mb-xl z-10 opacity-70">Cocok untuk mobilitas tim packer menggunakan Handphone atau Tablet Android di lapangan.</p>
            
            <button disabled className="mt-auto w-full bg-surface-variant/50 border-2 border-dashed border-outline text-on-surface-variant font-bold py-4 px-xl rounded-xl cursor-not-allowed z-10 flex items-center justify-center gap-3 text-lg">
              <span className="material-symbols-outlined">hourglass_empty</span>
              Segera Hadir
            </button>
            <div className="mt-4 text-xs text-on-surface-variant z-10">Sedang dalam tahap pengembangan akhir</div>
          </div>
        </div>
        
        <div className="text-sm text-on-surface-variant mt-24 mb-8 text-center bg-surface px-6 py-3 rounded-full border border-ui-divider shadow-sm">
          Mengalami kendala saat instalasi? <a href="#" className="text-primary font-bold hover:underline">Hubungi Tim Bantuan Kami</a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DownloadApp;
