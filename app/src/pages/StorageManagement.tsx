import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function StorageManagement() {
  const navigate = useNavigate();
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);
  const [planName, setPlanName] = useState('FREE');
  const [maxStorageMB, setMaxStorageMB] = useState(5000); // Default to Free (5000 MB)

  useEffect(() => {
    const fetchStorage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const user = session.user;
      
      // Fetch user plan (Independent from API)
      try {
        const { data: subArray } = await supabase
          .from('subscriptions')
          .select('*, plans ( name, storagelimit )')
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(1);

        if (subArray && subArray.length > 0) {
          const subData = subArray[0];
          const planData = Array.isArray(subData.plans) ? subData.plans[0] : subData.plans;
          if (planData) {
            setPlanName(planData.name);
            const subExtraGB = Number(subData.extra_storage_gb || 0);
            const metaExtraGB = Number(user.user_metadata?.extra_storage_gb || 0);
            const extraMB = Math.max(subExtraGB, metaExtraGB) * 1024;
            setMaxStorageMB((planData.storagelimit || 5000) + extraMB);
          }
        }
      } catch (err) {
        console.error('Supabase subscription fetch error:', err);
      }

      // Fetch storage usage
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        if (API_URL) {
          const res = await fetch(`${API_URL}/api/dashboard?userId=${user.id}&accessToken=${session.access_token}`);
          const result = await res.json();
          if (result.success && result.data.totalStorageBytes !== undefined) {
            setTotalStorageBytes(result.data.totalStorageBytes);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend storage usage fetch error, falling back to Supabase:', err);
      }

      // Standalone direct computation from Supabase
      try {
        const { data: recs } = await supabase
          .from('recordings')
          .select('video_size')
          .eq('user_id', user.id);
        const total = (recs || []).reduce((sum, r) => sum + (Number(r.video_size) || 0), 0);
        setTotalStorageBytes(total);
      } catch (e) {
        console.error('Direct Supabase storage calculation error:', e);
      }
    };
    fetchStorage();
  }, []);

  const currentUsageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const maxUsageGB = (maxStorageMB / 1024).toFixed(1).replace('.0', '');
  const maxStorageBytesActual = maxStorageMB * 1024 * 1024;
  const percentage = Math.min(100, (totalStorageBytes / maxStorageBytesActual) * 100).toFixed(1);

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="px-3 py-2 border-b border-ui-divider bg-surface">
        <h2 className="font-headline-md text-sm sm:text-base font-bold text-on-surface">Kapasitas Penyimpanan Cloud</h2>
        <p className="font-body-md text-[10px] sm:text-xs text-on-surface-variant">Kelola kapasitas penyimpanan video bukti packing & unboxing toko Anda.</p>
      </div>
      
      <div className="p-2 sm:p-3 space-y-2 max-w-container-max mx-auto w-full flex-1">
        {/* Top Section */}
        <div className="flex flex-col gap-2">
          {/* Storage Usage Card */}
          <div className="p-3 bg-surface-container-lowest border border-ui-divider rounded-xl flex flex-col justify-between hover:border-primary transition-all">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-label-caps text-[10px] text-on-surface-variant block mb-0.5">Penggunaan Saat Ini</span>
                <h3 className="font-headline-md text-base sm:text-lg font-bold">{currentUsageGB} GB <span className="font-normal text-xs text-on-surface-variant">/ {maxUsageGB} GB</span></h3>
              </div>
              <div className="bg-primary/10 px-2 py-0.5 rounded">
                <span className="font-label-caps text-primary text-[10px] font-bold">{planName} PLAN</span>
              </div>
            </div>
            
            <div className="w-full h-5 bg-surface-container rounded overflow-hidden relative border border-ui-divider mb-3">
              {/* Progress Bar */}
              <div className="h-full bg-status-processing transition-all duration-500 ease-out" style={{ width: `${percentage}%` }}></div>
              <div className="absolute inset-0 flex items-center justify-end px-2">
                <span className="font-code-sm text-[9px] font-bold text-on-surface-variant">{percentage}% DIGUNAKAN</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <p className="font-body-md text-[11px] text-on-surface-variant max-w-md">
                {planName !== 'FREE' ? (
                  <>Butuh kuota lebih besar? Anda bisa menambah Add-on Storage atau upgrade paket langganan toko Anda.</>
                ) : (
                  <>Upgrade paket untuk menambah kapasitas kuota penyimpanan video cloud Anda.</>
                )}
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {planName !== 'FREE' && (
                  <button 
                    onClick={() => navigate('/plans')}
                    className="flex-1 sm:flex-none px-3 py-1.5 border border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">extension</span>
                    TAMBAH ADD-ON
                  </button>
                )}
                <button 
                  onClick={() => navigate('/plans')}
                  className="flex-1 sm:flex-none px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">upgrade</span>
                  UPGRADE PAKET
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="mt-auto flex flex-row justify-between items-center w-full px-3 py-1.5 border-t border-ui-divider bg-surface text-[10px] text-on-surface-variant">
        <span>© 2026 Nafindo Group.</span>
        <span className="font-code-sm">v4.0.0</span>
      </footer>
    </div>
  );
}
