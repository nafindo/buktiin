import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    snap: any;
  }
}

const planDescriptions: Record<string, string> = {
  'FREE': 'Trial',
  'BASIC': 'Seller pemula',
  'STARTER': 'Seller growing',
  'PRO': 'Seller established',
  'BUSINESS': 'Tim/Warehouse',
  'ENTERPRISE': 'Large ops'
};

const planDevices: Record<string, string> = {
  'FREE': '1 Akun (Tidak bisa tambah staf)',
  'BASIC': '1 Akun (Tidak bisa tambah staf)',
  'STARTER': 'Maksimal 3 Akun',
  'PRO': 'Maksimal 10 Akun',
  'BUSINESS': 'Maksimal 50 Akun',
  'ENTERPRISE': 'Custom Multi-Akun'
};

import { fetchQrisSettings, DEFAULT_QRIS_SETTINGS, type QrisSettingsMap } from '../lib/qrisConfig';

type PeriodKey = 'monthly' | 'quarterly' | 'semiAnnual' | 'annual';

export default function SelectPlan() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('monthly');
  const [qrisSettings, setQrisSettings] = useState<QrisSettingsMap>(DEFAULT_QRIS_SETTINGS);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isSubAccount, setIsSubAccount] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);

  // Add-on state selections
  const [selectedExtraStorage, setSelectedExtraStorage] = useState('+25 GB');
  const [selectedExtraAccounts, setSelectedExtraAccounts] = useState('+2 Akun Staf');

  const navigate = useNavigate();

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
        // Filter out CONFIG_ row
        setPlans(plansRes.data.filter((p: any) => !p.name?.startsWith('CONFIG_')));
      }
      if (qrisRes) {
        setQrisSettings(qrisRes);
      }
      if (subsRes.data && subsRes.data.length > 0) {
        const active = subsRes.data.find((s: any) => s.status === 'ACTIVE' && (!s.end_date || new Date(s.end_date).getTime() > Date.now()));
        setCurrentSub(active || subsRes.data[0]);
      }
      setLoading(false);
    };
    fetchPlansAndConfig();
  }, [navigate]);

  const activePlanName = (currentSub?.plans?.name || '').toUpperCase();

  const getPlanPrice = (plan: any): number => {
    if (plan.name === 'ENTERPRISE' || plan.price === 0) return 0;
    const planKey = plan.name.toUpperCase();
    const configuredPrice = qrisSettings[planKey]?.[selectedPeriod]?.price;
    if (configuredPrice !== undefined && configuredPrice > 0) return configuredPrice;

    // Fallbacks
    if (selectedPeriod === 'monthly') return plan.price;
    if (selectedPeriod === 'quarterly') return Math.round(plan.price * 2.8);
    if (selectedPeriod === 'semiAnnual') return Math.round(plan.price * 5.4);
    if (selectedPeriod === 'annual') return plan.price * 10;
    return plan.price;
  };

  const getPeriodSuffix = (): string => {
    if (selectedPeriod === 'monthly') return '/bln (30 hr)';
    if (selectedPeriod === 'quarterly') return '/3 bln (90 hr)';
    if (selectedPeriod === 'semiAnnual') return '/6 bln (180 hr)';
    if (selectedPeriod === 'annual') return '/thn (365 hr)';
    return '/bln';
  };

  const handlePay = async (plan: any) => {
    if (paying) return;
    setPaying(true);

    // Free plan: CANNOT be renewed, only single-use 7-day trial for brand new users
    if (plan.price === 0 || plan.name === 'FREE') {
      alert('Paket Free Trial 7 Hari hanya berlaku 1 kali saat pendaftaran baru dan tidak dapat diperpanjang. Silakan pilih dan upgrade ke salah satu paket berbayar (BASIC, STARTER, PRO, BUSINESS).');
      setPaying(false);
      return;
    }

    // Paid Plan: Navigate to QRIS DANA payment & upload proof page
    setPaying(false);
    navigate(`/payment?planId=${plan.id}&period=${selectedPeriod}`);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* TopNavBar is handled by layout if applicable, or we just render the content below */}
      
      <main className="flex-grow container mx-auto px-2 py-3 sm:px-4 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-3">
          <h1 className="font-headline-md text-base sm:text-xl font-bold mb-1">Pilihan Paket Berlangganan</h1>
          <p className="text-on-surface-variant text-xs max-w-xl mx-auto mb-2">
            Tingkatkan keamanan gudang dan kapasitas kuota rekaman video toko Anda.
          </p>
          
          {/* 4-Period Duration Tabs Selector */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mt-2 max-w-xl mx-auto p-1 bg-surface-container rounded-2xl border border-ui-divider overflow-x-auto">
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

        {/* Pricing Grid */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3">
          {loading ? (
            <div className="w-full text-center py-6 text-on-surface-variant text-xs">Memuat daftar paket...</div>
          ) : (
            plans.map((plan) => {
              const isCurrentActivePlan = currentSub?.status === 'ACTIVE' && activePlanName === plan.name.toUpperCase() && (!currentSub.end_date || new Date(currentSub.end_date).getTime() > Date.now());

              return (
                <div key={plan.id} className={`pricing-card w-full sm:w-[260px] flex-shrink-0 flex flex-col bg-surface border ${isCurrentActivePlan ? 'border-2 border-status-success shadow-lg' : plan.name === 'STARTER' ? 'border-2 border-primary shadow-md' : 'border-ui-divider'} p-3 rounded-xl relative overflow-hidden transition-transform duration-200`}>
                  {isCurrentActivePlan ? (
                    <div className="absolute top-0 right-0">
                      <span className="bg-status-success text-white font-label-caps text-[9px] font-bold px-2 py-0.5 rounded-tr-lg rounded-bl-lg">
                        PAKET AKTIF ANDA
                      </span>
                    </div>
                  ) : plan.name === 'STARTER' ? (
                    <div className="absolute top-0 right-0">
                      <span className="bg-primary text-white font-label-caps text-[9px] font-bold px-2 py-0.5 rounded-tr-lg rounded-bl-lg">POPULER</span>
                    </div>
                  ) : null}

                  <div className="mb-2">
                    <h3 className={`font-label-caps text-xs font-bold ${plan.name === 'STARTER' ? 'text-primary' : 'text-on-surface-variant'}`}>{plan.name}</h3>
                    <p className="text-[11px] text-on-surface-variant mb-1">{planDescriptions[plan.name] || 'Pilihan terbaik untuk bisnis Anda'}</p>
                    <div className="flex items-baseline gap-0.5">
                      {plan.name !== 'ENTERPRISE' && (
                        <span className="text-xs font-bold">Rp</span>
                      )}
                      <span className="text-lg sm:text-xl font-extrabold">
                        {plan.name === 'ENTERPRISE' ? 'Custom' : getPlanPrice(plan).toLocaleString('id-ID')}
                      </span>
                      {plan.name !== 'ENTERPRISE' && (
                        <span className="text-on-surface-variant text-[10px]">{getPeriodSuffix()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow space-y-1 border-t border-ui-divider pt-2">
                    <ul className="space-y-1">
                      <li className="flex items-center gap-1.5 text-xs">
                        <span className="material-symbols-outlined text-status-success text-sm">check_circle</span>
                        <span>{plan.name === 'ENTERPRISE' ? 'Unlimited' : ((plan.storageLimit || plan.storagelimit) / 1000) + 'GB'} Cloud</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-xs">
                        <span className="material-symbols-outlined text-status-success text-sm">check_circle</span>
                        <span>{plan.name === 'ENTERPRISE' ? 'Unlimited' : (plan.orderLimit || plan.orderlimit)} Scan/hari</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-xs">
                        <span className="material-symbols-outlined text-status-success text-sm">devices</span>
                        <span>{planDevices[plan.name]}</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-xs">
                        <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                        <span className="font-medium">
                          {plan.name === 'FREE' 
                            ? 'Masa Aktif 7 Hari (Free Trial)' 
                            : plan.name === 'ENTERPRISE'
                            ? 'Masa Aktif Sesuai Kebutuhan'
                            : selectedPeriod === 'annual'
                            ? 'Masa Aktif 1 Tahun (365 Hari)'
                            : selectedPeriod === 'semiAnnual'
                            ? 'Masa Aktif 6 Bulan (180 Hari)'
                            : selectedPeriod === 'quarterly'
                            ? 'Masa Aktif 3 Bulan (90 Hari)'
                            : 'Masa Aktif 1 Bulan (30 Hari)'}
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
                  ) : plan.name === 'ENTERPRISE' ? (
                    <a 
                      href="https://wa.me/6281232797271?text=Halo%20Admin%20BUKTIIN%2C%20saya%20tertarik%20dengan%20Paket%20Enterprise.%20Mohon%20informasi%20dan%20penawaran%20sesuai%20kebutuhan%20kami."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full py-2 font-bold rounded-xl text-xs border border-on-surface text-on-surface hover:bg-surface-container flex items-center justify-center gap-1.5 transition-colors text-center shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm text-green-600">chat</span>
                      Hubungi Kami
                    </a>
                  ) : plan.name === 'FREE' ? (
                    <div className="mt-3 space-y-1">
                      <button 
                        disabled
                        className="w-full py-2 font-bold rounded-xl text-xs bg-surface-container text-on-surface-variant cursor-not-allowed border border-ui-divider flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">lock</span>
                        <span>{isCurrentActivePlan ? 'Trial Sedang Aktif (7 Hari)' : 'Trial 1x Terpakai'}</span>
                      </button>
                      <p className="text-[10px] text-center text-status-error font-medium leading-tight">
                        Free plan tidak dapat diperpanjang. Silakan upgrade ke paket berbayar di bawah.
                      </p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handlePay(plan)}
                      disabled={paying}
                      className={`mt-3 w-full py-2.5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        isCurrentActivePlan
                          ? 'bg-status-success text-white hover:opacity-90 active:scale-95'
                          : plan.name === 'STARTER' 
                          ? 'bg-primary text-white hover:opacity-90 active:scale-95' 
                          : 'border border-primary text-primary hover:bg-primary/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isCurrentActivePlan ? 'autorenew' : 'upgrade'}
                      </span>
                      <span>
                        {isCurrentActivePlan ? 'Perpanjang Paket Ini' : `Upgrade ke ${plan.name}`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

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

        {/* Trust Section (Bento Inspired) */}
        <div className="mt-xl grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="bg-surface-container-low p-md rounded-xl border border-ui-divider flex gap-md items-center">
            <div className="bg-primary-container p-sm rounded-DEFAULT">
              <span className="material-symbols-outlined text-on-primary-container">shield</span>
            </div>
            <div>
              <h4 className="font-label-caps text-label-caps">Secure Evidence</h4>
              <p className="text-[12px] text-on-surface-variant">Encrypted cloud storage for all packing logs.</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-md rounded-xl border border-ui-divider flex gap-md items-center">
            <div className="bg-secondary-container p-sm rounded-DEFAULT">
              <span className="material-symbols-outlined text-white">bolt</span>
            </div>
            <div>
              <h4 className="font-label-caps text-label-caps">Instantly Scan</h4>
              <p className="text-[12px] text-on-surface-variant">Direct integration with packing barcodes.</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-md rounded-xl border border-ui-divider flex gap-md items-center">
            <div className="bg-tertiary-container p-sm rounded-DEFAULT">
              <span className="material-symbols-outlined text-on-tertiary-container">support_agent</span>
            </div>
            <div>
              <h4 className="font-label-caps text-label-caps">24/7 Support</h4>
              <p className="text-[12px] text-on-surface-variant">Our local team is ready to help your warehouse.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-ui-divider w-full px-lg py-md flex flex-col md:flex-row justify-between items-center gap-md mt-auto">
        <div className="font-label-caps text-label-caps text-on-surface-variant">
          © 2026 Nafindo Group. All Rights Reserved.
        </div>
        <div className="flex gap-md items-center font-code-sm text-code-sm text-on-surface-variant">
          <span>v2.4.0-stable</span>
          <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
          <span>Developed by Nafindo Group</span>
        </div>
      </footer>
    </div>
  );
}
