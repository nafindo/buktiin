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

export default function SelectPlan() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [userId, setUserId] = useState('');
  const [isSubAccount, setIsSubAccount] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      setIsSubAccount(localStorage.getItem('isSubAccount') === 'true');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUserId(session.user.id);
      
      const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
      // Show all plans including FREE at the front, and ENTERPRISE at the back.
      if (data) setPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, [navigate]);

  const toggleBilling = () => {
    setIsAnnual(!isAnnual);
  };

  const handlePay = async (plan: any) => {
    if (paying) return;
    setPaying(true);

    // Free plan: direct activation
    if (plan.price === 0) {
      try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        await supabase.from('subscriptions').insert({
          user_id: userId,
          plan_id: plan.id,
          status: 'ACTIVE',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });
        alert(`Paket ${plan.name} berhasil diaktifkan!`);
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Failed to activate plan:', err);
        alert('Gagal mengaktifkan paket: ' + (err.message || String(err)));
      } finally {
        setPaying(false);
      }
      return;
    }

    // Paid Plan: Navigate to QRIS DANA payment & upload proof page
    setPaying(false);
    navigate(`/payment?planId=${plan.id}&isAnnual=${isAnnual ? '1' : '0'}`);
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
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`font-label-caps text-xs ${!isAnnual ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`} id="monthly-label">Bulanan</span>
            <button 
              className="relative w-11 h-6 bg-surface-container-highest rounded-full p-0.5 focus:outline-none transition-colors" 
              onClick={toggleBilling}
            >
              <div className={`w-5 h-5 bg-primary rounded-full transition-transform transform ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
            <span className={`font-label-caps text-xs ${isAnnual ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`} id="annual-label">
              Tahunan <span className="bg-primary-container text-on-primary-container text-[9px] px-1.5 py-0.5 rounded-full ml-0.5 font-bold">HEMAT 17%</span>
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3">
          {loading ? (
            <div className="w-full text-center py-6 text-on-surface-variant text-xs">Memuat daftar paket...</div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className={`pricing-card w-full sm:w-[260px] flex-shrink-0 flex flex-col bg-surface border ${plan.name === 'STARTER' ? 'border-2 border-primary shadow-md' : 'border-ui-divider'} p-3 rounded-xl relative overflow-hidden transition-transform duration-200`}>
                {plan.name === 'STARTER' && (
                  <div className="absolute top-0 right-0">
                    <span className="bg-primary text-white font-label-caps text-[9px] font-bold px-2 py-0.5 rounded-tr-lg rounded-bl-lg">POPULER</span>
                  </div>
                )}
                <div className="mb-2">
                  <h3 className={`font-label-caps text-xs font-bold ${plan.name === 'STARTER' ? 'text-primary' : 'text-on-surface-variant'}`}>{plan.name}</h3>
                  <p className="text-[11px] text-on-surface-variant mb-1">{planDescriptions[plan.name] || 'Pilihan terbaik untuk bisnis Anda'}</p>
                  <div className="flex items-baseline gap-0.5">
                    {plan.name !== 'ENTERPRISE' && (
                      <span className="text-xs font-bold">Rp</span>
                    )}
                    <span className="text-lg sm:text-xl font-extrabold">
                      {plan.name === 'ENTERPRISE' ? 'Custom' : (isAnnual ? plan.price * 10 : plan.price).toLocaleString('id-ID')}
                    </span>
                    {plan.name !== 'ENTERPRISE' && (
                      <span className="text-on-surface-variant text-[10px]">/{isAnnual ? 'thn' : 'bln'}</span>
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
                  </ul>
                </div>
                {isSubAccount ? (
                  <button 
                    disabled
                    className="mt-3 w-full py-1.5 font-bold rounded-lg text-xs bg-surface-container text-on-surface-variant cursor-not-allowed"
                  >
                    Akun Staf
                  </button>
                ) : plan.name === 'ENTERPRISE' ? (
                  <a 
                    href="https://wa.me/6281232797271?text=Halo%20Admin%20BUKTIIN%2C%20saya%20tertarik%20dengan%20Paket%20Enterprise.%20Mohon%20informasi%20dan%20penawaran%20sesuai%20kebutuhan%20kami."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full py-1.5 font-bold rounded-lg text-xs border border-on-surface text-on-surface hover:bg-surface-container flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <span className="material-symbols-outlined text-sm text-green-600">chat</span>
                    Hubungi Kami
                  </a>
                ) : plan.name === 'FREE' ? (
                  <button 
                    disabled
                    className="mt-3 w-full py-1.5 font-bold rounded-lg text-xs bg-surface-container text-on-surface-variant cursor-not-allowed"
                  >
                    Paket Saat Ini
                  </button>
                ) : (
                  <button 
                    onClick={() => handlePay(plan)}
                    disabled={paying}
                    className={`mt-xl w-full py-md font-bold rounded-DEFAULT transition-all ${
                      plan.name === 'STARTER' 
                        ? 'bg-primary text-white hover:opacity-90 active:scale-95' 
                        : 'border border-on-surface text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {paying ? 'Memproses...' : `Pilih ${plan.name}`}
                  </button>
                )}
              </div>
            ))
          )}
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
