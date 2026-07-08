import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';

export default function LaunchApp() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Membuka aplikasi...');
  
  useEffect(() => {
    // Attempt to open the custom protocol URI
    window.location.href = 'buktiin://login';

    // Set a timeout to redirect to download page if the app doesn't open
    const timeout = setTimeout(() => {
      setStatus('Aplikasi tidak ditemukan. Mengarahkan ke halaman download...');
      setTimeout(() => {
        // We can redirect to download or a specific section on the web
        // But for now, we'll go to the /login page where they can see the download options,
        // or a dedicated /download route if it exists.
        navigate('/download');
      }, 1500);
    }, 2500);

    // If the window goes out of focus, it means the app probably opened successfully.
    // Clear the timeout so we don't redirect them.
    const handleBlur = () => {
      clearTimeout(timeout);
      setStatus('Aplikasi berhasil dibuka!');
      setTimeout(() => navigate('/'), 2000);
    };

    window.addEventListener('blur', handleBlur);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('blur', handleBlur);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-md">
      <img src={logoImg} alt="Buktiin Logo" className="w-16 h-16 rounded-xl shadow-lg mb-lg animate-pulse" />
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-md">BUKTIIN Launcher</h1>
      <p className="font-body-md text-on-surface-variant text-center max-w-sm">
        {status}
      </p>
      
      <div className="mt-xl">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
