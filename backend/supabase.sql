-- Buat tabel Plan
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  price INTEGER NOT NULL,
  storageLimit INTEGER NOT NULL,
  orderLimit INTEGER NOT NULL,
  retentionDays INTEGER NOT NULL,
  accountLimit INTEGER NOT NULL DEFAULT 1
);

-- Tambahkan kolom accountlimit jika tabel sebelumnya sudah ada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'accountlimit') THEN
    ALTER TABLE public.plans ADD COLUMN accountlimit INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Update data paket awal (agar aman jika sudah ada)
INSERT INTO public.plans (name, price, storageLimit, orderLimit, retentionDays, accountLimit)
VALUES 
  ('FREE', 0, 5000, 10, 7, 1),
  ('BASIC', 49000, 20000, 30, 30, 1),
  ('STARTER', 99000, 50000, 100, 30, 3),
  ('PRO', 199000, 150000, 300, 30, 5),
  ('BUSINESS', 399000, 500000, 1000, 30, 10),
  ('ENTERPRISE', 0, 10000000, 10000, 30, 999999)
ON CONFLICT (name) DO UPDATE SET 
  price = EXCLUDED.price,
  storagelimit = EXCLUDED.storagelimit,
  orderlimit = EXCLUDED.orderlimit,
  retentiondays = EXCLUDED.retentiondays,
  accountlimit = EXCLUDED.accountlimit;

-- Buat tabel Subscription
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Merujuk ke auth.users
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) agar aman
-- Kita hapus policy dulu jika sudah ada agar tidak error "policy already exists"
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.plans;
DROP POLICY IF EXISTS "Users can view their own subscriptions." ON public.subscriptions;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy agar semua orang bisa melihat Plan
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.plans FOR SELECT USING (true);

-- Policy agar user hanya bisa melihat subscription miliknya sendiri
CREATE POLICY "Users can view their own subscriptions." 
ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

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
