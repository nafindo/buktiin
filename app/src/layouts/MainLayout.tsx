import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [planName, setPlanName] = useState('No Plan');
  const [isSubAccount, setIsSubAccount] = useState(false);
  const [deviceLimitsError, setDeviceLimitsError] = useState(false);

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
      try {
        const response = await fetch('http://localhost:3001/api/check-limits', {
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
      try {
        const response = await fetch('http://localhost:3001/api/check-limits', {
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
      {/* SideNavBar */}
      <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low dark:bg-inverse-surface border-r border-ui-divider dark:border-outline-variant p-md space-y-sm shrink-0">
        <div className="flex items-center gap-3 mb-xl">
          <img src="/logo.jpg" alt="Buktiin Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-headline-md text-headline-md font-bold text-primary">BUKTIIN</span>
        </div>
        
        <div className="mb-lg px-xs">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 bg-primary rounded-DEFAULT flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-primary truncate max-w-[120px]">{userEmail}</p>
              <p className="font-code-sm text-code-sm text-on-surface-variant">{planName}</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-xs flex-1">
          <Link to="/dashboard" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/dashboard' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="font-label-caps text-label-caps">Dashboard</span>
          </Link>
          <Link to="/scanner" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/scanner' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">qr_code_scanner</span>
            <span className="font-label-caps text-label-caps">Live Scanner</span>
          </Link>
          <Link to="/history" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/history' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">history</span>
            <span className="font-label-caps text-label-caps">Scan History</span>
          </Link>
          <Link to="/storage" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/storage' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="font-label-caps text-label-caps">Storage</span>
          </Link>
          {!isSubAccount && planName !== 'FREE Plan' && planName !== 'BASIC Plan' && (
            <Link to="/subaccounts" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/subaccounts' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
              <span className="material-symbols-outlined">group</span>
              <span className="font-label-caps text-label-caps">Manajemen Staf</span>
            </Link>
          )}
        </nav>
        
        <div className="mt-auto border-t border-ui-divider pt-sm pb-md">
          <Link to="/profile" className={`flex items-center gap-md p-md transition-all rounded-DEFAULT ${path === '/profile' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant'}`}>
            <span className="material-symbols-outlined">account_circle</span>
            <span className="font-label-caps text-label-caps">Profile</span>
          </Link>
          <button 
            onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
            className="flex items-center gap-md p-md w-full transition-all rounded-DEFAULT text-error hover:bg-error-container hover:text-on-error-container mt-xs"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-caps text-label-caps">Logout</span>
          </button>
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
            <span className="material-symbols-outlined text-primary">menu</span>
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Buktiin Logo" className="w-7 h-7 rounded shadow-sm" />
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
              <img className="w-full h-full object-cover" alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6ELpYW01Va6uSsSddcFeC0g8lyEsrRd9fWZEQSywco_m7wihxefaRSLH1fofEYL2KhXTKlo8BHOC36jHjIIDJtb4UUtGAXkNlMYPqDTqJEeeblmr2JAOurClIgjT3EENPyYOVl4eHkZBDIP3Ss0erPJTZQ_ydvnUB-NOGsJVYmtn2oXKnAU_fsqaDDUQg-e3MEMndT7oqwYrOcOGXZC_0CbCGM5E9Pi4BqLzUwJfESfJOf7JV1YVB"/>
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
