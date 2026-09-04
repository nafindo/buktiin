import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchQrisSettings, DEFAULT_QRIS_SETTINGS, type QrisSettingsMap } from '../lib/qrisConfig';

declare global {
  interface Window {
    snap: any;
  }
}

export const PLAN_HIERARCHY: Record<string, number> = {
  'FREE': 0,
  'BASIC': 1,
  'STARTER': 2,
  'PRO': 3,
  'BUSINESS': 4,
  'ENTERPRISE': 5
};

const planDescriptions: Record<string, string> = {
  'FREE': 'Trial 7 Hari',
  'BASIC': 'Seller Pemula',
  'STARTER': 'Seller Berkembang',
  'PRO': 'Seller Mapan',
  'BUSINESS': 'Gudang & Tim Skala Besar',
  'ENTERPRISE': 'Operasional Enterprise Custom'
};

const planDevices: Record<string, string> = {
  'FREE': '1 Akun (Tidak bisa tambah staf)',
  'BASIC': '1 Akun (Tidak bisa tambah staf)',
  'STARTER': 'Maksimal 3 Akun (1 Utama + 2 Staf)',
  'PRO': 'Maksimal 10 Akun (1 Utama + 9 Staf)',
  'BUSINESS': 'Maksimal 50 Akun (1 Utama + 49 Staf)',
  'ENTERPRISE': 'Custom Multi-Akun Tanpa Batas'
};

type PeriodKey = 'monthly' | 'quarterly' | 'semiAnnual' | 'annual';

