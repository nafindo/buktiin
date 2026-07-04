import React from 'react';
import Navbar from '../components/Navbar';

const DownloadApp: React.FC = () => {
  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col industrial-pattern">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-xl gap-xl max-w-container-max mx-auto w-full">
        <div className="text-center space-y-sm max-w-2xl">
          <h1 className="font-display-md text-display-md font-extrabold text-primary">Download BUKTIIN</h1>
          <p className="text-body-lg text-on-surface-variant font-medium">
            Tingkatkan keamanan operasional toko Anda. Pilih platform perangkat yang Anda gunakan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl w-full max-w-4xl">
          {/* Windows Download */}
          <div className="bg-surface border border-ui-divider rounded-2xl p-xl flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[150px]">desktop_windows</span>
            </div>
            
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-md z-10">
              <span className="material-symbols-outlined text-5xl">desktop_windows</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg font-bold mb-xs z-10">Windows PC</h2>
            <p className="text-on-surface-variant text-sm mb-lg z-10">Cocok untuk PC kasir / admin warehouse dengan OS Windows 10 & 11.</p>
            
            <button className="mt-auto w-full bg-primary text-white font-bold py-md px-xl rounded-xl hover:opacity-90 transition-opacity z-10 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
              <span className="material-symbols-outlined">download</span>
              Download (x64)
            </button>
          </div>

          {/* Android Download */}
          <div className="bg-surface border border-ui-divider rounded-2xl p-xl flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[150px]">android</span>
            </div>
            
            <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-md z-10">
              <span className="material-symbols-outlined text-5xl">android</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg font-bold mb-xs z-10">Android App</h2>
            <p className="text-on-surface-variant text-sm mb-lg z-10">Cocok untuk mobilitas tim packer menggunakan HP atau Tablet Android.</p>
            
            <button className="mt-auto w-full bg-surface-container border-2 border-dashed border-on-surface-variant text-on-surface-variant font-bold py-md px-xl rounded-xl cursor-not-allowed z-10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">hourglass_empty</span>
              Segera Hadir
            </button>
          </div>
        </div>
        
        <div className="text-sm text-on-surface-variant mt-xl text-center">
          Mengalami kendala instalasi? <a href="#" className="text-primary hover:underline">Hubungi Bantuan</a>
        </div>
      </main>
    </div>
  );
};

export default DownloadApp;
