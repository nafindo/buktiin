import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/images/logo.png';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuBPAXSkUc_dLhkZh4Y7ZV49jywLUrYj7TB6LZXqBoPmNBPkII_yNVIa9s-hwCaZ7wYj6_H9w__QWjYUSCOKjsxFH0crqQ7tKoEFg_qD1JTYl0bX37peDAHRsBA-zf_vIDcQcUlZMUVdcrfDltV5-k5yAdBjO2bUiJKI59PLG9Yd9ARqz4B30A1-TbZldx_umceXjERgyvgcWJN4wOaVhbEFuGglnZrElAnkbDhqpBjhWwn0qTx2rvoK');
  const [planName, setPlanName] = useState('No Plan');
  const [isSubAccount, setIsSubAccount] = useState(false);
  const [deviceLimitsError, setDeviceLimitsError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSystemBusy, setIsSystemBusy] = useState(false);

  // Initialize or get deviceId
  const getDeviceId = () => {
    let id = localStorage.getItem('buktiin_device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('buktiin_device_id', id);
    }
    return id;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      
      setUserEmail(session.user.email || 'User');
      if (session.user.user_metadata?.avatar_url) {
        setUserAvatar(session.user.user_metadata.avatar_url);
      }

      // Check subscription
      const { data: subArray } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', session.user.id)
        .eq('status', 'ACTIVE')
        .limit(1);
        
      if (!subArray || subArray.length === 0) {
        if (path !== '/plans') navigate('/plans');
      } else {
        const activeSub = subArray[0];
        if (activeSub.plans) {
          setPlanName(activeSub.plans.name + ' Plan');
        }
      }
      
      setLoading(false);

      // Perform initial check-limits
      const deviceId = getDeviceId();
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      try {
        const response = await fetch(`${API_URL}/api/check-limits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id, deviceId, forceLogin: true, accessToken: session.access_token })
        });
        const result = await response.json();
        if (result.success) {
          setIsSubAccount(result.data.isSubAccount);
          localStorage.setItem('isSubAccount', result.data.isSubAccount ? 'true' : 'false');
        } else if (!result.success && result.message === 'DEVICE_LIMIT_REACHED') {
          // This should technically not happen with forceLogin=true, but we handle just in case
          setDeviceLimitsError(true);
        }
      } catch (err) {
        console.error('Failed to check limits:', err);
      }
    };
    
    checkAuth();
  }, [navigate, path]);

  // Periodic Heartbeat
  useEffect(() => {
    let intervalId: number;
    const checkHeartbeat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const deviceId = getDeviceId();
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      try {
        const response = await fetch(`${API_URL}/api/check-limits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id, deviceId, forceLogin: false, accessToken: session.access_token }) // false so we get kicked if someone else logged in
        });
        const result = await response.json();
        
        if (response.status === 403 && result.message === 'DEVICE_LIMIT_REACHED') {
          // Kick user
          setDeviceLimitsError(true);
          await supabase.auth.signOut();
        }
      } catch (err) {
        // ignore network errors
      }
    };

    if (!loading && !deviceLimitsError) {
      intervalId = window.setInterval(checkHeartbeat, 15000); // Check every 15 seconds
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [loading, deviceLimitsError]);

  // Polling for background upload tasks
  useEffect(() => {
    let intervalId: number;
    const checkBusyStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      try {
        const { count: scanCount } = await supabase
          .from('scan_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .in('upload_status', ['PENDING', 'UPLOADING']);
          
        const { count: unboxCount } = await supabase
          .from('unboxing_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .in('upload_status', ['PENDING', 'UPLOADING']);
          
        if ((scanCount && scanCount > 0) || (unboxCount && unboxCount > 0)) {
          setIsSystemBusy(true);
        } else {
          setIsSystemBusy(false);
        }
      } catch (err) {
        // ignore network errors
      }
    };

    if (!loading && !deviceLimitsError) {
      checkBusyStatus();
      intervalId = window.setInterval(checkBusyStatus, 3000); // Check every 3 seconds
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [loading, deviceLimitsError]);

  if (deviceLimitsError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface text-on-surface">
        <div className="flex flex-col items-center gap-4 bg-surface-container-low p-xl rounded-xl border-2 border-error text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-error mb-2">devices</span>
          <p className="font-headline-md font-bold text-error">Sesi Habis</p>
          <p className="font-body-md text-on-surface-variant">
            Akun Anda (Paket Free) hanya mengizinkan 1 perangkat. Seseorang baru saja login dengan akun Anda di perangkat lain, sehingga Anda otomatis di-logout.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-lg w-full bg-primary text-white font-bold py-md px-xl rounded-lg hover:bg-on-primary-container transition-all"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">autorenew</span>
          <p className="font-headline-sm">Memeriksa Lisensi & Keamanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-on-surface">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SideNavBar */}
      <aside className={`fixed md:relative z-50 transform top-0 left-0 h-screen w-64 bg-surface-container-low dark:bg-inverse-surface border-r border-ui-divider dark:border-outline-variant p-md flex flex-col space-y-sm shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-3 mb-xl">
          <img src={logoImg} alt="Buktiin Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-headline-md text-headline-md font-bold text-primary">BUKTIIN</span>
        </div>
        
        <div className="mb-lg px-xs">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-DEFAULT overflow-hidden border border-ui-divider flex items-center justify-center shrink-0">
              <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-primary truncate max-w-[120px]">{userEmail}</p>
              <p className="font-code-sm text-code-sm text-on-surface-variant">{planName}</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-xs flex-1">
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/dashboard" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/dashboard' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="font-label-caps text-label-caps">Dashboard</span>
          </Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/scanner" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/scanner' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">qr_code_scanner</span>
            <span className="font-label-caps text-label-caps">Live Scanner</span>
          </Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/history" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/history' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">history</span>
            <span className="font-label-caps text-label-caps">Scan History</span>
          </Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/unboxing" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/unboxing' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">inventory</span>
            <span className="font-label-caps text-label-caps">Unboxing Retur</span>
          </Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/unboxing-history" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/unboxing-history' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">history_toggle_off</span>
            <span className="font-label-caps text-label-caps">Unboxing History</span>
          </Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/storage" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/storage' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="font-label-caps text-label-caps">Storage</span>
          </Link>
          {!isSubAccount && planName !== 'FREE Plan' && planName !== 'BASIC Plan' && (
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/subaccounts" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/subaccounts' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
              <span className="material-symbols-outlined">group</span>
              <span className="font-label-caps text-label-caps">Manajemen Staf</span>
            </Link>
          )}
        </nav>
        
        <div className="mt-auto border-t border-ui-divider pt-sm pb-md">
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/profile" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/profile' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">account_circle</span>
            <span className="font-label-caps text-label-caps">Profile</span>
          </Link>
          <div className="px-md mt-sm">
            <p className="font-code-sm text-code-sm text-on-surface-variant">V 4.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-lg py-md border-b border-ui-divider bg-surface dark:bg-inverse-surface z-10 shrink-0">
          <div className="flex items-center gap-md md:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 hover:bg-surface-variant rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Buktiin Logo" className="w-7 h-7 rounded shadow-sm" />
              <span className="font-headline-md text-headline-md font-bold text-primary">BUKTIIN</span>
            </div>
          </div>
          <div className="hidden md:block">
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">BUKTIIN App</h1>
          </div>
          <div className="flex items-center gap-lg">
            <button className="relative hover:bg-surface-container transition-colors p-sm rounded-full">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full"></span>
            </button>
            <Link to="/profile" className="w-10 h-10 rounded-full bg-surface-container border border-ui-divider flex items-center justify-center overflow-hidden">
              {isSystemBusy ? (
                <span className="material-symbols-outlined animate-spin text-primary">sync</span>
              ) : (
                <img className="w-full h-full object-cover" alt="User Avatar" src={userAvatar}/>
              )}
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
