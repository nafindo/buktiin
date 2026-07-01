import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ddrezpdjiiugdmadthjb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TacROJFIPEz3m1w4-UNCMA_wuQqUaDo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'tester@buktiin.com';
  const password = 'Password123!';
  
  console.log(`Mencoba membuat akun uji coba: ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  let userId = '';

  if (authError) {
    console.log('Akun mungkin sudah ada, mencoba login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (signInError) {
        console.error('Gagal login:', signInError.message);
        return;
    }
    userId = signInData.user.id;
    console.log('Berhasil login, User ID:', userId);
  } else {
    userId = authData.user!.id;
    console.log('Berhasil mendaftar, User ID:', userId);
  }

  // Tambahkan langganan 7 hari
  console.log('Mencari plan STARTER...');
  const { data: plan, error: planError } = await supabase.from('plans').select('*').eq('name', 'STARTER').single();
  
  if (planError || !plan) {
    console.error('Gagal menemukan plan STARTER:', planError?.message);
    return;
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7); // 7 hari dari sekarang

  console.log('Menambahkan status langganan...');
  const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      plan_id: plan.id,
      status: 'ACTIVE',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
  });

  if (subError) {
      console.error('❌ Gagal mengaktifkan langganan (Apakah RLS Supabase aktif?):', subError.message);
  } else {
      console.log('✅ SUKSES! Akun siap digunakan untuk uji coba.');
      console.log('=============================');
      console.log('Email    :', email);
      console.log('Password :', password);
      console.log('Berlaku s/d:', endDate.toLocaleString());
      console.log('=============================');
  }
}

main();
