import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'pending_payments' | 'orders'>('users');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProofModal, setSelectedProofModal] = useState<any | null>(null);

  // Selected User for Edit / Delete
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState('STARTER');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editExtraStorage, setEditExtraStorage] = useState(0);
  const [editExtraAccounts, setEditExtraAccounts] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    const pin = localStorage.getItem('admin_pin');
    if (!pin) {
      setError('No Admin PIN found. Please login.');
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Users via Admin RPC
      const { data: result, error: rpcError } = await supabase.rpc('get_admin_users_list', { pin_code: pin });
      if (rpcError) throw rpcError;
      setData(result);

      // 2. Fetch all Subscriptions (RLS allows select)
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .order('created_at', { ascending: false });

      if (!subsError && subsData) {
        setSubscriptions(subsData);
      }

      // 3. Fetch Recent Recordings / Orders
      try {
        const { data: recsData } = await supabase
          .from('recordings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (recsData) {
          setRecordings(recsData);
        }
      } catch (recErr) {
        console.warn('Recordings fetch note:', recErr);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Failed to fetch data: ${err.message || err.details || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Live Realtime listener on subscriptions & recordings
    const channel = supabase
      .channel('admin-users-live-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        fetchAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recordings' }, () => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper to find latest subscription for a user
  const getUserSubscription = (user: any) => {
    if (!subscriptions || subscriptions.length === 0) return null;
    return subscriptions.find(
      (s) => s.user_id === user.id || (user.email && s.user_email && s.user_email.toLowerCase() === user.email.toLowerCase())
    );
  };

  // Helper to format expiration date & status
  const getExpiryInfo = (user: any) => {
    const sub = getUserSubscription(user);
    const planName = (sub?.plans?.name || user.plan || '').toUpperCase();
    const isFree = planName === 'FREE';

    const metaPayment = user.raw_user_meta_data?.pending_payment || user.user_metadata?.pending_payment;
    if (sub?.status === 'PENDING_APPROVAL' || metaPayment) {
      return {
        label: 'Menunggu Approval',
        dateStr: (sub?.created_at || metaPayment?.submitted_at) ? new Date(sub?.created_at || metaPayment?.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-400 font-bold animate-pulse',
        sub,
        isPending: true,
        isFree,
        daysLeft: null
      };
    }

    const endDateStr = sub?.end_date || user.end_date || user.subscription_end;

    if (!endDateStr) {
      return {
        label: 'Belum Aktif',
        dateStr: '-',
        badgeClass: 'bg-surface-container text-on-surface-variant border border-ui-divider',
        sub,
        isFree,
        daysLeft: null
      };
    }

    const endDate = new Date(endDateStr);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = endDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (diffDays <= 0) {
      return {
        label: 'Kedaluwarsa (OFF)',
        dateStr: formattedDate,
        badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300 font-bold',
        sub,
        isExpired: true,
        isFree,
        daysLeft: diffDays
      };
    } else if (diffDays <= 7) {
      return {
        label: `Sisa ${diffDays} hari`,
        dateStr: formattedDate,
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 font-bold',
        sub,
        isWarning: true,
        isFree,
        daysLeft: diffDays
      };
    } else {
      return {
        label: `Sisa ${diffDays} hari`,
        dateStr: formattedDate,
        badgeClass: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 border border-green-300 font-bold',
        sub,
        isActive: true,
        isFree,
        daysLeft: diffDays
      };
    }
  };

  // Approve Subscription
  const handleApproveSubscription = async (sub: any, targetUser?: any) => {
    if (!sub) return;
    const userName = sub.user_name || sub.user_email || targetUser?.name || targetUser?.email || 'pengguna ini';
    const planName = sub.plans?.name || targetUser?.plan || 'Plan';

    if (!window.confirm(`Setujui bukti pembayaran dan aktifkan paket ${planName} untuk ${userName}?`)) {
      return;
    }

    setActionLoading(true);
    const pin = localStorage.getItem('admin_pin');
    try {
      // 1. Tentukan durasi paket (hari)
      let durationDays = 30; // Standar 30 hari
      if (sub.notes && sub.notes.includes('[DURASI:')) {
        const match = sub.notes.match(/\[DURASI:\s*(\d+)\s*HARI/i);
        if (match) durationDays = parseInt(match[1], 10);
      } else if (sub.notes && sub.notes.toLowerCase().includes('triwulan')) {
        durationDays = 90;
      } else if (sub.notes && (sub.notes.toLowerCase().includes('semester') || sub.notes.toLowerCase().includes('6 bulan') || sub.notes.toLowerCase().includes('semiannual'))) {
        durationDays = 180;
      } else if (sub.is_annual || (sub.amount_paid && sub.plans?.price && sub.amount_paid >= sub.plans.price * 5)) {
        durationDays = 365;
      }

      const targetUserId = sub.user_id || targetUser?.id;

      // 2. Cek apakah pengguna sedang memiliki langganan aktif (Perpanjangan / Renewal)
      // "untuk perpanjangan masa aktif akan otomatis bertambah setelah masa aktif sebelumnya berakhir"
      let baseDate = new Date();
      if (targetUserId) {
        const { data: existingActive } = await supabase
          .from('subscriptions')
          .select('id, end_date')
          .eq('user_id', targetUserId)
          .eq('status', 'ACTIVE')
          .gt('end_date', new Date().toISOString())
          .neq('id', sub.id)
          .order('end_date', { ascending: false })
          .limit(1);

        if (existingActive && existingActive.length > 0 && existingActive[0].end_date) {
          const prevEnd = new Date(existingActive[0].end_date);
          if (prevEnd.getTime() > Date.now()) {
            baseDate = prevEnd; // Akumulasi bertambah dari tanggal akhir sebelumnya!
          }

          // Tandai sub lama menjadi 'REPLACED'
          await supabase
            .from('subscriptions')
            .update({ status: 'REPLACED', updated_at: new Date().toISOString() })
            .eq('id', existingActive[0].id);
        }
      }

      const startDate = new Date();
      const endDate = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // 3. Update subscription status menjadi ACTIVE
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'ACTIVE',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id);

      if (subError) throw subError;

      // 4. Sync user plan via RPC if pin is present
      if (pin && targetUserId && sub.plans?.name) {
        try {
          await supabase.rpc('admin_update_user_plan', {
            pin_code: pin,
            target_user_id: targetUserId,
            new_plan_name: sub.plans.name
          });
        } catch (syncErr) {
          console.warn('RPC sync plan note:', syncErr);
        }
      }

      alert(`Pembayaran berhasil disetujui! Paket ${planName} aktif selama ${durationDays} hari s/d ${endDate.toLocaleDateString('id-ID')}.`);
      setSelectedProofModal(null);
      fetchAllData();
    } catch (err: any) {
      console.error('Approve failed:', err);
      alert('Gagal menyetujui pembayaran: ' + (err.message || String(err)));
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Subscription
  const handleRejectSubscription = async (sub: any) => {
    if (!sub) return;
    if (!window.confirm('Tolak pengajuan bukti pembayaran ini?')) return;

    setActionLoading(true);
    try {
      const { error: rejectError } = await supabase
        .from('subscriptions')
        .update({
          status: 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id);

      if (rejectError) throw rejectError;

      alert('Pengajuan pembayaran telah ditolak.');
      setSelectedProofModal(null);
      fetchAllData();
    } catch (err: any) {
      console.error('Reject failed:', err);
      alert('Gagal menolak pembayaran: ' + (err.message || String(err)));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const pin = localStorage.getItem('admin_pin');
    try {
      const { error: rpcError } = await supabase.rpc('admin_delete_user', {
        pin_code: pin,
        target_user_id: selectedUser.id
      });
      if (rpcError) throw rpcError;
      setDeleteModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus pengguna.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Plan, Expiry Date & Add-ons Manually
  const handleUpdatePlan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const pin = localStorage.getItem('admin_pin');
    try {
      // 1. Update plan via RPC
      const { error: rpcError } = await supabase.rpc('admin_update_user_plan', {
        pin_code: pin,
        target_user_id: selectedUser.id,
        new_plan_name: selectedPlan
      });
      if (rpcError) throw rpcError;

      // 2. If expiry date or add-on specified, update subscription record
      const { data: targetPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('name', selectedPlan)
        .single();

      const sub = getUserSubscription(selectedUser);
      const endDateIso = editExpiryDate ? new Date(editExpiryDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();

      if (sub) {
        await supabase
          .from('subscriptions')
          .update({
            plan_id: targetPlan?.id || sub.plan_id,
            status: 'ACTIVE',
            end_date: endDateIso,
            extra_storage_gb: Number(editExtraStorage) || 0,
            extra_accounts: Number(editExtraAccounts) || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id);
      } else if (targetPlan) {
        await supabase
          .from('subscriptions')
          .insert({
            user_id: selectedUser.id,
            plan_id: targetPlan.id,
            status: 'ACTIVE',
            start_date: new Date().toISOString(),
            end_date: endDateIso,
            extra_storage_gb: Number(editExtraStorage) || 0,
            extra_accounts: Number(editExtraAccounts) || 0,
            user_email: selectedUser.email,
            user_name: selectedUser.name
          });
      }

      setEditModalOpen(false);
      fetchAllData();
      alert('Paket, masa berlaku, dan kuota add-on berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui paket.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDelete = (user: any) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setSelectedPlan(user.plan === 'No Plan' ? 'FREE' : user.plan.toUpperCase());

    const sub = getUserSubscription(user);
    setEditExtraStorage(Number(sub?.extra_storage_gb || user.raw_user_meta_data?.extra_storage_gb || 0));
    setEditExtraAccounts(Number(sub?.extra_accounts || user.raw_user_meta_data?.extra_accounts || 0));

    if (sub?.end_date) {
      setEditExpiryDate(new Date(sub.end_date).toISOString().split('T')[0]);
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setEditExpiryDate(defaultDate.toISOString().split('T')[0]);
    }

    setEditModalOpen(true);
  };

  const pendingSubs = subscriptions.filter((s) => s.status === 'PENDING_APPROVAL');

  // Filtered Users List
  const filteredUsers = (data?.users || []).filter((user: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (user.name && user.name.toLowerCase().includes(q)) ||
      (user.email && user.email.toLowerCase().includes(q)) ||
      (user.plan && user.plan.toLowerCase().includes(q));

    const matchesPlan = planFilter === 'ALL' || (user.plan && user.plan.toUpperCase() === planFilter);

    const expiryInfo = getExpiryInfo(user);
    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') matchesStatus = !!expiryInfo.isActive;
    else if (statusFilter === 'EXPIRED') matchesStatus = !!expiryInfo.isExpired;
    else if (statusFilter === 'PENDING') matchesStatus = !!expiryInfo.isPending;
    else if (statusFilter === 'FREE') matchesStatus = !!expiryInfo.isFree;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  if (loading && !data) {
    return (
      <div className="p-lg flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
          <p className="font-code-md text-on-surface-variant">Memuat data pengguna & langganan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-lg flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="bg-error-container text-on-error-container p-lg rounded-xl max-w-md text-center">
          <span className="material-symbols-outlined text-4xl mb-sm">error</span>
          <p className="font-body-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex flex-col min-h-[calc(100vh-64px)] max-w-7xl mx-auto w-full relative">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">manage_accounts</span>
            User & Subscription Management
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Kelola akses pelanggan, pantau tanggal kedaluwarsa langganan, dan setujui bukti pembayaran transfer QRIS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-1.5 bg-surface border border-ui-divider text-on-surface px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-surface-container"
          >
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin text-primary' : ''}`}>sync</span>
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* 2. Notification Banner: Pending Approvals Alert */}
      {pendingSubs.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow">
              <span className="material-symbols-outlined text-2xl">notifications_active</span>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                Ada {pendingSubs.length} Pembayaran Menunggu Persetujuan (Approval)!
              </h3>
              <p className="text-xs text-amber-700/90 dark:text-amber-400">
                Pelanggan telah mengirim bukti transfer QRIS DANA. Verifikasi bukti dan aktifkan akun sekarang.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('pending_payments')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>Tinjau Pembayaran</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}

      {/* 3. Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-surface border border-ui-divider p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">TOTAL PENGGUNA</span>
            <span className="material-symbols-outlined text-primary text-2xl">group</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-on-surface">{data?.total_users || 0}</p>
          <p className="text-[10px] text-on-surface-variant mt-1">Terdaftar di sistem Buktiin</p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-surface border border-ui-divider p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">LANGGANAN AKTIF</span>
            <span className="material-symbols-outlined text-status-success text-2xl">verified</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-status-success">{data?.active_users || 0}</p>
          <p className="text-[10px] text-on-surface-variant mt-1">Paket berbayar aktif</p>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setActiveTab('pending_payments')}
          className={`border p-4 sm:p-5 rounded-2xl shadow-sm cursor-pointer transition-all ${
            pendingSubs.length > 0
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-400 hover:border-amber-500'
              : 'bg-surface border-ui-divider'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">MENUNGGU APPROVAL</span>
            <span className="material-symbols-outlined text-amber-500 text-2xl">hourglass_top</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">{pendingSubs.length}</p>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1">
            {pendingSubs.length > 0 ? 'Perlu tindakan admin segera' : 'Semua pembayaran telah diproses'}
          </p>
        </div>

        {/* Total Pesanan / Scan */}
        <div
          onClick={() => setActiveTab('orders')}
          className="bg-surface border border-ui-divider p-4 sm:p-5 rounded-2xl shadow-sm cursor-pointer hover:border-primary transition-all"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">PESANAN / SCAN HARI INI</span>
            <span className="material-symbols-outlined text-primary text-2xl">qr_code_scanner</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-on-surface">{recordings.length}</p>
          <p className="text-[10px] text-on-surface-variant mt-1">Log rekaman video pesanan live</p>
        </div>
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-ui-divider pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-primary text-white shadow'
              : 'bg-surface border border-ui-divider text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">group</span>
          <span>Semua Pengguna ({data?.users?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending_payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'pending_payments'
              ? 'bg-amber-500 text-white shadow'
              : 'bg-surface border border-ui-divider text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">receipt_long</span>
          <span>Menunggu Approval</span>
          {pendingSubs.length > 0 && (
            <span className="bg-white text-amber-600 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
              {pendingSubs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-on-surface text-white shadow'
              : 'bg-surface border border-ui-divider text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-base">inventory_2</span>
          <span>Pesanan / Scan ({recordings.length})</span>
        </button>
      </div>

      {/* TAB 1: ALL USERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Table Filters */}
          <div className="bg-surface border border-ui-divider p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Cari nama, email, paket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container border border-ui-divider rounded-xl pl-8 pr-3 py-1.5 text-xs focus:border-primary outline-none"
                />
              </div>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-surface-container border border-ui-divider rounded-xl px-3 py-1.5 text-xs focus:border-primary outline-none"
              >
                <option value="ALL">Semua Paket</option>
                <option value="FREE">Free</option>
                <option value="BASIC">Basic</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="BUSINESS">Business</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>

              {/* Expiry Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface-container border border-ui-divider rounded-xl px-3 py-1.5 text-xs focus:border-primary outline-none"
              >
                <option value="ALL">Semua Status Expired</option>
                <option value="ACTIVE">Aktif (Masih Berlaku)</option>
                <option value="PENDING">Menunggu Approval</option>
                <option value="EXPIRED">Sudah Kedaluwarsa</option>
                <option value="FREE">Permanen / Free</option>
              </select>
            </div>

            <span className="text-[11px] font-bold text-on-surface-variant">
              Menampilkan {filteredUsers.length} pengguna
            </span>
          </div>

          {/* Main Users Table (Exactly like web) */}
          <div className="bg-surface border border-ui-divider rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
              <thead className="bg-surface-container text-on-surface-variant border-b border-ui-divider text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Nama / Toko</th>
                  <th className="py-3 px-4">Email Pelanggan</th>
                  <th className="py-3 px-4">Paket</th>
                  <th className="py-3 px-4">Masa Berlaku (Expired)</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4">Bukti / Approval</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-divider text-xs">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => {
                    const expiry = getExpiryInfo(user);
                    const sub = expiry.sub;
                    const isPending = expiry.isPending;

                    return (
                      <tr key={user.id} className="hover:bg-surface-container-low transition-colors">
                        {/* Name & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                              {user.name ? user.name.substring(0, 2) : '?'}
                            </div>
                            <div>
                              <p className="font-bold text-on-surface">{user.name || 'Tanpa Nama'}</p>
                              <p className="text-[10px] text-on-surface-variant font-mono">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4 font-mono text-on-surface-variant">
                          {user.email}
                        </td>

                        {/* Plan & Add-ons */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2 py-0.5 border border-ui-divider rounded-md font-bold text-[10px] bg-surface-container uppercase">
                              {user.plan || 'FREE'}
                            </span>
                            {((sub?.extra_storage_gb && sub.extra_storage_gb > 0) || (sub?.extra_accounts && sub.extra_accounts > 0)) && (
                              <div className="flex flex-wrap gap-1">
                                {sub.extra_storage_gb > 0 && (
                                  <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded font-bold">
                                    +{sub.extra_storage_gb}GB
                                  </span>
                                )}
                                {sub.extra_accounts > 0 && (
                                  <span className="text-[9px] bg-secondary/10 text-secondary border border-secondary/20 px-1.5 py-0.2 rounded font-bold">
                                    +{sub.extra_accounts} Staf
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Tanggal Expired Langganan Pelanggan */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-on-surface">
                              <span className="material-symbols-outlined text-sm text-on-surface-variant">event</span>
                              <span>{expiry.dateStr}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.2 rounded-full ${expiry.badgeClass}`}>
                              {expiry.label}
                            </span>
                          </div>
                        </td>

                        {/* Status Akun */}
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              user.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {user.status || 'ACTIVE'}
                          </span>
                        </td>

                        {/* Bukti Pembayaran / Approval Column */}
                        <td className="py-3 px-4">
                          {(() => {
                            const metaPayment = user.raw_user_meta_data?.pending_payment || user.user_metadata?.pending_payment;
                            const proofUrl = sub?.payment_proof_url || metaPayment?.payment_proof_url;
                            const modalData = {
                              ...sub,
                              id: sub?.id,
                              user_id: user.id,
                              user_email: sub?.user_email || user.email,
                              user_name: sub?.user_name || user.name || metaPayment?.sender_name,
                              payment_proof_url: proofUrl,
                              amount_paid: sub?.amount_paid || metaPayment?.amount_paid,
                              notes: sub?.notes || metaPayment?.notes,
                              plans: sub?.plans || { name: metaPayment?.plan_name || user.plan },
                              status: sub?.status || (metaPayment ? 'PENDING_APPROVAL' : 'ACTIVE')
                            };

                            if (proofUrl) {
                              return (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={proofUrl}
                                    alt="Bukti"
                                    onClick={() => setSelectedProofModal(modalData)}
                                    className="w-8 h-8 rounded-lg object-cover border border-ui-divider cursor-pointer hover:scale-105 transition-transform"
                                    title="Klik untuk lihat bukti transfer"
                                  />
                                  {isPending ? (
                                    <button
                                      onClick={() => setSelectedProofModal(modalData)}
                                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-sm transition-all animate-pulse"
                                    >
                                      <span className="material-symbols-outlined text-xs">verified</span>
                                      Approve
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-on-surface-variant">Terverifikasi</span>
                                  )}
                                </div>
                              );
                            }

                            if (isPending) {
                              return (
                                <button
                                  onClick={() => setSelectedProofModal(modalData)}
                                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-sm animate-pulse"
                                >
                                  <span className="material-symbols-outlined text-xs">verified</span>
                                  Approve
                                </button>
                              );
                            }

                            return <span className="text-[10px] text-on-surface-variant">-</span>;
                          })()}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => openEdit(user)}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                              title="Edit paket / masa berlaku"
                            >
                              <span className="material-symbols-outlined text-base">edit_calendar</span>
                            </button>
                            <button
                              onClick={() => openDelete(user)}
                              className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                              title="Hapus pengguna"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant">search_off</span>
                      <p className="font-bold">Tidak ada pengguna yang cocok.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS LIST */}
      {activeTab === 'pending_payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">pending_actions</span>
              Daftar Pembayaran Menunggu Approval ({pendingSubs.length})
            </h2>
            <button
              onClick={fetchAllData}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Segarkan
            </button>
          </div>

          {pendingSubs.length === 0 ? (
            <div className="bg-surface border border-ui-divider rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-status-success mb-2">check_circle</span>
              <p className="text-sm font-bold text-on-surface">Semua Beres!</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Tidak ada pembayaran langganan yang menunggu verifikasi saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingSubs.map((sub) => {
                const formattedAmount = sub.amount_paid
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(sub.amount_paid)
                  : sub.plans?.price
                  ? `Rp ${sub.plans.price.toLocaleString('id-ID')}`
                  : 'Sesuai Kesepakatan';

                return (
                  <div
                    key={sub.id}
                    className="bg-surface border-2 border-amber-400 dark:border-amber-600/70 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Plan Tag */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-extrabold text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">
                          {sub.plans?.name || 'Paket'} Plan
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
                          MENUNGGU APPROVAL
                        </span>
                      </div>

                      {/* Detail Info */}
                      <div className="space-y-1.5 text-xs mb-3">
                        <p className="font-bold text-on-surface truncate">👤 {sub.user_name || 'Pengguna'}</p>
                        <p className="text-on-surface-variant text-[11px] truncate">✉️ {sub.user_email || sub.user_id}</p>
                        <p className="font-extrabold text-sm text-primary">💰 {formattedAmount}</p>
                        {sub.notes && (
                          <div className="bg-surface-container p-2 rounded-lg text-[10px] text-on-surface-variant leading-relaxed">
                            📝 {sub.notes}
                          </div>
                        )}
                        <p className="text-[10px] text-on-surface-variant">
                          🕒 Masuk: {new Date(sub.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>

                      {/* Proof Image */}
                      {sub.payment_proof_url ? (
                        <div className="mb-3">
                          <p className="text-[10px] font-bold text-on-surface-variant mb-1">Bukti Transfer (Klik untuk zoom):</p>
                          <img
                            src={sub.payment_proof_url}
                            alt="Bukti Transfer"
                            onClick={() => setSelectedProofModal(sub)}
                            className="w-full h-32 object-cover rounded-xl border border-ui-divider cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      ) : (
                        <div className="mb-3 p-3 bg-surface-container rounded-xl text-center text-[10px] text-on-surface-variant">
                          Tidak ada foto bukti terlampir
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-ui-divider flex items-center gap-2">
                      <button
                        onClick={() => handleApproveSubscription(sub)}
                        disabled={actionLoading}
                        className="flex-1 bg-status-success hover:bg-status-success/90 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                      >
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Setujui (Approve)
                      </button>

                      <button
                        onClick={() => handleRejectSubscription(sub)}
                        disabled={actionLoading}
                        className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                        Tolak
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECENT ORDERS / SCAN */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory</span>
              Aktivitas Pesanan & Rekaman Video Packing Terbaru ({recordings.length})
            </h2>
            <button
              onClick={fetchAllData}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Segarkan
            </button>
          </div>

          {recordings.length === 0 ? (
            <div className="bg-surface border border-ui-divider rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">qr_code_scanner</span>
              <p className="text-sm font-bold text-on-surface">Belum ada rekaman pesanan</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Data scan packing dan unboxing oleh staf gudang akan muncul di sini secara real-time.
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-ui-divider rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                <thead className="bg-surface-container text-on-surface-variant border-b border-ui-divider text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">No. Resi</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Marketplace</th>
                    <th className="py-3 px-4">Jenis Scan</th>
                    <th className="py-3 px-4">Status Upload</th>
                    <th className="py-3 px-4">Waktu Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-divider text-xs font-mono">
                  {recordings.map((rec) => (
                    <tr key={rec.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-bold text-primary">{rec.resi}</td>
                      <td className="py-3 px-4 font-sans text-on-surface">{rec.customer || '-'}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded-md bg-surface-container text-[10px] font-bold">
                          {rec.marketplace || 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          rec.scan_type === 'UNBOXING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.scan_type || 'PACKING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.upload_status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rec.upload_status || rec.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant text-[11px]">
                        {new Date(rec.created_at).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: PROOF OF PAYMENT PREVIEW & APPROVE */}
      {selectedProofModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
          onClick={() => setSelectedProofModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-surface border border-ui-divider rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-ui-divider mb-4">
              <div>
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  Verifikasi Pembayaran & Bukti Transfer
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Cek rincian transfer pelanggan dan tentukan persetujuan akun.
                </p>
              </div>
              <button
                onClick={() => setSelectedProofModal(null)}
                className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Left: Image */}
              <div className="bg-black/5 dark:bg-black/40 rounded-2xl p-2 flex items-center justify-center border border-ui-divider">
                {selectedProofModal.payment_proof_url ? (
                  <img
                    src={selectedProofModal.payment_proof_url}
                    alt="Bukti Transfer"
                    className="max-h-72 w-full object-contain rounded-xl shadow"
                  />
                ) : (
                  <div className="py-12 text-center text-on-surface-variant text-xs">
                    Tidak ada gambar bukti
                  </div>
                )}
              </div>

              {/* Right: Payment Details */}
              <div className="space-y-2.5 text-xs bg-surface-container-low p-4 rounded-2xl border border-ui-divider">
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase">Paket Yang Diajukan</span>
                  <p className="text-base font-extrabold text-primary">{selectedProofModal.plans?.name || 'Paket'} Plan</p>
                </div>

                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase">Nominal Transfer</span>
                  <p className="text-sm font-bold text-on-surface">
                    {selectedProofModal.amount_paid
                      ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedProofModal.amount_paid)
                      : selectedProofModal.plans?.price
                      ? `Rp ${selectedProofModal.plans.price.toLocaleString('id-ID')}`
                      : 'Sesuai Kesepakatan'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase">Nama Pengirim</span>
                  <p className="font-bold text-on-surface">{selectedProofModal.user_name || 'Pengguna'}</p>
                </div>

                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase">Email Terdaftar</span>
                  <p className="font-mono text-on-surface truncate">{selectedProofModal.user_email || selectedProofModal.user_id}</p>
                </div>

                {selectedProofModal.notes && (
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase">Catatan / Kontak Pengirim</span>
                    <p className="text-on-surface bg-surface p-2 rounded-lg border border-ui-divider text-[11px] leading-relaxed">
                      {selectedProofModal.notes}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase">Tanggal Pengajuan</span>
                  <p className="text-on-surface-variant">{new Date(selectedProofModal.created_at).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-ui-divider flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                onClick={() => setSelectedProofModal(null)}
                className="w-full sm:w-auto px-4 py-2 font-bold text-xs text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
              >
                Tutup
              </button>

              {selectedProofModal.status === 'PENDING_APPROVAL' && (
                <>
                  <button
                    onClick={() => handleRejectSubscription(selectedProofModal)}
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-4 py-2 font-bold text-xs text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Tolak Bukti
                  </button>

                  <button
                    onClick={() => handleApproveSubscription(selectedProofModal)}
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-6 py-2.5 font-bold text-xs bg-status-success hover:bg-status-success/90 text-white rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    {actionLoading ? 'Memproses...' : 'Setujui & Aktifkan Paket'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER & EXPIRY DATE */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface border border-ui-divider rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-ui-divider">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_calendar</span>
                Ubah Paket & Masa Berlaku
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Atur paket langganan dan tanggal kedaluwarsa untuk akun <strong>{selectedUser?.email}</strong>.
            </p>

            {/* Plan Selector */}
            <div>
              <label className="block text-[11px] font-bold text-on-surface mb-1">Paket Langganan</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary"
              >
                <option value="FREE">Free (Gratis)</option>
                <option value="BASIC">Basic</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="BUSINESS">Business</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            {/* Expiry Date Setting */}
            <div>
              <label className="block text-[11px] font-bold text-on-surface mb-1">Tanggal Expired (Masa Berlaku)</label>
              <input
                type="date"
                value={editExpiryDate}
                onChange={(e) => setEditExpiryDate(e.target.value)}
                className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-primary mb-2"
              />

              {/* Quick Extend Buttons */}
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 30);
                    setEditExpiryDate(d.toISOString().split('T')[0]);
                  }}
                  className="bg-surface-container hover:bg-surface-variant px-2.5 py-1 rounded-lg font-bold text-on-surface-variant"
                >
                  +30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 60);
                    setEditExpiryDate(d.toISOString().split('T')[0]);
                  }}
                  className="bg-surface-container hover:bg-surface-variant px-2.5 py-1 rounded-lg font-bold text-on-surface-variant"
                >
                  +60 Hari
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 365);
                    setEditExpiryDate(d.toISOString().split('T')[0]);
                  }}
                  className="bg-surface-container hover:bg-surface-variant px-2.5 py-1 rounded-lg font-bold text-on-surface-variant"
                >
                  +1 Tahun
                </button>
              </div>
            </div>

            {/* Add-on 1: Extra Storage */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-sm">cloud</span>
                  Tambahan Kuota Storage (GB) - Addon
                </label>
                <span className="text-[10px] text-primary font-bold">+{editExtraStorage} GB</span>
              </div>
              <input
                type="number"
                min="0"
                step="5"
                value={editExtraStorage}
                onChange={(e) => setEditExtraStorage(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-primary mb-1.5"
                placeholder="0"
              />
              <div className="flex flex-wrap gap-1 text-[10px]">
                {[0, 10, 25, 50, 100].map((gb) => (
                  <button
                    key={gb}
                    type="button"
                    onClick={() => setEditExtraStorage(gb)}
                    className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                      editExtraStorage === gb
                        ? 'bg-primary text-white'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    {gb === 0 ? '0 GB' : `+${gb} GB`}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-on 2: Extra Accounts */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-sm">group_add</span>
                  Tambahan Kuota Sub-Akun Staf - Addon
                </label>
                <span className="text-[10px] text-secondary font-bold">+{editExtraAccounts} Staf</span>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={editExtraAccounts}
                onChange={(e) => setEditExtraAccounts(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-primary mb-1.5"
                placeholder="0"
              />
              <div className="flex flex-wrap gap-1 text-[10px]">
                {[0, 1, 2, 5, 10].map((acc) => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => setEditExtraAccounts(acc)}
                    className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                      editExtraAccounts === acc
                        ? 'bg-secondary text-white'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    {acc === 0 ? '0 Staf' : `+${acc} Staf`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-ui-divider">
              <button
                onClick={() => setEditModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 font-bold text-xs text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleUpdatePlan}
                disabled={actionLoading}
                className="px-5 py-2 font-bold text-xs bg-primary text-white rounded-xl hover:bg-primary/90 transition-opacity shadow"
              >
                {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE USER */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface border border-ui-divider rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-status-error flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Hapus Pengguna
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <strong>{selectedUser?.email}</strong> secara permanen? Data yang telah dihapus tidak dapat dipulihkan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 font-bold text-xs text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-5 py-2 font-bold text-xs bg-status-error text-white rounded-xl hover:opacity-90 transition-opacity shadow"
              >
                {actionLoading ? 'Menghapus...' : 'Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
