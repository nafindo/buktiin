import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: users } = await supabase.auth.signInWithPassword({
    email: 'tester@buktiin.com',
    password: 'Password123!'
  });
  
  if (!users.user) {
    console.log("Failed to login test user");
    return;
  }
  
  console.log("User ID:", users.user.id);
  
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', users.user.id);
    
  console.log("Subscriptions:", JSON.stringify(sub, null, 2));
}

main();