export default function SelectPlan() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') as 'renew' | 'upgrade' | null;

  const [activeTab, setActiveTab] = useState<'renew' | 'upgrade'>('upgrade');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('monthly');
  const [qrisSettings, setQrisSettings] = useState<QrisSettingsMap>(DEFAULT_QRIS_SETTINGS);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [isSubAccount, setIsSubAccount] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);

  // Add-on state selections
  const [selectedExtraStorage, setSelectedExtraStorage] = useState('+25 GB');
  const [selectedExtraAccounts, setSelectedExtraAccounts] = useState('+2 Akun Staf');

  useEffect(() => {
    const fetchPlansAndConfig = async () => {
      setIsSubAccount(localStorage.getItem('isSubAccount') === 'true');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUserEmail(session.user.email || '');

      const [plansRes, qrisRes, subsRes] = await Promise.all([
        supabase.from('plans').select('*').order('price', { ascending: true }),
        fetchQrisSettings(),
        supabase.from('subscriptions').select('*, plans(*)').eq('user_id', session.user.id).order('created_at', { ascending: false })
      ]);

      if (plansRes.data) {
        setPlans(plansRes.data.filter((p: any) => !p.name?.startsWith('CONFIG_')));
      }
      if (qrisRes) {
        setQrisSettings(qrisRes);
      }

      let activePlanNameUpper = 'FREE';
      if (subsRes.data && subsRes.data.length > 0) {
        const active = subsRes.data.find((s: any) => s.status === 'ACTIVE' && (!s.end_date || new Date(s.end_date).getTime() > Date.now()));
        const subToUse = active || subsRes.data[0];
        setCurrentSub(subToUse);
        activePlanNameUpper = (subToUse?.plans?.name || '').toUpperCase();
      }

      // Determine default tab based on user's plan and initialMode
      if (initialMode === 'renew') {
        if (activePlanNameUpper !== 'FREE') {
          setActiveTab('renew');
        } else {
          setActiveTab('upgrade');
        }
      } else if (initialMode === 'upgrade') {
        setActiveTab('upgrade');
      } else {
        // If not specified: if active paid plan, default to renew; if free, default to upgrade
        if (activePlanNameUpper && activePlanNameUpper !== 'FREE') {
          setActiveTab('renew');
        } else {
          setActiveTab('upgrade');
        }
      }

      setLoading(false);
    };

    fetchPlansAndConfig();
  }, [navigate, initialMode]);

  const activePlanName = (currentSub?.plans?.name || 'FREE').toUpperCase();
  const currentPlanRank = PLAN_HIERARCHY[activePlanName] ?? 0;
  const isFreePlan = activePlanName === 'FREE';

  const getPlanPrice = (plan: any, period: PeriodKey = selectedPeriod): number => {
    if (!plan || plan.name === 'ENTERPRISE' || plan.price === 0) return 0;
    const planKey = plan.name.toUpperCase();
    const configuredPrice = qrisSettings[planKey]?.[period]?.price;
    if (configuredPrice !== undefined && configuredPrice > 0) return configuredPrice;

    // Fallbacks
    if (period === 'monthly') return plan.price;
    if (period === 'quarterly') return Math.round(plan.price * 2.8);
    if (period === 'semiAnnual') return Math.round(plan.price * 5.4);
    if (period === 'annual') return plan.price * 10;
    return plan.price;
  };

  const getPeriodSuffix = (period: PeriodKey = selectedPeriod): string => {
    if (period === 'monthly') return '/bln (30 hr)';
    if (period === 'quarterly') return '/3 bln (90 hr)';
    if (period === 'semiAnnual') return '/6 bln (180 hr)';
    if (period === 'annual') return '/thn (365 hr)';
    return '/bln';
  };

  const getPeriodDays = (period: PeriodKey = selectedPeriod): number => {
    if (period === 'annual') return 365;
    if (period === 'semiAnnual') return 180;
    if (period === 'quarterly') return 90;
    return 30;
  };

  // 1. Action: Direct Renew for current running subscription
  const handleRenew = (planObj: any) => {
    if (isFreePlan || planObj?.name?.toUpperCase() === 'FREE') {
      alert('Paket Free Trial 7 Hari tidak dapat diperpanjang. Silakan gunakan tab Upgrade Plan untuk memilih paket berbayar.');
      setActiveTab('upgrade');
      return;
    }
    navigate(`/payment?planId=${planObj.id}&period=${selectedPeriod}&mode=renew`);
  };

  // 2. Action: Upgrade to higher plan
  const handleUpgrade = (planObj: any) => {
    navigate(`/payment?planId=${planObj.id}&period=${selectedPeriod}&mode=upgrade`);
  };

  // Available plans for upgrade: strictly rank > currentPlanRank (NO DOWNGRADE)
  const availableUpgradePlans = plans.filter((p: any) => {
    const r = PLAN_HIERARCHY[p.name.toUpperCase()] ?? 0;
    return r > currentPlanRank;
  });

  // Active plan object
  const activePlanObj = plans.find((p: any) => p.id === currentSub?.plan_id || p.name.toUpperCase() === activePlanName) || currentSub?.plans;

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-grow container mx-auto px-2 py-3 sm:px-4 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-3">
          <h1 className="font-headline-md text-base sm:text-xl font-bold mb-1">
            Paket & Langganan Gudang
          </h1>
          <p className="text-on-surface-variant text-xs max-w-xl mx-auto mb-2">
            Kelola masa aktif langganan Anda dan tingkatkan kapasitas toko sesuai kebutuhan.
          </p>

          {/* Current Subscription Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container border border-ui-divider text-xs mb-3 shadow-xs">
            <span className="text-on-surface-variant">Paket Anda Saat Ini:</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">verified</span>
              {activePlanName}
            </span>
            {currentSub && (
              <span className="text-[11px] text-on-surface-variant/80">
                ({currentSub.status === 'ACTIVE'
                  ? currentSub.end_date
                    ? `Aktif s/d ${new Date(currentSub.end_date).toLocaleDateString('id-ID')}`
                    : 'Aktif'
                  : 'Masa Aktif Berakhir'})
              </span>
            )}
          </div>

          {/* DUA TAB UTAMA YANG JELAS: PERPANJANG vs UPGRADE PLAN */}
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto p-1 bg-surface-container-low rounded-2xl border border-ui-divider mb-3">
            <button
              type="button"
              onClick={() => {
                if (isFreePlan) {
                  alert('Paket Free Trial 7 Hari tidak dapat diperpanjang. Silakan pilih tab Upgrade Plan untuk memilih paket berbayar.');
                  return;
                }
                setActiveTab('renew');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'renew'
                  ? 'bg-status-success text-white shadow-sm'
                  : isFreePlan
                  ? 'text-on-surface-variant/50 cursor-not-allowed'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">autorenew</span>
              <span>Perpanjang Paket</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upgrade')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'upgrade'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">upgrade</span>
              <span>Upgrade Plan</span>
            </button>
          </div>

          {/* 4-Period Duration Selector Tabs */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 max-w-xl mx-auto p-1 bg-surface-container rounded-2xl border border-ui-divider overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedPeriod === 'monthly'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              1 Bulan (30 Hari)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('quarterly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedPeriod === 'quarterly'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Triwulan (90 Hari)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('semiAnnual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedPeriod === 'semiAnnual'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              6 Bulan (180 Hari)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('annual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                selectedPeriod === 'annual'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Tahunan (365 Hari)</span>
              <span className="bg-amber-400 text-amber-950 text-[9px] px-1 py-0.2 rounded font-black">HEMAT</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            TAB 1: PERPANJANG PAKET AKTIF (RENEW)
            "perpanjang langsung kirim langganan yang sudah jalan dengan bukti pembayaran"
           ======================================================== */}
        {activeTab === 'renew' && (
          <div className="max-w-xl mx-auto my-4 animate-[fade-in_0.2s_ease-out]">
            {isFreePlan ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center space-y-3">
                <span className="material-symbols-outlined text-amber-600 text-4xl">info</span>
                <h3 className="font-headline-md font-bold text-base text-amber-900 dark:text-amber-200">
                  Paket Free Trial Tidak Dapat Diperpanjang
                </h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                  Paket Free Trial 7 Hari hanya berlaku 1 kali pendaftaran awal. Untuk melanjutkan akses rekaman dan pemindaian gudang, silakan beralih ke tab <strong>Upgrade Plan</strong> untuk memilih paket berbayar (BASIC, STARTER, PRO, BUSINESS).
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('upgrade')}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs flex items-center gap-2 mx-auto shadow-md"
                >
                  <span className="material-symbols-outlined text-base">upgrade</span>
                  <span>Buka Pilihan Upgrade Plan</span>
                </button>
              </div>
            ) : activePlanObj ? (
              <div className="bg-surface border-2 border-status-success rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0">
                  <span className="bg-status-success text-white font-label-caps text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-xs">
                    PAKET BERJALAN ANDA
                  </span>
                </div>

                <div>
                  <h3 className="font-headline-md text-lg sm:text-xl font-bold text-on-surface">
                    Perpanjang Paket {activePlanName}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {planDescriptions[activePlanName] || 'Perpanjang masa aktif paket Anda tanpa mengubah kuota.'}
                  </p>
                </div>

                {/* Price Display */}
                <div className="bg-surface-container rounded-xl p-4 border border-ui-divider flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-on-surface-variant block">Total Biaya Perpanjangan:</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold">Rp</span>
                      <span className="text-2xl sm:text-3xl font-black text-status-success">
                        {getPlanPrice(activePlanObj).toLocaleString('id-ID')}
                      </span>
                      <span className="text-on-surface-variant text-xs">{getPeriodSuffix()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-status-success/15 text-status-success border border-status-success/30 px-2 py-0.5 rounded-full font-bold">
                      +{getPeriodDays()} Hari
                    </span>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      Masa aktif akumulatif otomatis
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2 border-t border-ui-divider pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-status-success text-base">check_circle</span>
                    <span>Penyimpanan Cloud: <strong>{((activePlanObj.storageLimit || activePlanObj.storagelimit || 5000) / 1000)} GB</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-status-success text-base">check_circle</span>
                    <span>Batas Scan: <strong>{activePlanObj.orderLimit || activePlanObj.orderlimit || 200} order/hari</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-status-success text-base">devices</span>
                    <span>{planDevices[activePlanName]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">autorenew</span>
                    <span>Perpanjangan akan otomatis menambahkan <strong>{getPeriodDays()} hari</strong> ke akhir masa aktif saat ini.</span>
                  </div>
                </div>

                {/* Direct Action Button: Goes directly to payment and upload proof */}
                <button
                  type="button"
                  onClick={() => handleRenew(activePlanObj)}
                  className="w-full py-3 bg-status-success hover:bg-status-success/90 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-base">receipt_long</span>
                  <span>Lanjutkan Pembayaran & Kirim Bukti Transfer ({activePlanName})</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upgrade')}
                    className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ingin kapasitas lebih besar atau tambah sub akun? Beralih ke Upgrade Plan</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-on-surface-variant text-xs">
                Memuat data langganan Anda...
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: UPGRADE PLAN (HANYA PAKET DI ATAS PLAN SAAT INI)
            "sedangkan upgrade baru kasih pilihan langganan diatas plan saat ini... plan gak bisa downgrade"
           ======================================================== */}
        {activeTab === 'upgrade' && (
          <div className="space-y-4 animate-[fade-in_0.2s_ease-out]">
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-sm font-bold text-on-surface">
                Pilihan Upgrade Paket Lebih Tinggi
              </h2>
              <p className="text-on-surface-variant text-xs mt-0.5">
                {isFreePlan
                  ? 'Pilih salah satu paket berbayar untuk mengaktifkan akun toko Anda secara penuh.'
                  : `Hanya menampilkan paket di atas ${activePlanName}. Kuota dan kapasitas akun akan langsung bertambah.`}
              </p>
            </div>

            {loading ? (
              <div className="w-full text-center py-8 text-on-surface-variant text-xs flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-base">sync</span>
                <span>Memuat daftar paket upgrade...</span>
              </div>
            ) : availableUpgradePlans.length === 0 ? (
              <div className="max-w-md mx-auto bg-surface border border-ui-divider rounded-2xl p-6 text-center space-y-3 shadow-sm">
                <span className="material-symbols-outlined text-primary text-4xl">workspace_premium</span>
                <h3 className="font-headline-md font-bold text-base text-on-surface">
                  Anda Berada di Paket Tertinggi
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Selamat! Akun Anda saat ini telah menggunakan paket dengan tingkatan tertinggi (<strong>{activePlanName}</strong>).
                </p>
                <div className="pt-2">
                  <a
                    href="https://wa.me/6281232797271?text=Halo%20Admin%20BUKTIIN%2C%20kami%20membutuhkan%20kustomisasi%20server%20gudang%20skala%20Enterprise."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                    <span>Konsultasi Server Khusus</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3">
                {availableUpgradePlans.map((plan: any) => {
                  const isStarter = plan.name === 'STARTER';
                  const isEnterprise = plan.name === 'ENTERPRISE';

                  return (
                    <div
                      key={plan.id}
                      className={`pricing-card w-full sm:w-[260px] flex-shrink-0 flex flex-col bg-surface border ${
                        isStarter ? 'border-2 border-primary shadow-md' : 'border-ui-divider'
                      } p-3 rounded-xl relative overflow-hidden transition-transform duration-200`}
                    >
                      {isStarter && (
                        <div className="absolute top-0 right-0">
                          <span className="bg-primary text-white font-label-caps text-[9px] font-bold px-2 py-0.5 rounded-tr-lg rounded-bl-lg">
                            POPULER
                          </span>
                        </div>
                      )}

                      <div className="mb-2">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-label-caps text-xs font-bold ${isStarter ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {plan.name}
                          </h3>
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-black">
                            UPGRADE
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mb-1">
                          {planDescriptions[plan.name] || 'Pilihan terbaik untuk bisnis Anda'}
                        </p>
                        <div className="flex items-baseline gap-0.5">
                          {!isEnterprise && <span className="text-xs font-bold">Rp</span>}
                          <span className="text-lg sm:text-xl font-extrabold">
                            {isEnterprise ? 'Custom' : getPlanPrice(plan).toLocaleString('id-ID')}
                          </span>
                          {!isEnterprise && (
                            <span className="text-on-surface-variant text-[10px]">{getPeriodSuffix()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex-grow space-y-1 border-t border-ui-divider pt-2">
                        <ul className="space-y-1">
                          <li className="flex items-center gap-1.5 text-xs">
                            <span className="material-symbols-outlined text-status-success text-sm">check_circle</span>
                            <span>{isEnterprise ? 'Unlimited' : ((plan.storageLimit || plan.storagelimit) / 1000) + 'GB'} Cloud</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-xs">
                            <span className="material-symbols-outlined text-status-success text-sm">check_circle</span>
                            <span>{isEnterprise ? 'Unlimited' : (plan.orderLimit || plan.orderlimit)} Scan/hari</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-xs">
                            <span className="material-symbols-outlined text-status-success text-sm">devices</span>
                            <span>{planDevices[plan.name]}</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-xs">
                            <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                            <span className="font-medium">
                              {isEnterprise
                                ? 'Masa Aktif Kustom'
                                : `Masa Aktif ${getPeriodDays()} Hari`}
                            </span>
                          </li>
                        </ul>
                      </div>

                      {isSubAccount ? (
                        <button
                          disabled
                          className="mt-3 w-full py-2 font-bold rounded-xl text-xs bg-surface-container text-on-surface-variant cursor-not-allowed"
                        >
                          Akun Staf
                        </button>
                      ) : isEnterprise ? (
                        <a
                          href="https://wa.me/6281232797271?text=Halo%20Admin%20BUKTIIN%2C%20saya%20tertarik%20dengan%20Paket%20Enterprise.%20Mohon%20informasi%20dan%20penawaran%20sesuai%20kebutuhan%20kami."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 w-full py-2 font-bold rounded-xl text-xs border border-on-surface text-on-surface hover:bg-surface-container flex items-center justify-center gap-1.5 transition-colors text-center shadow-xs"
                        >
                          <span className="material-symbols-outlined text-sm text-green-600">chat</span>
                          Hubungi Kami
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpgrade(plan)}
                          className={`mt-3 w-full py-2.5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                            isStarter
                              ? 'bg-primary text-white hover:opacity-90'
                              : 'border border-primary text-primary hover:bg-primary/10'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">upgrade</span>
                          <span>Pilih & Upgrade ke {plan.name}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Fitur Baru: Add-on Penambahan Kuota Penyimpanan & Sub Akun Staf */}
        <div className="mt-8 bg-surface-container-lowest border-2 border-primary/30 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-ui-divider">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">extension</span>
                <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
                  Fitur Baru: Tambah Kuota Penyimpanan & Sub Akun Staf (Add-on)
                </h3>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Plugin Tambahan
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Khusus pengguna paket <strong>BASIC, STARTER, PRO, dan BUSINESS</strong>. Tambahkan kapasitas penyimpanan cloud dan jumlah akun staf multi-perangkat tanpa perlu beralih ke paket Enterprise.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Addon 1: Storage Cloud */}
            <div className="bg-surface border border-ui-divider rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">cloud_upload</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">1. Tambahan Kuota Penyimpanan Cloud</h4>
                  <p className="text-[11px] text-on-surface-variant">Tambah kapasitas GB penyimpanan rekaman video packing & unboxing</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {['+10 GB', '+25 GB', '+50 GB', '+100 GB'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedExtraStorage(opt)}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all ${
                      selectedExtraStorage === opt
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-ui-divider text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-on-surface-variant italic">
                * Kapasitas GB langsung ditambahkan ke kuota penyimpanan cloud akun Anda.
              </p>
            </div>

            {/* Addon 2: Sub-Accounts */}
            <div className="bg-surface border border-ui-divider rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">group_add</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">2. Tambahan Sub Akun Staf (Multi-Device)</h4>
                  <p className="text-[11px] text-on-surface-variant">Solusi 1 Akun 1 Perangkat untuk banyak operator gudang sekaligus</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {['+1 Akun Staf', '+2 Akun Staf', '+5 Akun Staf', '+10 Akun Staf'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedExtraAccounts(opt)}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all ${
                      selectedExtraAccounts === opt
                        ? 'border-secondary bg-secondary/10 text-secondary shadow-xs'
                        : 'border-ui-divider text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-on-surface-variant italic">
                * Mengizinkan staf tambahan login di HP / PC masing-masing secara bersamaan.
              </p>
            </div>
          </div>

          {/* Action Order via WhatsApp */}
          <div className="mt-4 pt-3 border-t border-ui-divider flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-xs text-on-surface-variant">
              <span>Pilihan Anda: </span>
              <strong className="text-primary">{selectedExtraStorage} Cloud Storage</strong> & <strong className="text-secondary">{selectedExtraAccounts}</strong>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Nominal harga disesuaikan secara transparan & fleksibel. Hubungi admin untuk mendapatkan total biaya & QRIS pembayaran.
              </p>
            </div>

            <a
              href={`https://wa.me/6281232797271?text=${encodeURIComponent(
                `Halo Admin BUKTIIN, saya ingin mengajukan penambahan Add-on untuk akun gudang saya:\n- Email Akun: ${userEmail || '-'}\n- Paket Saat Ini: ${activePlanName || 'Langganan'}\n- Tambahan Penyimpanan: ${selectedExtraStorage}\n- Tambahan Sub Akun: ${selectedExtraAccounts}\n\nMohon informasi total harga dan link/barcode QRIS pembayarannya. Terima kasih!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all whitespace-nowrap self-stretch sm:self-auto justify-center"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              Ajukan Add-on via WhatsApp
            </a>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-surface-container-low p-3 rounded-xl border border-ui-divider flex gap-3 items-center">
            <div className="bg-primary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-on-primary-container text-xl">shield</span>
            </div>
            <div>
              <h4 className="font-label-caps text-xs font-bold text-on-surface">Secure Evidence</h4>
              <p className="text-[11px] text-on-surface-variant">Penyimpanan cloud terenkripsi untuk seluruh rekaman video packing.</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-3 rounded-xl border border-ui-divider flex gap-3 items-center">
            <div className="bg-secondary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-white text-xl">bolt</span>
            </div>
            <div>
              <h4 className="font-label-caps text-xs font-bold text-on-surface">Instantly Scan</h4>
              <p className="text-[11px] text-on-surface-variant">Integrasi langsung dengan pemindai barcode paket ekspedisi.</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-3 rounded-xl border border-ui-divider flex gap-3 items-center">
            <div className="bg-tertiary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-on-tertiary-container text-xl">support_agent</span>
            </div>
            <div>
              <h4 className="font-label-caps text-xs font-bold text-on-surface">24/7 Support</h4>
              <p className="text-[11px] text-on-surface-variant">Tim teknis siap membantu kelancaran operasional gudang Anda.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-ui-divider w-full px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-2 mt-auto text-xs text-on-surface-variant">
        <div className="font-label-caps">
          © 2026 Nafindo Group. All Rights Reserved.
        </div>
        <div className="flex gap-3 items-center font-code-sm">
          <span>v2.4.0-stable</span>
          <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
          <span>Developed by Nafindo Group</span>
        </div>
      </footer>
    </div>
  );
}
