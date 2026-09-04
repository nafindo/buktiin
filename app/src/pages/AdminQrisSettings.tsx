import { useState, useEffect } from 'react';
import {
  fetchQrisSettings,
  saveQrisSettings,
  DEFAULT_QRIS_SETTINGS,
  type QrisSettingsMap,
  type PeriodConfig
} from '../lib/qrisConfig';

const PLAN_KEYS = ['BASIC', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const;
type PlanKey = typeof PLAN_KEYS[number];

const PERIOD_KEYS = ['monthly', 'quarterly', 'semiAnnual', 'annual'] as const;
type PeriodKey = typeof PERIOD_KEYS[number];

const PERIOD_LABELS: Record<PeriodKey, { title: string; defaultDays: number; icon: string }> = {
  monthly: { title: 'Bulanan (1 Bulan)', defaultDays: 30, icon: 'calendar_month' },
  quarterly: { title: 'Triwulan (3 Bulan)', defaultDays: 90, icon: 'date_range' },
  semiAnnual: { title: 'Semester (6 Bulan)', defaultDays: 180, icon: 'calendar_view_week' },
  annual: { title: 'Tahunan (12 Bulan / 1 Tahun)', defaultDays: 365, icon: 'event_available' }
};

export default function AdminQrisSettings() {
  const [settings, setSettings] = useState<QrisSettingsMap>(DEFAULT_QRIS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('BASIC');

  useEffect(() => {
    fetchQrisSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handlePeriodChange = (
    planKey: PlanKey,
    periodKey: PeriodKey,
    field: keyof PeriodConfig,
    value: any
  ) => {
    setSettings((prev) => {
      const planConfig = prev[planKey] || DEFAULT_QRIS_SETTINGS[planKey];
      const periodConfig = planConfig[periodKey];

      return {
        ...prev,
        [planKey]: {
          ...planConfig,
          [periodKey]: {
            ...periodConfig,
            [field]: value
          }
        }
      };
    });
  };

  const handleImageUpload = (
    planKey: PlanKey,
    periodKey: PeriodKey,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar QRIS (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        handlePeriodChange(planKey, periodKey, 'qrImageUrl', base64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    const ok = await saveQrisSettings(settings);
    setSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      alert('Gagal menyimpan pengaturan ke database server. Mohon periksa koneksi internet.');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan semua tautan QRIS ke pengaturan bawaan awal?')) {
      setSettings(DEFAULT_QRIS_SETTINGS);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        <p className="font-bold text-xs text-on-surface-variant">Memuat Pengaturan QRIS...</p>
      </div>
    );
  }

  const currentPlanConfig = settings[selectedPlan] || DEFAULT_QRIS_SETTINGS[selectedPlan];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-ui-divider p-4 sm:p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">qr_code_2</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-on-surface leading-tight">
                Pengaturan Link QRIS & Pembayaran
              </h1>
              <p className="text-xs text-on-surface-variant">
                Atur link QRIS, DANA, dan harga untuk setiap paket langganan (Bulanan, Triwulan, 6 Bulan, Tahunan).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors border border-ui-divider"
            title="Kembalikan ke pengaturan bawaan"
          >
            Reset Default
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow shadow-primary/20 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${saving ? 'animate-spin' : ''}`}>
              {saving ? 'sync' : 'save'}
            </span>
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3.5 bg-green-500/10 border-2 border-green-500/40 rounded-2xl flex items-center justify-between text-xs font-bold text-green-800 dark:text-green-300 animate-[fade-in_0.2s_ease-out]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-green-600">check_circle</span>
            <span>Pengaturan link QRIS dan durasi paket berhasil disimpan ke Cloud Server!</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Plan Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ui-divider pb-2">
        {PLAN_KEYS.map((planKey) => (
          <button
            key={planKey}
            type="button"
            onClick={() => setSelectedPlan(planKey)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              selectedPlan === planKey
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'bg-surface border border-ui-divider text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span>{planKey} PLAN</span>
            {planKey === 'ENTERPRISE' && (
              <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full uppercase">
                Kustom
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Plan Details Description Card */}
      <div className="bg-surface border border-ui-divider rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-primary uppercase tracking-wider text-[10px]">Paket Terpilih</span>
          <h2 className="text-base font-extrabold text-on-surface">Paket {selectedPlan}</h2>
          <p className="text-on-surface-variant mt-0.5 text-[11px]">
            {selectedPlan === 'ENTERPRISE'
              ? 'Paket kustom enterprise: User diarahkan chat langsung ke WhatsApp Admin.'
              : `Atur link QRIS / link pembayaran DANA untuk 4 periode durasi paket ${selectedPlan}.`}
          </p>
        </div>
        <div className="bg-surface-container px-3 py-1.5 rounded-xl text-[11px] font-mono text-on-surface-variant">
          Otomatis sinkron ke halaman Checkout Pengguna
        </div>
      </div>

      {/* 4 Periods Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERIOD_KEYS.map((periodKey) => {
          const meta = PERIOD_LABELS[periodKey];
          const periodData = currentPlanConfig[periodKey];

          return (
            <div
              key={periodKey}
              className="bg-surface border border-ui-divider rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-primary/50 transition-colors space-y-4"
            >
              <div className="space-y-3">
                {/* Header Period */}
                <div className="flex items-center justify-between border-b border-ui-divider pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-lg">{meta.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface">{meta.title}</h3>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        Durasi Aktif: +{periodData.durationDays || meta.defaultDays} Hari
                      </span>
                    </div>
                  </div>

                  <span className="bg-primary/10 text-primary text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {periodKey.toUpperCase()}
                  </span>
                </div>

                {/* Input Harga */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface flex justify-between">
                    <span>Nominal Harga (Rp)</span>
                    <span className="text-primary font-mono">
                      Rp {(periodData.price || 0).toLocaleString('id-ID')}
                    </span>
                  </label>
                  <input
                    type="number"
                    value={periodData.price ?? 0}
                    onChange={(e) =>
                      handlePeriodChange(selectedPlan, periodKey, 'price', Number(e.target.value) || 0)
                    }
                    className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs font-mono font-bold focus:border-primary outline-none"
                    placeholder="Contoh: 99000"
                  />
                </div>

                {/* Input Link Pembayaran / QRIS */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface">
                    Link QRIS / Pembayaran DANA / URL
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={periodData.paymentLink || ''}
                      onChange={(e) =>
                        handlePeriodChange(selectedPlan, periodKey, 'paymentLink', e.target.value)
                      }
                      className="flex-1 bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs font-mono focus:border-primary outline-none"
                      placeholder="https://link.dana.id/... atau wa.me/..."
                    />
                    {periodData.paymentLink && (
                      <a
                        href={periodData.paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-surface-container hover:bg-surface-variant rounded-xl text-primary border border-ui-divider flex items-center justify-center"
                        title="Tes Buka Link"
                      >
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Info Rekening / Catatan Pembayaran */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface">
                    Info Rekening / Catatan Merchant
                  </label>
                  <input
                    type="text"
                    value={periodData.accountInfo || ''}
                    onChange={(e) =>
                      handlePeriodChange(selectedPlan, periodKey, 'accountInfo', e.target.value)
                    }
                    className="w-full bg-surface-container border border-ui-divider rounded-xl px-3 py-2 text-xs focus:border-primary outline-none"
                    placeholder="Contoh: DANA 081232797271 a.n. Nafindo"
                  />
                </div>

                {/* Upload Gambar QRIS (Opsional) */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-on-surface flex items-center justify-between">
                    <span>Gambar Barcode QRIS</span>
                    {periodData.qrImageUrl && (
                      <button
                        type="button"
                        onClick={() => handlePeriodChange(selectedPlan, periodKey, 'qrImageUrl', '')}
                        className="text-[10px] text-red-600 hover:underline font-bold"
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </label>

                  <div className="flex items-center gap-3">
                    {periodData.qrImageUrl ? (
                      <img
                        src={periodData.qrImageUrl}
                        alt="QRIS Preview"
                        className="w-16 h-16 rounded-xl border border-ui-divider object-contain bg-white p-1 shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-ui-divider flex items-center justify-center text-on-surface-variant/40">
                        <span className="material-symbols-outlined text-2xl">qr_code</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-variant border border-ui-divider rounded-xl text-xs font-bold text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-base">upload</span>
                        <span>Unggah Gambar QRIS</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(selectedPlan, periodKey, e)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-on-surface-variant">
                        File gambar barcode QRIS langsung tampil saat user checkout.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Card Footer */}
              <div className="pt-3 border-t border-ui-divider flex items-center justify-between text-[11px]">
                <span className="text-on-surface-variant">Masa Aktif Paket:</span>
                <span className="font-bold text-primary font-mono">
                  +{periodData.durationDays || meta.defaultDays} Hari
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button Floating / Bottom */}
      <div className="flex justify-end pt-4 border-t border-ui-divider">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-primary/30 disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-lg ${saving ? 'animate-spin' : ''}`}>
            {saving ? 'sync' : 'save'}
          </span>
          <span>{saving ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan QRIS'}</span>
        </button>
      </div>
    </div>
  );
}
