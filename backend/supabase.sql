-- Buat tabel Plan
CREATE TABLE public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  price INTEGER NOT NULL,
  storageLimit INTEGER NOT NULL,
  orderLimit INTEGER NOT NULL,
  retentionDays INTEGER NOT NULL
);

-- Insert data paket awal
INSERT INTO public.plans (name, price, storageLimit, orderLimit, retentionDays)
VALUES 
  ('FREE', 0, 1000, 50, 3),
  ('BASIC', 49000, 5000, 500, 7),
  ('STARTER', 99000, 15000, 2500, 14),
  ('PRO', 199000, 50000, 10000, 30);

-- Buat tabel Subscription
CREATE TABLE public.subscriptions (
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
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy agar semua orang bisa melihat Plan
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.plans FOR SELECT USING (true);

-- Policy agar user hanya bisa melihat subscription miliknya sendiri
CREATE POLICY "Users can view their own subscriptions." 
ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
