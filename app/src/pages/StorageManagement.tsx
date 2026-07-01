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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Fetch user plan (Independent from API)
      try {
        const { data: subArray } = await supabase
          .from('subscriptions')
          .select('status, plans ( name, storagelimit )')
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(1);

        if (subArray && subArray.length > 0) {
          const subData = subArray[0];
          const planData = Array.isArray(subData.plans) ? subData.plans[0] : subData.plans;
          if (planData) {
            setPlanName(planData.name);
            setMaxStorageMB(planData.storagelimit);
          }
        }
      } catch (err) {
        console.error('Supabase subscription fetch error:', err);
      }

      // Fetch storage usage (Independent from Supabase)
      try {
        const res = await fetch(`http://localhost:3001/api/dashboard?userId=${user.id}`);
        const result = await res.json();
        if (result.success && result.data.totalStorageBytes !== undefined) {
          setTotalStorageBytes(result.data.totalStorageBytes);
        }
      } catch (err) {
        console.error('Backend dashboard fetch error:', err);
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
      <div className="px-lg py-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Storage Management</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage your cloud evidence capacity and archival rules.</p>
      </div>
      
      <div className="px-lg pb-xl space-y-lg max-w-container-max mx-auto w-full flex-1">
        {/* Top Section */}
        <div className="flex flex-col gap-lg">
          {/* Storage Usage Card */}
          <div className="p-xl bg-surface-container-lowest border border-ui-divider rounded-lg flex flex-col justify-between hover:border-primary hover:bg-surface-container-low transition-all duration-200">
            <div className="flex justify-between items-start mb-md">
              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Current Usage</span>
                <h3 className="font-headline-md text-headline-md font-bold">{currentUsageGB} GB <span className="font-normal text-on-surface-variant">/ {maxUsageGB} GB</span></h3>
              </div>
              <div className="bg-status-processing px-3 py-1 rounded-DEFAULT">
                <span className="font-label-caps text-label-caps text-white text-[12px]">{planName} PLAN</span>
              </div>
            </div>
            
            <div className="w-full h-8 bg-surface-container rounded-DEFAULT overflow-hidden relative border border-ui-divider mb-lg">
              {/* Progress Bar */}
              <div className="h-full bg-status-processing transition-all duration-500 ease-out" style={{ width: `${percentage}%` }}></div>
              <div className="absolute inset-0 flex items-center justify-end px-md">
                <span className="font-code-sm text-code-sm font-bold text-on-surface-variant">{percentage}% USED</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-md">
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Your storage is reaching its limit. Upgrade now to avoid service interruption during high-volume periods.</p>
              <button 
                onClick={() => navigate('/plans')}
                className="w-full sm:w-auto px-lg py-md bg-primary text-white font-bold rounded-DEFAULT hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">upgrade</span>
                UPGRADE PLAN
              </button>
            </div>
          </div>

        </div>


      </div>

      {/* Footer */}
      <footer className="mt-auto flex flex-col md:flex-row justify-between items-center w-full px-lg py-md border-t border-ui-divider bg-surface">
        <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 md:mb-0">© 2026 Nafindo Group. All Rights Reserved.</span>
        <div className="flex items-center gap-md">
          <span className="font-code-sm text-code-sm text-on-surface-variant">BUKTIIN v2.4.0-build.88</span>
          <span className="font-code-sm text-code-sm text-on-surface-variant font-bold">Developed by Nafindo Group</span>
        </div>
      </footer>
    </div>
  );
}
