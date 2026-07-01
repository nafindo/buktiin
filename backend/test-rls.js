require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  // 1. Sign up a fake user
  const email = `test_${Date.now()}@test.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });
  
  if (authError) {
    console.log("Signup error:", authError);
    return;
  }
  
  console.log("User signed up:", authData.user.id);
  const token = authData.session.access_token;

  // 2. Insert a subscription (this might fail if RLS prevents inserts from anon, but let's try)
  // Wait, if RLS prevents insert, we can't test. But let's assume we can query.
  
  // 3. Test querying with the token using the global header approach
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await client.from('subscriptions').select('status, end_date, plans (*)');
  console.log("Query result with header:", JSON.stringify({ data, error }, null, 2));
}

test();
