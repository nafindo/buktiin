import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED'>('PENDING_APPROVAL');
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err: any) {
      console.error('Fetch subscriptions error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();

    // Realtime subscription for live updates
    const channel = supabase
      .channel('admin-subs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        fetchSubscriptions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (sub: any) => {
    const confirmApprove = window.confirm(`Setujui aktivasi paket ${sub.plans?.name || 'Plan'} untuk pengguna ${sub.user_email || sub.user_name || sub.user_id}?`);
    if (!confirmApprove) return;

    setActionLoading(sub.id);
    try {
      // 1. Tentukan durasi paket (hari)
      let durationDays = 30; // Default bulanan
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

      // 2. Cek apakah ada langganan aktif sebelumnya (Perpanjangan / Renewal)
      // "untuk perpanjangan masa aktif akan otomatis bertambah setelah masa aktif sebelumnya berakhir"
      let baseDate = new Date();
      if (sub.user_id) {
        const { data: existingActive } = await supabase
          .from('subscriptions')
          .select('id, end_date')
          .eq('user_id', sub.user_id)
          .eq('status', 'ACTIVE')
          .gt('end_date', new Date().toISOString())
          .neq('id', sub.id)
          .order('end_date', { ascending: false })
          .limit(1);

        if (existingActive && existingActive.length > 0 && existingActive[0].end_date) {
          const prevEnd = new Date(existingActive[0].end_date);
          if (prevEnd.getTime() > Date.now()) {
            baseDate = prevEnd; // Bertambah dari tanggal berakhir sebelumnya!
          }

          // Tandai sub lama menjadi 'REPLACED' agar hanya 1 langganan yang aktif
          await supabase
            .from('subscriptions')
            .update({ status: 'REPLACED', updated_at: new Date().toISOString() })
            .eq('id', existingActive[0].id);
        }
      }

      const startDate = new Date();
      const endDate = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'ACTIVE',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id);

      if (error) throw error;

      // Sync plan in user metadata via RPC if pin is present
      const pin = localStorage.getItem('admin_pin');
      if (pin && sub.user_id && sub.plans?.name) {
        try {
          await supabase.rpc('admin_update_user_plan', {
            pin_code: pin,
            target_user_id: sub.user_id,
            new_plan_name: sub.plans.name
          });
        } catch (syncErr) {
          console.warn('RPC sync plan note:', syncErr);
        }
      }

      alert(`Paket ${sub.plans?.name || 'Plan'} berhasil disetujui! Aktif selama ${durationDays} hari s/d ${endDate.toLocaleDateString('id-ID')}.`);
      fetchSubscriptions();
    } catch (err: any) {
      console.error('Approve subscription error:', err);
      alert('Gagal menyetujui langganan: ' + (err.message || String(err)));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sub: any) => {
    const confirmReject = window.confirm(`Tolak pengajuan pembayaran ini?`);
    if (!confirmReject) return;

    setActionLoading(sub.id);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id);

      if (error) throw error;
      alert('Pengajuan telah ditolak.');
      fetchSubscriptions();
    } catch (err: any) {
      console.error('Reject subscription error:', err);
      alert('Gagal menolak langganan: ' + (err.message || String(err)));
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = subscriptions.filter(s => s.status === 'PENDING_APPROVAL').length;

  const filteredSubs = subscriptions.filter(s => {
    const matchesFilter = filter === 'ALL' || s.status === filter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (s.user_email && s.user_email.toLowerCase().includes(query)) ||
      (s.user_name && s.user_name.toLowerCase().includes(query)) ||
      (s.plans?.name && s.plans.name.toLowerCase().includes(query)) ||
      (s.notes && s.notes.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">verified</span>
            Persetujuan Langganan Manual (QRIS)
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Verifikasi bukti transfer QRIS DANA dan aktifkan paket akun pengguna.
          </p>
        </div>

        <button
          onClick={fetchSubscriptions}
          disabled={loading}
          className="self-start sm:self-auto bg-surface-container hover:bg-surface-variant border border-ui-divider text-on-surface px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin text-primary' : ''}`}>sync</span>
          Refresh Data
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-ui-divider">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('PENDING_APPROVAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              filter === 'PENDING_APPROVAL'
                ? 'bg-amber-500 text-white shadow'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            <span>Menunggu Approval</span>
            {pendingCount > 0 && (
              <span className="bg-white text-amber-600 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'ACTIVE'
                ? 'bg-primary text-white shadow'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Aktif (Disetujui)
          </button>

          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'REJECTED'
                ? 'bg-red-600 text-white shadow'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Ditolak
          </button>

          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'ALL'
                ? 'bg-on-surface text-white shadow'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Semua Data ({subscriptions.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Cari email, nama, paket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-surface-container border border-ui-divider rounded-xl pl-8 pr-3 py-1.5 text-xs focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
          <p className="text-xs text-on-surface-variant font-bold">Memuat data langganan...</p>
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="bg-surface border border-ui-divider rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
          <p className="text-sm font-bold text-on-surface">Tidak ada data langganan</p>
          <p className="text-xs text-on-surface-variant mt-1">
            {filter === 'PENDING_APPROVAL' ? 'Semua pengajuan pembayaran sudah diproses.' : 'Belum ada data untuk filter ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubs.map((sub) => {
            const isPending = sub.status === 'PENDING_APPROVAL';
            const isActive = sub.status === 'ACTIVE';
            const isRejected = sub.status === 'REJECTED';
            const formattedAmount = sub.amount_paid 
              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(sub.amount_paid)
              : (sub.plans?.price ? `Rp ${sub.plans.price.toLocaleString('id-ID')}` : 'Gratis');

            return (
              <div
                key={sub.id}
                className={`bg-surface border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all ${
                  isPending ? 'border-amber-400 dark:border-amber-600/70 bg-amber-50/20' : 'border-ui-divider'
                }`}
              >
                <div>
                  {/* Top Bar Card */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {sub.plans?.name || 'Custom'} Plan
                    </span>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isPending
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                          : isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      }`}
                    >
                      {isPending ? 'MENUNGGU APPROVAL' : isActive ? 'AKTIF' : isRejected ? 'DITOLAK' : sub.status}
                    </span>
                  </div>

                  {/* User info */}
                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="text-on-surface font-bold truncate" title={sub.user_email || sub.user_name}>
                      👤 {sub.user_name || 'Pengguna'}
                    </div>
                    <div className="text-on-surface-variant text-[11px] truncate" title={sub.user_email}>
                      ✉️ {sub.user_email || `User ID: ${sub.user_id.slice(0, 8)}...`}
                    </div>
                    <div className="text-on-surface font-extrabold text-sm text-primary">
                      💰 {formattedAmount}
                    </div>
                    {sub.notes && (
                      <div className="bg-surface-container p-2 rounded-lg text-[10px] text-on-surface-variant leading-relaxed">
                        📝 {sub.notes}
                      </div>
                    )}
                    <div className="text-[10px] text-on-surface-variant">
                      🕒 Diajukan: {new Date(sub.created_at).toLocaleString('id-ID')}
                    </div>
                    {sub.end_date && (
                      <div className="text-[10px] text-on-surface-variant">
                        📅 Berakhir: {new Date(sub.end_date).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>

                  {/* Proof Image Thumbnail */}
                  {sub.payment_proof_url ? (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-on-surface-variant mb-1">Bukti Transfer (Klik untuk Zoom):</p>
                      <img
                        src={sub.payment_proof_url}
                        alt="Bukti Transfer"
                        onClick={() => setSelectedProofImg(sub.payment_proof_url)}
                        className="w-full h-32 object-cover rounded-xl border border-ui-divider cursor-pointer hover:opacity-90 transition-opacity shadow-inner"
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
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleApprove(sub)}
                        disabled={actionLoading === sub.id}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow transition-colors"
                      >
                        {actionLoading === sub.id ? (
                          <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">check</span>
                        )}
                        Setujui (Aktifkan)
                      </button>

                      <button
                        onClick={() => handleReject(sub)}
                        disabled={actionLoading === sub.id}
                        className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                        title="Tolak Pengajuan"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Tolak
                      </button>
                    </>
                  ) : isActive ? (
                    <button
                      onClick={() => handleApprove(sub)}
                      disabled={actionLoading === sub.id}
                      className="w-full bg-surface-container hover:bg-surface-variant text-on-surface font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">update</span>
                      Perpanjang 30 Hari Lagi
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(sub)}
                      disabled={actionLoading === sub.id}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Aktifkan Ulang
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedProofImg && (
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
          onClick={() => setSelectedProofImg(null)}
        >
          <div className="relative max-w-2xl w-full bg-surface rounded-2xl p-4 shadow-2xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="font-bold text-sm text-on-surface">Foto Bukti Transfer QRIS / Pembayaran</h3>
              <button
                onClick={() => setSelectedProofImg(null)}
                className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="w-full max-h-[75vh] overflow-auto flex items-center justify-center bg-black/5 dark:bg-black/40 rounded-xl p-2">
              <img
                src={selectedProofImg}
                alt="Bukti Transfer Zoom"
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow"
              />
            </div>

            <button
              onClick={() => setSelectedProofImg(null)}
              className="mt-4 w-full bg-primary text-white font-bold py-2 rounded-xl text-xs"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
