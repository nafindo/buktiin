-- Buat tabel Plan
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  price INTEGER NOT NULL,
  storageLimit INTEGER NOT NULL,
  orderLimit INTEGER NOT NULL,
  retentionDays INTEGER NOT NULL,
  accountLimit INTEGER NOT NULL DEFAULT 1,
  payment_link TEXT
);

-- Tambahkan kolom accountlimit & payment_link jika tabel sebelumnya sudah ada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'accountlimit') THEN
    ALTER TABLE public.plans ADD COLUMN accountlimit INTEGER NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'payment_link') THEN
    ALTER TABLE public.plans ADD COLUMN payment_link TEXT;
  END IF;
END $$;

-- Update data paket awal (agar aman jika sudah ada)
INSERT INTO public.plans (name, price, storageLimit, orderLimit, retentionDays, accountLimit, payment_link)
VALUES 
  ('FREE', 0, 5000, 10, 7, 1, NULL),
  ('BASIC', 49000, 20000, 30, 30, 1, 'https://link.dana.id/p2mlink?params=[orderId=kxnjuyxs]'),
  ('STARTER', 99000, 50000, 100, 30, 3, 'https://link.dana.id/paymentlink?params=[orderId=5lft34yy]'),
  ('PRO', 199000, 150000, 300, 30, 5, 'https://link.dana.id/paymentlink?params=[orderId=yx2xjf23]'),
  ('BUSINESS', 399000, 500000, 1000, 30, 10, 'https://link.dana.id/paymentlink?params=[orderId=pcthuuy6]'),
  ('ENTERPRISE', 0, 10000000, 10000, 30, 999999, 'https://link.dana.id/paymentlink?params=[orderId=pcthuuy6]')
ON CONFLICT (name) DO UPDATE SET 
  price = EXCLUDED.price,
  storagelimit = EXCLUDED.storagelimit,
  orderlimit = EXCLUDED.orderlimit,
  retentiondays = EXCLUDED.retentiondays,
  accountlimit = EXCLUDED.accountlimit,
  payment_link = EXCLUDED.payment_link;

-- Buat tabel Subscription
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Merujuk ke auth.users
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, PENDING_APPROVAL, REJECTED, EXPIRED
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_proof_url TEXT,
  payment_method TEXT DEFAULT 'QRIS_DANA',
  user_email TEXT,
  user_name TEXT,
  amount_paid INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan kolom baru jika tabel sudah ada sebelumnya
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'payment_proof_url') THEN
    ALTER TABLE public.subscriptions ADD COLUMN payment_proof_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'payment_method') THEN
    ALTER TABLE public.subscriptions ADD COLUMN payment_method TEXT DEFAULT 'QRIS_DANA';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'user_email') THEN
    ALTER TABLE public.subscriptions ADD COLUMN user_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'user_name') THEN
    ALTER TABLE public.subscriptions ADD COLUMN user_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'amount_paid') THEN
    ALTER TABLE public.subscriptions ADD COLUMN amount_paid INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'notes') THEN
    ALTER TABLE public.subscriptions ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'extra_storage_gb') THEN
    ALTER TABLE public.subscriptions ADD COLUMN extra_storage_gb INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'extra_accounts') THEN
    ALTER TABLE public.subscriptions ADD COLUMN extra_accounts INTEGER DEFAULT 0;
  END IF;
END $$;

-- RLS (Row Level Security) agar aman
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.plans;
DROP POLICY IF EXISTS "Users can view their own subscriptions." ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions." ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions." ON public.subscriptions;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy agar semua orang bisa melihat Plan
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.plans FOR SELECT USING (true);

-- Policy subscriptions
CREATE POLICY "Users can view their own subscriptions." 
ON public.subscriptions FOR SELECT USING (true);

CREATE POLICY "Users can insert their own subscriptions." 
ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

CREATE POLICY "Users can update their own subscriptions." 
ON public.subscriptions FOR UPDATE USING (true);

-- Buat tabel Recordings
CREATE TABLE IF NOT EXISTS public.recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resi TEXT NOT NULL,
  customer TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  items JSONB NOT NULL,
  status TEXT DEFAULT 'PROCESS',
  scan_type VARCHAR(50) DEFAULT 'PACKING',
  video_path TEXT,
  video_size BIGINT,
  upload_status TEXT DEFAULT 'PENDING',
  drive_file_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel Marketplace Integrations
CREATE TABLE IF NOT EXISTS public.marketplace_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marketplace_name TEXT NOT NULL,
  app_id TEXT,
  app_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  shop_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, marketplace_name)
);

-- Buat tabel Drive Integrations
CREATE TABLE IF NOT EXISTS public.drive_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel User Sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat tabel Sub Accounts
CREATE TABLE IF NOT EXISTS public.sub_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL UNIQUE,
  parent_id UUID NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS untuk tabel-tabel baru
DROP POLICY IF EXISTS "Users can manage their own recordings" ON public.recordings;
DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.marketplace_integrations;
DROP POLICY IF EXISTS "Users can manage their own drive" ON public.drive_integrations;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can manage their own sub accounts" ON public.sub_accounts;

ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recordings" ON public.recordings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own integrations" ON public.marketplace_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own drive" ON public.drive_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sub accounts" ON public.sub_accounts FOR ALL USING (auth.uid() = parent_id OR auth.uid() = child_id);
