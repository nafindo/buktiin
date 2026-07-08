import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SubAccount {
  id: string;
  childId: string;
  email: string;
  createdAt: string;
}

export default function SubAccounts() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);

    try {
      // Get subaccounts
      const res = await fetch(`${API_URL}/api/subaccounts?userId=${session.user.id}&accessToken=${session.access_token}`);
      const result = await res.json();
      if (result.success) {
        setSubAccounts(result.data);
      }

      // Get limit info
      const deviceId = localStorage.getItem('buktiin_device_id');
      const limitRes = await fetch(`${API_URL}/api/check-limits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, deviceId, accessToken: session.access_token })
      });
      const limitData = await limitRes.json();
      if (limitData.success) {
        setPlanName(limitData.data.plan);
        // Map plan to limit
        const getLimit = (plan: string) => {
          if (plan === 'STARTER') return 3;
          if (plan === 'PRO') return 10;
          if (plan === 'BUSINESS') return 50;
          if (plan === 'ENTERPRISE') return 9999;
          return 1;
        };
        setDeviceLimit(getLimit(limitData.data.plan));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAdding(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/api/subaccounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: userId, email, password, accessToken: (await supabase.auth.getSession()).data.session?.access_token })
      });
      const result = await res.json();
      
      if (result.success) {
        setEmail('');
        setPassword('');
        fetchData();
      } else {
        setErrorMsg(result.message || 'Gagal menambahkan akun staf.');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan koneksi.');
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus akses staf ini? (Akun ini tidak akan lagi menggunakan kuota Anda)')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/subaccounts/${id}?accessToken=${session?.access_token}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isLimitReached = subAccounts.length + 1 >= deviceLimit; // +1 for the parent account

  return (
    <div className="p-xl max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Manajemen Staf</h1>
        <p className="text-on-surface-variant max-w-2xl">
          Tambahkan staf packing Anda agar mereka dapat login ke perangkat masing-masing.
          Staf yang ditambahkan akan menggunakan batas memori (GB) dan jumlah scan harian dari akun Anda ({planName}).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg flex-1">
        
        {/* Account List */}
        <div className="md:col-span-2 flex flex-col bg-surface border border-ui-divider rounded-xl overflow-hidden">
          <div className="p-md border-b border-ui-divider bg-surface-container-lowest flex justify-between items-center">
            <h2 className="font-headline-sm text-headline-sm">Daftar Akun Staf</h2>
            <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[12px] font-bold">
              {subAccounts.length + 1} / {deviceLimit === 9999 ? 'Unlimited' : deviceLimit} Akun Terpakai
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-md space-y-md">
            {loading ? (
              <p className="text-center text-on-surface-variant">Memuat...</p>
            ) : subAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant opacity-70">
                <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                <p>Belum ada staf yang didaftarkan.</p>
              </div>
            ) : (
              subAccounts.map((acc) => (
                <div key={acc.id} className="flex justify-between items-center bg-surface-container-lowest border border-ui-divider p-md rounded-lg">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                      <p className="font-label-caps text-label-caps">{acc.email}</p>
                      <p className="font-code-sm text-[11px] text-on-surface-variant">Ditambahkan: {new Date(acc.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(acc.id)}
                    className="text-error hover:bg-error-container p-2 rounded-full transition-colors flex items-center justify-center"
                    title="Hapus Staf"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Account Form */}
        <div className="bg-surface-container-low border border-ui-divider rounded-xl p-md h-fit">
          <h2 className="font-headline-sm text-headline-sm mb-md">Tambah Staf</h2>
          
          {isLimitReached ? (
            <div className="bg-error-container text-on-error-container p-sm rounded-lg mb-md text-[13px]">
              <span className="material-symbols-outlined inline-block align-middle mr-1 text-[16px]">error</span>
              Batas pembuatan akun untuk paket Anda telah tercapai.
            </div>
          ) : (
            <form onSubmit={handleAdd} className="space-y-md">
              {errorMsg && (
                <div className="text-error text-[13px] bg-error-container/30 p-2 rounded">{errorMsg}</div>
              )}
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs">Email Staf</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded p-sm focus:outline-primary"
                  placeholder="staf1@tokoanda.com"
                />
              </div>
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs">Password</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded p-sm focus:outline-primary"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <button 
                type="submit" 
                disabled={adding}
                className="w-full bg-primary text-white font-bold py-sm rounded hover:bg-on-primary-container disabled:opacity-50 transition-colors"
              >
                {adding ? 'Memproses...' : 'Daftarkan Staf'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
