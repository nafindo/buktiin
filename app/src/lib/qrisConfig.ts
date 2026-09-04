import { supabase, SUPABASE_URL } from './supabase';
import { createClient } from '@supabase/supabase-js';

// Service role key for admin updates to plans table
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkcmV6cGRqaWl1Z2RtYWR0aGpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg0OTk2OSwiZXhwIjoyMDk4NDI1OTY5fQ.U_YiybgY6_PPOb8HbzOsB94ymggF_mwNNsGalBkWp1g';

export const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export const CONFIG_ROW_ID = '00000000-0000-0000-0000-000000000099';

export interface PeriodConfig {
  durationDays: number;
  label: string;
  price: number;
  paymentLink: string;
  qrImageUrl?: string;
  accountInfo?: string;
}

export interface PlanQrisConfig {
  planName: string;
  monthly: PeriodConfig;
  quarterly: PeriodConfig;
  semiAnnual: PeriodConfig;
  annual: PeriodConfig;
}

export type QrisSettingsMap = Record<string, PlanQrisConfig>;

export const DEFAULT_QRIS_SETTINGS: QrisSettingsMap = {
  BASIC: {
    planName: 'BASIC',
    monthly: {
      durationDays: 30,
      label: '1 Bulan (30 Hari)',
      price: 49000,
      paymentLink: 'https://link.dana.id/p2mlink?params=[orderId=kxnjuyxs]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    quarterly: {
      durationDays: 90,
      label: '3 Bulan (Triwulan)',
      price: 139000,
      paymentLink: 'https://link.dana.id/p2mlink?params=[orderId=kxnjuyxs]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    semiAnnual: {
      durationDays: 180,
      label: '6 Bulan (Semester)',
      price: 269000,
      paymentLink: 'https://link.dana.id/p2mlink?params=[orderId=kxnjuyxs]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    annual: {
      durationDays: 365,
      label: '1 Tahun (Tahunan)',
      price: 490000,
      paymentLink: 'https://link.dana.id/p2mlink?params=[orderId=kxnjuyxs]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    }
  },
  STARTER: {
    planName: 'STARTER',
    monthly: {
      durationDays: 30,
      label: '1 Bulan (30 Hari)',
      price: 99000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=5lft34yy]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    quarterly: {
      durationDays: 90,
      label: '3 Bulan (Triwulan)',
      price: 279000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=5lft34yy]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    semiAnnual: {
      durationDays: 180,
      label: '6 Bulan (Semester)',
      price: 539000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=5lft34yy]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    annual: {
      durationDays: 365,
      label: '1 Tahun (Tahunan)',
      price: 990000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=5lft34yy]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    }
  },
  PRO: {
    planName: 'PRO',
    monthly: {
      durationDays: 30,
      label: '1 Bulan (30 Hari)',
      price: 199000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=yx2xjf23]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    quarterly: {
      durationDays: 90,
      label: '3 Bulan (Triwulan)',
      price: 559000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=yx2xjf23]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    semiAnnual: {
      durationDays: 180,
      label: '6 Bulan (Semester)',
      price: 1079000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=yx2xjf23]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    annual: {
      durationDays: 365,
      label: '1 Tahun (Tahunan)',
      price: 1990000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=yx2xjf23]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    }
  },
  BUSINESS: {
    planName: 'BUSINESS',
    monthly: {
      durationDays: 30,
      label: '1 Bulan (30 Hari)',
      price: 399000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=pcthuuy6]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    quarterly: {
      durationDays: 90,
      label: '3 Bulan (Triwulan)',
      price: 1119000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=pcthuuy6]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    semiAnnual: {
      durationDays: 180,
      label: '6 Bulan (Semester)',
      price: 2159000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=pcthuuy6]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    },
    annual: {
      durationDays: 365,
      label: '1 Tahun (Tahunan)',
      price: 3990000,
      paymentLink: 'https://link.dana.id/paymentlink?params=[orderId=pcthuuy6]',
      accountInfo: 'DANA / QRIS - Buktiin Store'
    }
  },
  ENTERPRISE: {
    planName: 'ENTERPRISE',
    monthly: {
      durationDays: 30,
      label: '1 Bulan (Kustom)',
      price: 0,
      paymentLink: 'https://wa.me/6281232797271',
      accountInfo: 'Hubungi WhatsApp Tim Nafindo'
    },
    quarterly: {
      durationDays: 90,
      label: '3 Bulan (Kustom)',
      price: 0,
      paymentLink: 'https://wa.me/6281232797271',
      accountInfo: 'Hubungi WhatsApp Tim Nafindo'
    },
    semiAnnual: {
      durationDays: 180,
      label: '6 Bulan (Kustom)',
      price: 0,
      paymentLink: 'https://wa.me/6281232797271',
      accountInfo: 'Hubungi WhatsApp Tim Nafindo'
    },
    annual: {
      durationDays: 365,
      label: '1 Tahun (Kustom)',
      price: 0,
      paymentLink: 'https://wa.me/6281232797271',
      accountInfo: 'Hubungi WhatsApp Tim Nafindo'
    }
  }
};

/**
 * Loads current QRIS settings from Supabase, with local cache & default fallback
 */
export async function fetchQrisSettings(): Promise<QrisSettingsMap> {
  try {
    const { data } = await supabase
      .from('plans')
      .select('name')
      .eq('id', CONFIG_ROW_ID)
      .maybeSingle();

    if (data?.name && data.name.startsWith('CONFIG_QRIS:')) {
      const jsonStr = data.name.replace('CONFIG_QRIS:', '');
      const parsed = JSON.parse(jsonStr);
      localStorage.setItem('cached_qris_settings', JSON.stringify(parsed));
      return { ...DEFAULT_QRIS_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to fetch remote QRIS settings, using cache/default:', err);
  }

  try {
    const cached = localStorage.getItem('cached_qris_settings');
    if (cached) {
      return { ...DEFAULT_QRIS_SETTINGS, ...JSON.parse(cached) };
    }
  } catch (_) {}

  return DEFAULT_QRIS_SETTINGS;
}

/**
 * Saves QRIS settings to Supabase & localStorage
 */
export async function saveQrisSettings(settings: QrisSettingsMap): Promise<boolean> {
  try {
    const payload = JSON.stringify(settings);
    localStorage.setItem('cached_qris_settings', payload);

    const { error } = await adminClient
      .from('plans')
      .upsert({
        id: CONFIG_ROW_ID,
        name: 'CONFIG_QRIS:' + payload,
        price: 999999999,
        storagelimit: 0,
        orderlimit: 0,
        retentiondays: 0,
        accountlimit: 0
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to save QRIS settings to Supabase:', err);
    return false;
  }
}
