import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPin, setShowPin] = useState(false);

  // Live Notifications State
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const fetchPendingPayments = async () => {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('status', 'PENDING_APPROVAL')
        .order('created_at', { ascending: false });

      if (data) {
        setPendingPayments(data);
      }
    } catch (err) {
      console.warn('Failed to fetch pending payments count:', err);
    }
  };

  useEffect(() => {
    const savedPin = localStorage.getItem('admin_pin');
    if (savedPin) {
      setIsAuthenticated(true);
      fetchPendingPayments();
    }
    setCheckingAuth(false);

    // Close notifications dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Realtime channel for live subscription notifications
    const channel = supabase
      .channel('admin-layout-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        fetchPendingPayments();
      })
      .subscribe();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: rpcError } = await supabase.rpc('get_admin_dashboard_stats', { pin_code: pin });
      if (rpcError) throw rpcError;

      localStorage.setItem('admin_pin', pin);
      setIsAuthenticated(true);
      fetchPendingPayments();
    } catch (err: any) {
      console.error(err);
      setError('PIN tidak valid atau terjadi kesalahan server.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-container flex items-center justify-center p-4 sm:p-lg">
        <form onSubmit={handleLogin} className="bg-surface border border-ui-divider p-6 sm:p-xl rounded-3xl w-full max-w-md flex flex-col gap-6 shadow-xl">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Buktiin Admin Console</h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Masukkan kode PIN untuk mengakses kontrol admin.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface">Kode PIN Admin</label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-surface-container border border-ui-divider rounded-xl pl-4 pr-12 py-3 text-center focus:border-primary outline-none font-mono text-xl tracking-[0.4em]"
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
            {error && <p className="text-status-error text-xs font-medium mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                <span>Memverifikasi PIN...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">lock_open</span>
                <span>Masuk ke Admin Console</span>
              </>
            )}
          </button>

          {localStorage.getItem('is_admin_mode') !== 'true' && (
            <div className="text-center pt-2 border-t border-ui-divider">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs text-on-surface-variant hover:text-primary font-bold transition-colors"
              >
                ← Kembali ke Aplikasi Buktiin
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  const pendingCount = pendingPayments.length;

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen">
      {/* SideNavBar Shell (Always visible, exactly like web) */}
      <aside className="flex flex-col h-screen py-lg px-md w-64 fixed left-0 top-0 border-r border-ui-divider bg-surface z-50">
        <div className="mb-xl">
          <h1 className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
            Admin Console
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Buktiin Evidence System</p>
        </div>

        <nav className="flex-1 space-y-xs overflow-y-auto">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-md px-md py-sm transition-colors duration-200 ease-in-out font-body-md text-body-md rounded-xl ${
              path.includes('/dashboard')
                ? 'text-primary font-bold border-r-2 border-primary bg-surface-container'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>

          <Link
            to="/admin/subscriptions"
            className={`flex items-center justify-between px-md py-sm transition-colors duration-200 ease-in-out font-body-md text-body-md rounded-xl ${
              path.includes('/subscriptions')
                ? 'text-primary font-bold border-r-2 border-primary bg-surface-container'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-amber-500">verified</span>
              Persetujuan Langganan
            </div>
            {pendingCount > 0 ? (
              <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                {pendingCount}
              </span>
            ) : (
              <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                QRIS
              </span>
            )}
          </Link>

          <Link
            to="/admin/users"
            className={`flex items-center justify-between px-md py-sm transition-colors duration-200 ease-in-out font-body-md text-body-md rounded-xl ${
              path.includes('/users')
                ? 'text-primary font-bold border-r-2 border-primary bg-surface-container'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined">group</span>
              User Management
            </div>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title={`${pendingCount} pembayaran menunggu approval`}></span>
            )}
          </Link>

          <Link
            to="/admin/plans"
            className={`flex items-center gap-md px-md py-sm transition-colors duration-200 ease-in-out font-body-md text-body-md rounded-xl ${
              path.includes('/plans')
                ? 'text-primary font-bold border-r-2 border-primary bg-surface-container'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined">settings_applications</span>
            Plan Configuration
          </Link>

          <Link
            to="/admin/storage"
            className={`flex items-center gap-md px-md py-sm transition-colors duration-200 ease-in-out font-body-md text-body-md rounded-xl ${
              path.includes('/storage')
                ? 'text-primary font-bold border-r-2 border-primary bg-surface-container'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined">receipt_long</span>
            Cluster Storage
          </Link>
        </nav>

        <div className="mt-auto pt-lg border-t border-ui-divider space-y-xs">
          <Link
            to="/admin/users"
            className="w-full bg-primary-container text-on-primary-container py-md px-md font-bold text-center block rounded-xl hover:opacity-90 transition-opacity text-xs"
          >
            Kelola Pengguna
          </Link>
          <a
            href="https://wa.me/6281232797271"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-md px-md py-sm font-body-md text-xs text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-green-600 text-base">chat</span>
            WhatsApp Support
          </a>
        </div>
      </aside>

      {/* TopAppBar Shell */}
      <header className="flex justify-between items-center h-16 px-lg ml-64 border-b border-ui-divider bg-surface fixed top-0 right-0 left-0 z-40">
        <div className="flex items-center gap-xl">
          <span className="font-headline-md text-headline-md font-bold text-on-surface">BUKTIIN Admin</span>
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="pl-10 pr-md py-xs bg-surface-container border border-ui-divider focus:border-primary outline-none font-body-md text-body-md w-64 rounded-lg text-xs"
              placeholder="Cari operasi..."
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-lg">
          {/* Interactive Notification Bell */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative hover:bg-surface-container-low p-2 rounded-xl transition-all"
              title="Notifikasi Pembayaran & Sistem"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-amber-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full shadow animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-ui-divider rounded-2xl shadow-2xl z-50 overflow-hidden animate-[fade-in_0.15s_ease-out]">
                <div className="p-3.5 border-b border-ui-divider flex items-center justify-between bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-lg">notifications_active</span>
                    <span className="text-xs font-bold text-on-surface">Notifikasi Pembayaran ({pendingCount})</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      Menunggu Approval
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-ui-divider text-xs">
                  {pendingCount > 0 ? (
                    pendingPayments.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 hover:bg-surface-container-low transition-colors flex flex-col gap-1.5 cursor-pointer"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/admin/users');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary text-[11px] bg-primary/10 px-2 py-0.5 rounded">
                            {sub.plans?.name || 'Paket'} Plan
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            {new Date(sub.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <p className="font-bold text-on-surface truncate">{sub.user_name || sub.user_email || 'Pengguna'}</p>
                        <p className="text-[11px] text-on-surface-variant truncate">{sub.user_email}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-extrabold text-on-surface text-xs">
                            {sub.amount_paid
                              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(sub.amount_paid)
                              : sub.plans?.price
                              ? `Rp ${sub.plans.price.toLocaleString('id-ID')}`
                              : 'Kustom'}
                          </span>
                          <span className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5">
                            Lihat & Approve
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-2xl text-status-success mb-1">check_circle</span>
                      <p className="font-bold text-xs">Tidak Ada Pembayaran Pending</p>
                      <p className="text-[11px] mt-0.5">Semua pengajuan pembayaran langganan sudah diproses.</p>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-ui-divider bg-surface-container-low text-center">
                  <Link
                    to="/admin/users"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-primary font-bold hover:underline"
                  >
                    Buka User Management & Approval →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <a
            href="https://wa.me/6281232797271"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-surface-container-low p-2 rounded-xl transition-all text-on-surface-variant"
            title="Bantuan WhatsApp"
          >
            <span className="material-symbols-outlined text-xl">help</span>
          </a>

          <div className="h-8 w-px bg-ui-divider"></div>

          <div className="flex items-center gap-md py-xs px-sm rounded transition-all">
            <div className="text-right">
              <p className="font-body-md text-body-md font-bold leading-none">Admin Buktiin</p>
              <p className="font-code-sm text-code-sm text-on-surface-variant">Superuser</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              AD
            </div>
          </div>

          {/* Quick Lock / Logout PIN Button */}
          <button
            onClick={() => {
              if (window.confirm('Kunci sesi Admin Console?')) {
                localStorage.removeItem('admin_pin');
                setIsAuthenticated(false);
                setPin('');
              }
            }}
            className="hover:bg-red-50 dark:hover:bg-red-950/40 text-on-surface-variant hover:text-status-error p-2 rounded-xl transition-all flex items-center gap-1"
            title="Kunci / Keluar Admin"
          >
            <span className="material-symbols-outlined text-xl">lock</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-64 mt-16 relative min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
