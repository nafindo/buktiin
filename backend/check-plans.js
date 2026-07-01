const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkPlans() {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Plans schema:', data[0]);
}
checkPlans();
