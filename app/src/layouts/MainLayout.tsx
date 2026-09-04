import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { syncPendingUploads } from '../lib/driveUpload';
import { getDeviceId, registerDeviceSession, checkIsActiveDevice, listenToDeviceSession } from '../lib/deviceSession';
import logoImg from '../assets/images/logo.png';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuBPAXSkUc_dLhkZh4Y7ZV49jywLUrYj7TB6LZXqBoPmNBPkII_yNVIa9s-hwCaZ7wYj6_H9w__QWjYUSCOKjsxFH0crqQ7tKoEFg_qD1JTYl0bX37peDAHRsBA-zf_vIDcQcUlZMUVdcrfDltV5-k5yAdBjO2bUiJKI59PLG9Yd9ARqz4B30A1-TbZldx_umceXjERgyvgcWJN4wOaVhbEFuGglnZrElAnkbDhqpBjhWwn0qTx2rvoK');
  const [planName, setPlanName] = useState('No Plan');
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [isSubAccount, setIsSubAccount] = useState(() => localStorage.getItem('isSubAccount') === 'true');
  const [deviceLimitsError, setDeviceLimitsError] = useState(false);
  const [isSystemBusy, setIsSystemBusy] = useState(false);
  const cleanupDeviceListenerRef = useRef<(() => void) | null>(null);

  // Single-device session & Auth check
  useEffect(() => {
    let isMounted = true;

    const checkAuthAndSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      
      setUserEmail(session.user.email || 'User');
      if (session.user.user_metadata?.avatar_url) {
        setUserAvatar(session.user.user_metadata.avatar_url);
      }

      // Check if this account is a registered sub-account of another owner
      let targetOwnerId = session.user.id;
      let userIsSub = false;
      try {
        const { data: subRow } = await supabase
          .from('sub_accounts')
          .select('parent_id')
          .eq('child_id', session.user.id)
          .maybeSingle();

        if (subRow) {
          userIsSub = true;
          setIsSubAccount(true);
          localStorage.setItem('isSubAccount', 'true');
          localStorage.setItem('parentId', subRow.parent_id);
          targetOwnerId = subRow.parent_id;
        } else {
          setIsSubAccount(false);
          localStorage.removeItem('isSubAccount');
          localStorage.removeItem('parentId');
        }
      } catch (_) {}

      // Check subscription of effective owner
      const { data: subArray } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', targetOwnerId)
        .order('created_at', { ascending: false });
        
      if (!subArray || subArray.length === 0) {
        // User baru yang belum punya langganan -> Auto inisialisasi FREE Plan 7 Hari
        try {
          const { data: freePlan } = await supabase
            .from('plans')
            .select('id, name')
            .ilike('name', 'FREE')
            .maybeSingle();

          if (freePlan) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);

            await supabase.from('subscriptions').insert({
              user_id: targetOwnerId,
              plan_id: freePlan.id,
              status: 'ACTIVE',
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              payment_method: 'FREE_TRIAL_7D',
              amount_paid: 0,
              user_email: session.user.email,
              notes: 'Auto Free Trial 7 Hari (Akun Baru)'
            });

            setPlanName('FREE Plan (7 Hari)');
            setIsSubscriptionExpired(false);
          } else {
            if (path !== '/plans' && !userIsSub) navigate('/plans');
          }
        } catch (planErr) {
          console.warn('Auto provision free plan in layout:', planErr);
          if (path !== '/plans' && !userIsSub) navigate('/plans');
        }
      } else {
        const activeSub = subArray.find((s) => s.status === 'ACTIVE');
        if (activeSub) {
          const isExpired = activeSub.end_date && (new Date(activeSub.end_date).getTime() <= Date.now());
          if (isExpired) {
            setIsSubscriptionExpired(true);
            setPlanName('EXPIRED (OFF)');
            supabase
              .from('subscriptions')
              .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
              .eq('id', activeSub.id)
              .then();

            const restrictedPaths = ['/scanner', '/unboxing', '/storage', '/subaccounts'];
            if (restrictedPaths.some((p) => path.startsWith(p)) && !userIsSub) {
              navigate('/plans');
            }
          } else {
            setIsSubscriptionExpired(false);
            if (activeSub.plans) {
              setPlanName(activeSub.plans.name + ' Plan');
            }
          }
        } else {
          const pendingSub = subArray.find((s) => s.status === 'PENDING_APPROVAL');
          if (pendingSub) {
            setPlanName('Menunggu Approval');
            setIsSubscriptionExpired(false);
          } else {
            setIsSubscriptionExpired(true);
            setPlanName('OFF / Expired');
            const restrictedPaths = ['/scanner', '/unboxing', '/storage', '/subaccounts'];
            if (restrictedPaths.some((p) => path.startsWith(p)) && !userIsSub) {
              navigate('/plans');
            }
          }
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }

      // Single-device enforcement (1 Akun 1 Device)
      const myDeviceId = getDeviceId();
      const userId = session.user.id;

      // 1. Initial active device verification
      const isActive = await checkIsActiveDevice(userId, myDeviceId);
      if (!isActive) {
        console.warn('[SingleDevice] Another device is currently active, logging out.');
        setDeviceLimitsError(true);
        await supabase.auth.signOut();
        return;
      }

      // If active_device_id is not set on user yet, register this device
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.user_metadata?.active_device_id) {
        await registerDeviceSession(userId, myDeviceId);
      }

      // 2. Attach continuous realtime & periodic listener
      if (cleanupDeviceListenerRef.current) {
        cleanupDeviceListenerRef.current();
      }

      cleanupDeviceListenerRef.current = listenToDeviceSession(userId, myDeviceId, async () => {
        console.warn('[SingleDevice] Force logout triggered for this device!');
        setDeviceLimitsError(true);
        await supabase.auth.signOut();
      });
    };
    
    checkAuthAndSession();

    return () => {
      isMounted = false;
      if (cleanupDeviceListenerRef.current) {
        cleanupDeviceListenerRef.current();
        cleanupDeviceListenerRef.current = null;
      }
    };
  }, [navigate]);

  // Polling for background upload tasks & auto-sync
  useEffect(() => {
    let intervalId: number;
    let syncCounter = 0;

    const checkBusyStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      try {
        const { count: pendingCount } = await supabase
          .from('recordings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .in('upload_status', ['PENDING', 'UPLOADING']);
          
        if (pendingCount && pendingCount > 0) {
          setIsSystemBusy(true);
        } else {
          setIsSystemBusy(false);
        }

        // Trigger syncPendingUploads every ~15 seconds (every 3 polling cycles)
        syncCounter++;
        if (syncCounter >= 3) {
          syncCounter = 0;
          syncPendingUploads().catch(() => {});
        }
      } catch (err) {
        // ignore network errors
      }
    };

    if (!loading && !deviceLimitsError) {
      checkBusyStatus();
      intervalId = window.setInterval(checkBusyStatus, 5000); // Check every 5 seconds
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
    <div className="flex h-screen w-screen overflow-hidden bg-surface font-body-md text-on-surface">
      {/* SideNavBar - Permanent in Landscape View */}
      <aside className="h-screen w-36 sm:w-40 bg-surface-container-low dark:bg-inverse-surface border-r border-ui-divider dark:border-outline-variant p-1.5 flex flex-col space-y-0.5 shrink-0 z-20">
        <div className="flex items-center gap-1.5 py-1 px-1 mb-1 border-b border-ui-divider">
          <img src={logoImg} alt="Buktiin Logo" className="w-4 h-4 rounded shadow-sm" />
          <span className="font-headline-md text-xs font-bold text-primary">BUKTIIN</span>
        </div>
        
        <nav className="space-y-0.5 flex-1 overflow-y-auto pt-0.5">
          <Link to="/dashboard" className={`flex items-center gap-1.5 p-1.5 transition-all rounded-md text-[11px] ${path === '/dashboard' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-2 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="font-label-caps truncate">Dashboard</span>
          </Link>
          <Link to="/scanner" className={`flex items-center gap-1.5 p-1.5 transition-all rounded-md text-[11px] ${path === '/scanner' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-2 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
            <span className="font-label-caps truncate">Live Scanner</span>
          </Link>
          <Link to="/history" className={`flex items-center gap-1.5 p-1.5 transition-all rounded-md text-[11px] ${path === '/history' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-2 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-sm">history</span>
            <span className="font-label-caps truncate">Riwayat Scan</span>
          </Link>
          <Link to="/unboxing" className={`flex items-center gap-1.5 p-1.5 transition-all rounded-md text-[11px] ${path === '/unboxing' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-2 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-sm">inventory</span>
            <span className="font-label-caps truncate">Unboxing Retur</span>
          </Link>
          <Link to="/unboxing-history" className={`flex items-center gap-1.5 p-1.5 transition-all rounded-md text-[11px] ${path === '/unboxing-history' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-2 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-sm">history_toggle_off</span>
            <span className="font-label-caps truncate">Riwayat Unbox</span>
          </Link>
          <Link to="/storage" className={`flex items-center gap-1.5 p-1.5 transition-all rounded-md text-[11px] ${path === '/storage' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-2 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            <span className="font-label-caps truncate">Storage</span>
          </Link>
          {!isSubAccount && !planName.toUpperCase().includes('FREE') && !planName.toUpperCase().includes('BASIC') && planName !== 'No Plan' && (
            <Link to="/subaccounts" className={`flex items-center gap-1.5 p-1.5 transition-all rounded-md text-[11px] ${path === '/subaccounts' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-2 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant'}`}>
              <span className="material-symbols-outlined text-sm">group</span>
              <span className="font-label-caps truncate">Staf</span>
            </Link>
          )}
        </nav>
        
        <div className="mt-auto border-t border-ui-divider pt-1">
          <Link to="/profile" className={`flex items-center gap-1.5 p-1.5 transition-all rounded-md text-[11px] ${path === '/profile' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold border-l-2 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant'}`}>
            <span className="material-symbols-outlined text-sm">account_circle</span>
            <span className="font-label-caps truncate">Profil</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TopNavBar (Ultra-Slim 24px height, without hamburger) */}
        <header className="flex justify-between items-center w-full px-2 py-0.5 border-b border-ui-divider bg-surface dark:bg-inverse-surface z-10 shrink-0 h-6 sm:h-7">
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-bold">
            <span>● ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="relative hover:bg-surface-container transition-colors p-0.5 rounded-full" title="Notifikasi">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">notifications</span>
              <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-status-error rounded-full"></span>
            </button>
            <Link to="/profile" title={userEmail} className="w-5 h-5 rounded-full bg-surface-container border border-ui-divider flex items-center justify-center overflow-hidden">
              {isSystemBusy ? (
                <span className="material-symbols-outlined animate-spin text-xs text-primary">sync</span>
              ) : (
                <img className="w-full h-full object-cover" alt="User Avatar" src={userAvatar}/>
              )}
            </Link>
          </div>
        </header>

        {/* Expired Subscription Alert Banner */}
        {isSubscriptionExpired && path !== '/plans' && (
          <div className="bg-red-600 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between shadow z-30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>Masa aktif paket Anda telah berakhir (OFF). Scanner & rekaman dinonaktifkan.</span>
            </div>
            <Link to="/plans" className="bg-white text-red-700 px-2.5 py-0.5 rounded text-[11px] font-black hover:bg-gray-100 transition-colors">
              Perpanjang / Upgrade Sekarang
            </Link>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* 1 Akun 1 Device Force Logout Modal */}
      {deviceLimitsError && (
        <div className="fixed inset-0 bg-black/85 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface border border-status-error/40 rounded-2xl max-w-sm w-full p-5 flex flex-col items-center text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl">phonelink_lock</span>
            </div>
            <h3 className="font-bold text-base text-on-surface mb-1.5">Akun Dikeluarkan Otomatis</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Akun Anda baru saja login di perangkat lain (PC / HP lain). Sesuai aturan <span className="font-bold text-primary">1 Akun untuk 1 Perangkat</span>, sesi pada perangkat ini telah diakhiri secara otomatis.
            </p>
            <button
              onClick={() => {
                setDeviceLimitsError(false);
                navigate('/login');
              }}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow"
            >
              Masuk Kembali di Perangkat Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
