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
    };
    
    checkAuth();
  }, [navigate, path]);

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
        <div className="flex items-center gap-2 mb-xl">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
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
            <span className="font-headline-md text-headline-md font-bold text-primary">BUKTIIN</span>
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
