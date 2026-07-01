import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    snap: any;
  }
}

export default function SelectPlan() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUserId(session.user.id);
      
      const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
      if (data) setPlans(data.filter(p => p.name !== 'FREE'));
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
    try {
      const res = await fetch('http://localhost:3001/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          price: isAnnual ? plan.price * 10 : plan.price,
          name: plan.name,
          userId: userId
        })
      });
      const data = await res.json();
      
      if (data.token) {
        window.snap.pay(data.token, {
          onSuccess: async (result: any) => {
            await fetch('http://localhost:3001/api/pay/activate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, planId: plan.id, token: result.transaction_id })
            });
            window.location.href = '/#/dashboard';
          },
          onPending: () => {
            alert('Menunggu pembayaran.');
            setPaying(false);
          },
          onError: () => {
            alert('Pembayaran gagal.');
            setPaying(false);
          },
          onClose: () => {
            setPaying(false);
          }
        });
      } else {
        alert('Gagal mendapatkan token pembayaran.');
        setPaying(false);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi.');
      setPaying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* TopNavBar is handled by layout if applicable, or we just render the content below */}
      
      <main className="flex-grow container mx-auto px-lg py-xl max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-xl">
          <h1 className="font-headline-lg text-headline-lg mb-sm">Upgrade Your Evidence System</h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto mb-md">
            Scale your packing station security with automated video recording and cloud storage designed for modern e-commerce teams.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-md mt-md">
            <span className={`font-label-caps text-label-caps ${!isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`} id="monthly-label">Monthly</span>
            <button 
              className="relative w-14 h-7 bg-surface-container-highest rounded-full p-1 focus:outline-none transition-colors" 
              onClick={toggleBilling}
            >
              <div className={`w-5 h-5 bg-primary rounded-full transition-transform transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
            <span className={`font-label-caps text-label-caps ${isAnnual ? 'text-on-surface' : 'text-on-surface-variant'}`} id="annual-label">
              Annual <span className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full ml-1">SAVE 17%</span>
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md items-stretch mt-xl">
          {loading ? (
            <div className="col-span-3 text-center py-xl text-on-surface-variant">Memuat daftar paket...</div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className={`pricing-card flex flex-col bg-surface border ${plan.name === 'STARTER' ? 'border-2 border-primary shadow-lg' : 'border-ui-divider'} p-md rounded-xl relative overflow-hidden hover:-translate-y-1 transition-transform duration-200`}>
                {plan.name === 'STARTER' && (
                  <div className="absolute top-0 right-0">
                    <span className="bg-primary text-white font-label-caps text-[10px] px-3 py-1 rounded-tr-lg rounded-bl-lg">RECOMMENDED</span>
                  </div>
                )}
                <div className="mb-md">
                  <h3 className={`font-label-caps text-label-caps ${plan.name === 'STARTER' ? 'text-primary mt-2' : 'text-on-surface-variant'} mb-xs`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-headline-md text-headline-md ${plan.name === 'STARTER' ? 'text-on-surface' : ''}`}>Rp</span>
                    <span className="font-headline-lg text-headline-lg transition-transform duration-200">
                      {(isAnnual ? plan.price * 10 : plan.price).toLocaleString('id-ID')}
                    </span>
                    <span className="text-on-surface-variant font-code-sm text-code-sm">/{isAnnual ? 'yr' : 'mo'}</span>
                  </div>
                </div>
                <div className="flex-grow space-y-md border-t border-ui-divider pt-md">
                  <ul className="space-y-sm">
                    <li className="flex items-center gap-2 font-body-md text-[14px]">
                      <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                      <span>{plan.storageLimit / 1000}GB Storage</span>
                    </li>
                    <li className="flex items-center gap-2 font-body-md text-[14px]">
                      <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                      <span>{plan.orderLimit} Orders/day</span>
                    </li>
                    <li className="flex items-center gap-2 font-body-md text-[14px]">
                      <span className="material-symbols-outlined text-status-success text-[18px]">check_circle</span>
                      <span>{plan.retentionDays} Days Retention</span>
                    </li>
                  </ul>
                </div>
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
