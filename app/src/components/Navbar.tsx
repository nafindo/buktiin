import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleScroll = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface border-b border-ui-divider flex justify-center">
      <nav className="w-full max-w-container-max flex justify-between items-center px-lg py-md h-20">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoImg} alt="Buktiin Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tighter">BUKTIIN</span>
        </Link>
        <div className="hidden md:flex items-center gap-xl">
          <button onClick={() => handleScroll('features')} className="text-on-surface-variant hover:text-primary transition-colors font-body-md">Fitur</button>
          <button onClick={() => handleScroll('benefits')} className="text-on-surface-variant hover:text-primary transition-colors font-body-md">Manfaat</button>
          <button onClick={() => handleScroll('pricing')} className="text-on-surface-variant hover:text-primary transition-colors font-body-md">Harga</button>
          <button onClick={() => {
            if (location.pathname !== '/') navigate('/');
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
          }} className="text-on-surface-variant hover:text-primary transition-colors font-body-md">Bantuan</button>
          <Link to="/download" className={`font-body-md transition-colors ${location.pathname === '/download' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}>Download</Link>
        </div>
        <div className="flex items-center gap-md">
          <Link to="/download" className="bg-primary text-on-primary px-lg py-sm font-bold rounded hover:opacity-90 transition-opacity">
            Mulai Sekarang
          </Link>
        </div>
      </nav>
    </header>
  );
}
