import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminLayout() {
  const location = useLocation();
  const path = location.pathname;

  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem('admin_pin');
    if (savedPin) {
      // Very basic check, assume it's valid if it exists. 
      // The child pages will fail gracefully if it's actually invalid.
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Test the PIN by calling the RPC
      const { error: rpcError } = await supabase.rpc('get_admin_dashboard_stats', { pin_code: pin });
      if (rpcError) throw rpcError;
      
      localStorage.setItem('admin_pin', pin);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error(err);
      setError('Invalid PIN or Server Error');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-container flex items-center justify-center p-lg">
        <form onSubmit={handleLogin} className="bg-surface border border-ui-divider p-xl rounded-2xl w-full max-w-md flex flex-col gap-lg shadow-sm">
          <div className="text-center">
            <span className="material-symbols-outlined text-primary text-4xl mb-sm">admin_panel_settings</span>
            <h2 className="font-headline-lg text-headline-lg">Admin Console</h2>
            <p className="font-body-md text-on-surface-variant">Enter your PIN to access the admin area.</p>
          </div>
          
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md">PIN Code</label>
            <div className="relative">
              <input 
                type={showPin ? "text" : "password"} 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-surface-container border border-ui-divider rounded-lg pl-md pr-12 py-sm focus:border-primary outline-none font-code-md tracking-[0.5em]"
                placeholder="••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPin ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {error && <p className="text-status-error font-code-sm text-sm">{error}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-on-primary py-sm rounded-lg font-label-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Authenticating...' : 'Enter Console'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body-md">
      {/* SideNavBar Shell */}
      <aside className="flex flex-col h-screen py-lg px-md h-full w-64 fixed left-0 top-0 border-r border-ui-divider bg-surface z-50">
        <div className="mb-xl">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Admin Console</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Warehouse System</p>
        </div>
        
        <nav className="flex-1 space-y-xs">
          <Link to="/admin/dashboard" className={`flex items-center gap-md px-md py-sm transition-colors duration-200 ease-in-out font-body-md text-body-md ${path.includes('/dashboard') ? 'text-primary font-bold border-r-2 border-primary bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>
          <Link to="/admin/users" className={`flex items-center gap-md px-md py-sm transition-colors duration-200 ease-in-out font-body-md text-body-md ${path.includes('/users') ? 'text-primary font-bold border-r-2 border-primary bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined">group</span>
            User Management
          </Link>
          <Link to="/admin/plans" className={`flex items-center gap-md px-md py-sm transition-colors duration-200 ease-in-out font-body-md text-body-md ${path.includes('/plans') ? 'text-primary font-bold border-r-2 border-primary bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined">settings_applications</span>
            Plan Configuration
          </Link>
          <Link to="/admin/storage" className={`flex items-center gap-md px-md py-sm transition-colors duration-200 ease-in-out font-body-md text-body-md ${path.includes('/storage') ? 'text-primary font-bold border-r-2 border-primary bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined">receipt_long</span>
            Cluster Storage
          </Link>
        </nav>
        
        <div className="mt-auto pt-lg border-t border-ui-divider space-y-xs">
          <button className="w-full bg-primary-container text-on-primary-container py-md px-md font-bold text-center mb-md hover:opacity-90 transition-opacity">
            New Entry
          </button>
          <Link to="#" className="flex items-center gap-md px-md py-sm font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-low">
            <span className="material-symbols-outlined">help</span>
            Support
          </Link>
          <Link to="#" className="flex items-center gap-md px-md py-sm font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-low">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </Link>
        </div>
      </aside>

      {/* TopAppBar Shell */}
      <header className="flex justify-between items-center h-16 px-lg ml-64 border-b border-ui-divider bg-surface fixed top-0 right-0 left-0 z-40">
        <div className="flex items-center gap-xl">
          <span className="font-headline-md text-headline-md font-bold text-on-surface">BUKTIIN Admin</span>
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="pl-10 pr-md py-xs bg-surface-container border border-ui-divider focus:border-primary outline-none font-body-md text-body-md w-64" placeholder="Search operations..." type="text"/>
          </div>
        </div>
        <div className="flex items-center gap-lg">
          <button className="relative hover:bg-surface-container-low p-xs rounded transition-all">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <button className="hover:bg-surface-container-low p-xs rounded transition-all">
            <span className="material-symbols-outlined">help</span>
          </button>
          <div className="h-8 w-px bg-ui-divider"></div>
          <div className="flex items-center gap-md cursor-pointer hover:bg-surface-container-low py-xs px-sm rounded transition-all">
            <div className="text-right">
              <p className="font-body-md text-body-md font-bold leading-none">Admin Profile</p>
              <p className="font-code-sm text-code-sm text-on-surface-variant">Superuser</p>
            </div>
            <img className="w-10 h-10 rounded-full object-cover border border-ui-divider" alt="Admin" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkoRNWA9pwgMHRiqUQ7KUh6nlTJtQGAH2v7GD40kVgCyYj83icVIld8DHgv-Rae63XvR5Jl2GoHezzvU-9JJk8wn8zTW_cgIi-EkMcr_FeyCmpvR94bvo8QIp8nPQJoDjei2FoTeqFjNwNsa8F3KPmuRUHTScY8HZJbwP4b27UOfhf2Y043-xcvrmhXHbFnxQDOV3agjfK9zhMxpLsOnBj6a0gF4NklyZZ74ghBqurS5SbUDIq0scP"/>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-64 mt-16 relative min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
