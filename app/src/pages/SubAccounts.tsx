import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, createIsolatedSupabaseClient } from '../lib/supabase';

interface SubAccount {
  id: string;
  child_id: string;
  parent_id: string;
  email: string;
  created_at: string;
}

export default function SubAccounts() {
  const navigate = useNavigate();
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [extraAccounts, setExtraAccounts] = useState(0);
  const [planName, setPlanName] = useState('FREE');

  useEffect(() => {
    fetchData();
  }, []);

  const getPlanDeviceLimit = (plan: string): number => {
    const p = (plan || '').toUpperCase().trim();
    if (p === 'FREE' || p === 'BASIC') return 1;
    if (p === 'STARTER') return 3;
    if (p === 'PRO') return 5;
    if (p === 'BUSINESS') return 10;
    if (p === 'ENTERPRISE') return 999999;
    return 1;
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUserId(session.user.id);

      // 1. Fetch user's active subscription & plan limits directly from Supabase
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', session.user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1);

      let currentPlan = 'FREE';
      let baseLimit = 1;
      let addonAccounts = Number(session.user.user_metadata?.extra_accounts || 0);

      if (subsData && subsData.length > 0 && subsData[0].plans) {
        const plan = subsData[0].plans;
        currentPlan = plan.name || 'FREE';
        baseLimit = plan.accountlimit || plan.accountLimit || getPlanDeviceLimit(currentPlan);
        const subExtra = Number(subsData[0].extra_accounts || 0);
        if (subExtra > addonAccounts) {
          addonAccounts = subExtra;
        }
      } else {
        // Fallback: check if plan is stored in user metadata
        const metaPlan = session.user.user_metadata?.plan;
        if (metaPlan) {
          currentPlan = metaPlan;
          baseLimit = getPlanDeviceLimit(metaPlan);
        }
      }

      const totalLimit = (baseLimit >= 999999) ? 999999 : (baseLimit + addonAccounts);

      setPlanName(currentPlan);
      setExtraAccounts(addonAccounts);
      setDeviceLimit(totalLimit);

      // 2. Fetch existing sub-accounts directly from Supabase
      const { data: subList, error: subError } = await supabase
        .from('sub_accounts')
        .select('*')
        .eq('parent_id', session.user.id)
        .order('created_at', { ascending: true });

      if (subError) {
        console.warn('Sub-accounts fetch note:', subError);
      } else if (subList) {
        setSubAccounts(subList);
      }
    } catch (err: any) {
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations based on user prompt:
  // total limit = 1 -> 1 master, 0 sub-account
  // total limit = 3 -> 1 master, 2 sub-accounts
  // total limit = 5 -> 1 master, 4 sub-accounts
  // total limit = 10 -> 1 master, 9 sub-accounts
  const maxSubAccounts = Math.max(0, deviceLimit - 1);
  const isPlanAllowed = planName !== 'FREE' && maxSubAccounts > 0;
  const isLimitReached = subAccounts.length >= maxSubAccounts;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (!isPlanAllowed) {
      setErrorMsg(`Paket ${planName} tidak mendukung penambahan sub-akun staf.`);
      return;
    }

    if (isLimitReached) {
      setErrorMsg(`Batas staf untuk paket ${planName} telah tercapai (${maxSubAccounts} sub-akun).`);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password staf minimal 6 karakter.');
      return;
    }

    setAdding(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Create staff user in Supabase Auth using isolated client
      // (isolated client prevents logging out the current parent session)
      const isolatedClient = createIsolatedSupabaseClient();
      const { data: authData, error: authError } = await isolatedClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: staffName.trim() || cleanEmail.split('@')[0],
            is_sub_account: true,
            parent_id: userId
          }
        }
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Gagal mendaftarkan akun staf di sistem auth.');
      }

      const childId = authData.user.id;

      // 2. Insert link record into public.sub_accounts
      const { error: insertError } = await supabase
        .from('sub_accounts')
        .insert({
          child_id: childId,
          parent_id: userId,
          email: cleanEmail
        });

      if (insertError) {
        throw insertError;
      }

      setStaffName('');
      setEmail('');
      setPassword('');
      setSuccessMsg(`Akun staf ${cleanEmail} berhasil didaftarkan! Staf dapat langsung login di perangkat masing-masing.`);
      fetchData();
    } catch (err: any) {
      console.error('Add subaccount error:', err);
      setErrorMsg(err.message || 'Gagal menambahkan akun staf.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, staffEmail: string) => {
    if (!window.confirm(`Hapus akses staf ${staffEmail}? Staf tidak dapat lagi login di perangkatnya.`)) return;

    try {
      const { error } = await supabase
        .from('sub_accounts')
        .delete()
        .eq('id', id)
        .eq('parent_id', userId);

      if (error) throw error;
      setSuccessMsg(`Akses staf ${staffEmail} telah dihapus.`);
      fetchData();
    } catch (err: any) {
      console.error('Delete subaccount error:', err);
      alert('Gagal menghapus akun staf: ' + (err.message || String(err)));
    }
  };

  return (
    <div className="p-3 sm:p-5 max-w-5xl mx-auto min-h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="border-b border-ui-divider pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">group</span>
            Manajemen Staf & Multi-Perangkat
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Solusi multi-device agar staf packing dapat login di HP masing-masing menggunakan kuota paket ({planName} Plan).
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-auto bg-surface-container hover:bg-surface-variant border border-ui-divider px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin text-primary' : ''}`}>sync</span>
          Segarkan
        </button>
      </div>

      {/* Info Notice: 1 Device 1 Account Protection */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 flex items-start gap-3 text-xs">
        <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">devices</span>
        <div className="text-on-surface-variant leading-relaxed">
          <p className="font-bold text-on-surface mb-0.5">Ketentuan Multi-Perangkat (1 Akun = 1 Device):</p>
          Sistem Buktiin menerapkan keamanan 1 perangkat per akun. Agar staf toko tidak saling me-logout saat bekerja bersamaan di beberapa perangkat, tambahkan akun staf di bawah ini sesuai alokasi paket Anda.
        </div>
      </div>

      {/* CASE 1: FREE OR BASIC WITHOUT SUB-ACCOUNTS */}
      {!isPlanAllowed && !loading && (
        <div className="bg-surface border border-ui-divider rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-4 space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">Fitur Akun Staf Belum Aktif</h2>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              {planName === 'FREE' ? (
                <>
                  Paket Anda saat ini (<span className="font-bold text-primary">Free Plan</span>) dibatasi hanya untuk <span className="font-bold text-on-surface">1 Akun Utama (1 Perangkat)</span>.
                  <br />
                  Silakan upgrade ke paket berbayar untuk mengaktifkan fitur multi-perangkat atau pesan kuota staf tambahan.
                </>
              ) : (
                <>
                  Paket Anda saat ini (<span className="font-bold text-primary">{planName} Plan</span>) memiliki kuota dasar <span className="font-bold text-on-surface">1 Akun Utama</span>.
                  <br />
                  Untuk paket Basic, Anda dapat membeli <span className="font-bold text-primary">Add-on Kuota Akun Staf (+1, +2, dst)</span> atau langsung <span className="font-bold text-primary">Upgrade Paket</span> ke Starter/Pro/Business.
                </>
              )}
            </p>
          </div>

          <div className="w-full bg-surface-container-low border border-ui-divider rounded-xl p-3 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Paket Saat Ini:</span>
              <span className="font-bold text-on-surface">{planName} (1 Device Utama)</span>
            </div>
            {planName === 'BASIC' && (
              <div className="flex justify-between items-center text-primary bg-primary/10 p-2 rounded-lg font-bold">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">stars</span>
                  Add-on Staf untuk Basic:
                </span>
                <span>Bisa Beli +1, +2, +5 Akun</span>
              </div>
            )}
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Starter Plan:</span>
              <span className="font-bold text-primary">1 Utama + 2 Akun Staf (Total 3 Device)</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Pro Plan:</span>
              <span className="font-bold text-primary">1 Utama + 4 Akun Staf (Total 5 Device)</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Business Plan:</span>
              <span className="font-bold text-primary">1 Utama + 9 Akun Staf (Total 10 Device)</span>
            </div>
          </div>

          <Link
            to="/plans"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
          >
            <span className="material-symbols-outlined text-base">shopping_cart</span>
            {planName === 'BASIC' ? 'Beli Add-on Staf / Upgrade Paket' : 'Upgrade ke Paket Berbayar'}
          </Link>
        </div>
      )}

      {/* CASE 2: PLAN WITH SUB-ACCOUNT ACCESS (STARTER, PRO, BUSINESS, ENTERPRISE, OR BASIC WITH ADD-ON) */}
      {isPlanAllowed && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
          {/* Left: Account List */}
          <div className="md:col-span-7 flex flex-col bg-surface border border-ui-divider rounded-2xl overflow-hidden shadow-sm">
            <div className="p-3.5 border-b border-ui-divider bg-surface-container-low flex justify-between items-center">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-on-surface">Daftar Akun Staf Toko</h2>
                <p className="text-[10px] text-on-surface-variant">Staf login menggunakan email & password masing-masing</p>
              </div>

              <div className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
                <span className="material-symbols-outlined text-xs">group</span>
                <span>
                  {subAccounts.length} / {maxSubAccounts === 999999 ? '∞' : maxSubAccounts} Sub-Akun
                </span>
                <span className="text-on-surface-variant font-normal">
                  ({subAccounts.length + 1}/{deviceLimit === 999999 ? '∞' : deviceLimit} Total)
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="py-12 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
                  <span>Memuat data staf...</span>
                </div>
              ) : subAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-2xl">person_add</span>
                  </div>
                  <p className="text-xs font-bold text-on-surface">Belum ada akun staf yang didaftarkan</p>
                  <p className="text-[11px] text-on-surface-variant mt-1 max-w-xs">
                    Gunakan formulir di sebelah kanan untuk menambahkan akun staf packing Anda (tersedia kuota {maxSubAccounts} staf).
                  </p>
                </div>
              ) : (
                subAccounts.map((acc, index) => (
                  <div
                    key={acc.id}
                    className="flex justify-between items-center bg-surface-container-low border border-ui-divider p-3 rounded-xl hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-on-surface">{acc.email}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          Ditambahkan: {new Date(acc.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(acc.id, acc.email)}
                      className="p-1.5 text-on-surface-variant hover:text-status-error hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Hapus Akses Staf"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Add Account Form */}
          <div className="md:col-span-5 bg-surface border border-ui-divider rounded-2xl p-4 shadow-sm h-fit space-y-3">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">person_add</span>
                Tambah Akun Staf Baru
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <p className="text-[10px] text-on-surface-variant">
                  Alokasi: 1 Utama + {maxSubAccounts} Staf ({deviceLimit} Perangkat)
                </p>
                {extraAccounts > 0 && (
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                    +{extraAccounts} Add-on
                  </span>
                )}
              </div>
            </div>

            {successMsg && (
              <div className="p-2.5 bg-green-50 dark:bg-green-950/40 border border-status-success/30 rounded-xl text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-status-error/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {isLimitReached ? (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-400/40 text-amber-800 dark:text-amber-300 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-base text-amber-600">info</span>
                  <span>Batas Kuota Staf Tercapai</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Paket <span className="font-bold">{planName}</span> Anda telah mencapai kuota maksimal {maxSubAccounts} akun staf ({deviceLimit} total perangkat).
                </p>
                <Link
                  to="/plans"
                  className="block text-center bg-primary text-white font-bold py-2 rounded-lg text-[11px] hover:bg-primary/90 transition-colors shadow"
                >
                  Beli Tambahan Kuota Staf (Add-on) / Upgrade
                </Link>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">
                    Nama / Label Staf (Opsional)
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs focus:border-primary outline-none"
                    placeholder="Contoh: Meja Packing 1 / Budi"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">
                    Email Staf <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs focus:border-primary outline-none"
                    placeholder="staf1@tokoanda.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">
                    Password Staf <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs focus:border-primary outline-none"
                    placeholder="Minimal 6 karakter"
                  />
                </div>

                <button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  {adding ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                      <span>Mendaftarkan Staf...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      <span>Daftarkan Akun Staf</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
