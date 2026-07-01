const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkPro() {
  console.log('Fetching PRO subscriptions...');
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  data.forEach(sub => {
    console.log(`User: ${sub.user_id} | Plan: ${sub.plans?.name} | Date: ${sub.created_at}`);
  });
}
checkPro();
