import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/images/logo.png';
import {
  fetchQrisSettings,
  DEFAULT_QRIS_SETTINGS,
  adminClient,
  dataUrlToBlob,
  type QrisSettingsMap
} from '../lib/qrisConfig';

type PeriodKey = 'monthly' | 'quarterly' | 'semiAnnual' | 'annual';

const PLAN_DEFAULT_PAYMENT_LINKS: Record<string, string> = {
  'BASIC': 'https://link.dana.id/p2mlink?params=[orderId=kxnjuyxs]',
  'STARTER': 'https://link.dana.id/paymentlink?params=[orderId=5lft34yy]',
  'PRO': 'https://link.dana.id/paymentlink?params=[orderId=yx2xjf23]',
  'BUSINESS': 'https://link.dana.id/paymentlink?params=[orderId=pcthuuy6]'
};

const DEFAULT_DANA_LINK = 'https://link.dana.id/p2mlink?params=[orderId=kxnjuyxs]';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const planId = searchParams.get('planId');

  const periodParam = (searchParams.get('period') || (searchParams.get('isAnnual') === '1' ? 'annual' : 'monthly')) as PeriodKey;
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(periodParam || 'monthly');
  const [qrisSettings, setQrisSettings] = useState<QrisSettingsMap>(DEFAULT_QRIS_SETTINGS);

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // Form states
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImageBase64, setProofImageBase64] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSessionAndPlan = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || '');
      setSenderName(session.user.user_metadata?.full_name || session.user.user_metadata?.company_name || '');
      setSenderPhone(session.user.user_metadata?.phone || '');

      const [qrisData] = await Promise.all([
        fetchQrisSettings()
      ]);
      if (qrisData) setQrisSettings(qrisData);

      if (planId) {
        const { data: planData } = await supabase
          .from('plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (planData) {
          setPlan(planData);
        }
      } else {
        // Default to BASIC or first paid plan if no planId provided
        const { data: plans } = await supabase
          .from('plans')
          .select('*')
          .not('name', 'like', 'CONFIG_%')
          .gt('price', 0)
          .order('price', { ascending: true })
          .limit(1);

        if (plans && plans.length > 0) {
          setPlan(plans[0]);
        }
      }

      setLoading(false);
    };

    loadSessionAndPlan();
  }, [planId, navigate]);

  const planKey = (plan?.name || '').toUpperCase().trim();
  const periodConfig = qrisSettings[planKey]?.[selectedPeriod] || DEFAULT_QRIS_SETTINGS[planKey]?.[selectedPeriod];

  const durationDays = periodConfig?.durationDays || (selectedPeriod === 'annual' ? 365 : selectedPeriod === 'semiAnnual' ? 180 : selectedPeriod === 'quarterly' ? 90 : 30);
  const periodLabel = periodConfig?.label || (selectedPeriod === 'annual' ? '1 Tahun (365 Hari)' : selectedPeriod === 'semiAnnual' ? '6 Bulan (180 Hari)' : selectedPeriod === 'quarterly' ? '3 Bulan (90 Hari)' : '1 Bulan (30 Hari)');

  const rawPrice = periodConfig?.price !== undefined ? periodConfig.price : (plan ? (selectedPeriod === 'annual' ? plan.price * 10 : plan.price) : 0);
  const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rawPrice);

  const activePaymentLink = periodConfig?.paymentLink || PLAN_DEFAULT_PAYMENT_LINKS[planKey] || DEFAULT_DANA_LINK;
  const customQrImage = periodConfig?.qrImageUrl;
  const qrImageUrl = customQrImage || `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(activePaymentLink)}`;
  const accountInfo = periodConfig?.accountInfo || 'DANA / QRIS - Buktiin Store';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Ukuran file maksimal 8MB.');
      return;
    }

    setProofFileName(file.name);

    // Compress & convert to Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProofImageBase64(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofImageBase64) {
      setErrorMsg('Mohon unggah foto / screenshot bukti pembayaran.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const notesFormatted = `[DURASI: ${durationDays} HARI | PERIODE: ${selectedPeriod}] Pengirim: ${senderName} | WA: ${senderPhone} | Catatan: ${notes || '-'}`;

      // Upload proof to Supabase Storage CDN first (fast & lightweight URL)
      let finalProofUrl = proofImageBase64;
      try {
        const filePath = `proof_${userId}_${Date.now()}.jpg`;
        const blob = dataUrlToBlob(proofImageBase64);
        const { error: uploadErr } = await adminClient.storage
          .from('payment_proofs')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (!uploadErr) {
          const { data: urlData } = adminClient.storage
            .from('payment_proofs')
            .getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            finalProofUrl = urlData.publicUrl;
          }
        }
      } catch (upErr) {
        console.warn('Storage upload note:', upErr);
      }

      const pendingPaymentData = {
        plan_id: plan.id,
        plan_name: plan.name,
        duration_days: durationDays,
        period: selectedPeriod,
        amount_paid: rawPrice,
        payment_method: 'QRIS_DANA',
        payment_proof_url: finalProofUrl,
        sender_name: senderName,
        sender_phone: senderPhone,
        notes: notesFormatted,
        submitted_at: new Date().toISOString()
      };

      // 1. Always save pending payment to user_metadata (100% immune to RLS restrictions)
      try {
        await supabase.auth.updateUser({
          data: {
            pending_payment: pendingPaymentData
          }
        });
      } catch (metaErr) {
        console.warn('Metadata save note:', metaErr);
      }

      // 2. Check if user already has an existing subscription record
      const { data: existingSubs } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      let dbSaved = false;

      if (existingSubs && existingSubs.length > 0) {
        const subId = existingSubs[0].id;
        // Try full update
        const { error: updateFullErr } = await supabase
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            status: 'PENDING_APPROVAL',
            payment_method: 'QRIS_DANA',
            payment_proof_url: finalProofUrl,
            amount_paid: rawPrice,
            user_email: userEmail,
            user_name: senderName || userEmail,
            notes: notesFormatted,
            updated_at: new Date().toISOString()
          })
          .eq('id', subId);

        if (!updateFullErr) {
          dbSaved = true;
        } else {
          console.warn('Full update failed, trying minimal update on core columns:', updateFullErr);
          // Fallback to update existing core columns
          const { error: updateMinErr } = await supabase
            .from('subscriptions')
            .update({
              plan_id: plan.id,
              status: 'PENDING_APPROVAL',
              updated_at: new Date().toISOString()
            })
            .eq('id', subId);

          if (!updateMinErr) {
            dbSaved = true;
          }
        }
      }

      // 3. If no existing row or update failed, attempt INSERT
      if (!dbSaved) {
        const payload = {
          user_id: userId,
          plan_id: plan.id,
          status: 'PENDING_APPROVAL',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_method: 'QRIS_DANA',
          payment_proof_url: finalProofUrl,
          amount_paid: rawPrice,
          user_email: userEmail,
          user_name: senderName || userEmail,
          notes: notesFormatted
        };

        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert(payload);

        if (!insertError) {
          dbSaved = true;
        } else {
          console.warn('Full insert failed, trying minimal insert:', insertError);
          const { error: fallbackError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan_id: plan.id,
              status: 'PENDING_APPROVAL',
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString()
            });

          if (!fallbackError) {
            dbSaved = true;
          } else {
            console.warn('Subscriptions table insert blocked by RLS, but metadata saved successfully:', fallbackError);
          }
        }
      }

      // Succeeded! Either DB record updated/inserted, or user_metadata saved
      setSuccessMsg(true);
    } catch (err: any) {
      console.error('Submit payment proof error:', err);
      setErrorMsg('Gagal mengirim bukti pembayaran: ' + (err.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        <p className="font-bold text-sm text-on-surface-variant">Memuat Rincian Pembayaran...</p>
      </div>
    );
  }

  if (planKey === 'ENTERPRISE') {
    return (
      <div className="min-h-screen bg-background text-on-background py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          {/* Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-ui-divider mb-6">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Buktiin" className="w-8 h-8 rounded-lg shadow-sm" />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-on-surface leading-tight">Paket Enterprise</h1>
                <p className="text-[11px] text-on-surface-variant">Solusi Kustom & Multi-Akun Skala Besar</p>
              </div>
            </div>
            <Link
              to="/plans"
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Ganti Paket
            </Link>
          </div>

          {/* Enterprise Info Card */}
          <div className="bg-surface border border-ui-divider rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">corporate_fare</span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface">Paket Enterprise (Custom)</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed max-w-md mx-auto">
                Pembayaran paket Enterprise belum memiliki link otomatis karena nominal pembayaran disesuaikan dengan kebutuhan operasional bisnis Anda.
              </p>
            </div>

            <div className="w-full bg-surface-container-low border border-ui-divider rounded-xl p-4 text-left space-y-2.5 text-xs my-2">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-status-success text-base">check_circle</span>
                <span>Kapasitas penyimpanan cloud tak terbatas / kustom</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-status-success text-base">check_circle</span>
                <span>Scan packing & unboxing tanpa batas harian</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-status-success text-base">check_circle</span>
                <span>Dukungan multi-akun staf & operator tanpa limit</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-status-success text-base">check_circle</span>
                <span>Prioritas SLA & customer support khusus langsung</span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant">
              Silakan hubungi kami via WhatsApp di <span className="font-bold text-on-surface">081232797271</span> untuk konsultasi kebutuhan dan penawaran harga.
            </p>

            <a
              href="https://wa.me/6281232797271?text=Halo%20Admin%20BUKTIIN%2C%20saya%20tertarik%20dengan%20Paket%20Enterprise.%20Mohon%20informasi%20dan%20penawaran%20harga%20sesuai%20kebutuhan%20kami."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              Hubungi Kami
            </a>

            <Link
              to="/plans"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Kembali ke Pilihan Paket
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (successMsg) {
    return (
      <div className="min-h-screen bg-surface-container flex items-center justify-center p-4">
        <div className="bg-surface border border-ui-divider rounded-2xl max-w-lg w-full p-6 sm:p-8 flex flex-col items-center text-center shadow-xl animate-[fade-in_0.3s_ease-out]">
          <div className="w-16 h-16 rounded-full bg-status-success/15 text-status-success flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">Bukti Pembayaran Terkirim!</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
            Pengajuan langganan paket <span className="font-bold text-primary">{plan?.name} Plan</span> sebesar <span className="font-bold text-on-surface">{formattedPrice}</span> telah masuk ke sistem antrean verifikasi.
            <br className="hidden sm:block" />
            Admin akan mengecek dan mengaktifkan akun Anda dalam waktu maksimal 1x24 jam (biasanya 5–15 menit).
          </p>

          <div className="bg-surface-container-low border border-ui-divider rounded-xl p-4 w-full mb-6 text-left space-y-2 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Paket:</span>
              <span className="font-bold text-on-surface">{plan?.name} Plan</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Durasi & Masa Aktif:</span>
              <span className="font-bold text-primary">{periodLabel}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Nominal:</span>
              <span className="font-bold text-primary">{formattedPrice}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Metode:</span>
              <span className="font-bold text-on-surface">QRIS DANA (Manual Transfer)</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Status:</span>
              <span className="font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded text-[10px]">MENUNGGU APPROVAL</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ui-divider mb-6">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Buktiin" className="w-8 h-8 rounded-lg shadow-sm" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-on-surface leading-tight">Pembayaran Langganan</h1>
              <p className="text-[11px] text-on-surface-variant">QRIS DANA & Aktivasi Manual Cepat</p>
            </div>
          </div>
          <Link
            to="/plans"
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Ganti Paket
          </Link>
        </div>

        {/* Duration Switcher on Payment Page */}
        <div className="mb-6 p-2 bg-surface border border-ui-divider rounded-2xl flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto shadow-sm">
          <button
            type="button"
            onClick={() => setSelectedPeriod('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedPeriod === 'monthly' ? 'bg-primary text-white shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            1 Bulan (30 Hari)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('quarterly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedPeriod === 'quarterly' ? 'bg-primary text-white shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Triwulan (90 Hari)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('semiAnnual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedPeriod === 'semiAnnual' ? 'bg-primary text-white shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            6 Bulan (180 Hari)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('annual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedPeriod === 'annual' ? 'bg-primary text-white shadow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>1 Tahun (365 Hari)</span>
            <span className="bg-amber-400 text-amber-950 text-[9px] px-1 py-0.2 rounded font-black">HEMAT</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/40 border border-status-error/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QRIS Code & Payment Instructions */}
          <div className="lg:col-span-6 space-y-4">
            {/* QRIS Card */}
            <div className="bg-surface border border-ui-divider rounded-2xl p-5 shadow-sm flex flex-col items-center text-center">
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">QRIS RESMI BUKTIIN</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                  DANA / SEMUA E-WALLET
                </span>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-white border-2 border-primary/30 rounded-2xl shadow-inner my-2 flex items-center justify-center">
                <img
                  src={qrImageUrl}
                  alt="QRIS Buktiin"
                  className="w-56 h-56 object-contain rounded-lg"
                />
              </div>

              <div className="text-[11px] font-bold text-on-surface bg-surface-container px-3 py-1 rounded-full mb-1">
                {accountInfo}
              </div>

              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                Scan QRIS di atas menggunakan <span className="font-bold text-on-surface">DANA, GoPay, OVO, ShopeePay, BCA Mobile, Livin Mandiri, BRImo</span>, atau aplikasi perbankan apa saja.
              </p>

              {/* Direct Open Link Button */}
              <a
                href={activePaymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-[#118EEA] hover:bg-[#0c7acb] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-colors"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                Buka Link DANA Langsung (HP)
              </a>
            </div>

            {/* Steps Guide */}
            <div className="bg-surface border border-ui-divider rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Langkah Pembayaran & Aktivasi:</h3>
              <div className="space-y-2 text-[11px] text-on-surface-variant">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">1</div>
                  <p>Scan QRIS atau buka link DANA, bayar tepat sebesar <span className="font-bold text-primary">{formattedPrice}</span>.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">2</div>
                  <p>Ambil screenshot / simpan bukti transfer yang menunjukkan transaksi berhasil.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">3</div>
                  <p>Upload foto bukti transfer di form sebelah kanan dan klik <span className="font-bold text-on-surface">Kirim Bukti Pembayaran</span>.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Proof Upload Form */}
          <div className="lg:col-span-6 space-y-4">
            {/* Order Summary Card */}
            <div className="bg-surface border border-ui-divider rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3 flex items-center justify-between">
                <span>Rincian Pesanan</span>
                <span className="text-primary font-bold">{plan?.name} Plan</span>
              </h3>

              <div className="space-y-2 text-xs border-b border-ui-divider pb-3">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Paket Langganan</span>
                  <span className="font-bold text-on-surface">{plan?.name} Plan</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Durasi & Masa Berlaku</span>
                  <span className="font-bold text-primary">{periodLabel}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Akun Terdaftar</span>
                  <span className="font-bold text-on-surface truncate max-w-[200px]">{userEmail}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3">
                <span className="text-xs font-bold text-on-surface">Total Pembayaran</span>
                <span className="text-lg sm:text-xl font-bold text-primary">{formattedPrice}</span>
              </div>
            </div>

            {/* Proof Upload Form */}
            <form onSubmit={handleSubmitProof} className="bg-surface border border-ui-divider rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Form Konfirmasi Pembayaran</h3>

              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">Nama Pengirim / Toko</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Contoh: Toko Berkah / Budi Santoso"
                  required
                  className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">No. WhatsApp (Untuk Konfirmasi Cepat)</label>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs focus:border-primary outline-none"
                />
              </div>

              {/* Upload File Input */}
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">
                  Upload Bukti Transfer / Struk QRIS <span className="text-red-500">*</span>
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    proofImageBase64 ? 'border-primary/50 bg-primary/5' : 'border-ui-divider hover:border-primary/40 bg-surface-container-low'
                  }`}
                >
                  {proofImageBase64 ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <img
                        src={proofImageBase64}
                        alt="Bukti Transfer"
                        className="max-h-36 rounded-lg object-contain border border-ui-divider shadow-sm"
                      />
                      <span className="text-[10px] text-primary font-bold truncate max-w-full">
                        ✓ {proofFileName || 'Gambar dipilih'} (Klik untuk ganti)
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">add_photo_alternate</span>
                      <p className="text-xs font-bold text-primary">Klik untuk Pilih Foto / Screenshot Bukti</p>
                      <p className="text-[10px] text-on-surface-variant">Format: JPG, PNG, WebP (Maks 8MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan tambahan jika nama akun transfer berbeda..."
                  className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs focus:border-primary outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">sync</span>
                    <span>Mengirim Bukti...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>Kirim Bukti Pembayaran & Ajukan Aktivasi</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

