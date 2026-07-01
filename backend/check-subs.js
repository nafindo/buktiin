const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubs() {
  console.log('Fetching subscriptions from database...');
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(name)');
    
  if (error) {
    console.error('Error fetching subscriptions:', error);
    return;
  }
  
  console.log(`Found ${data.length} subscriptions.`);
  data.forEach(sub => {
    console.log(`User ID: ${sub.user_id} | Plan: ${sub.plans?.name} | Status: ${sub.status} | End: ${sub.end_date}`);
  });
}

checkSubs();
