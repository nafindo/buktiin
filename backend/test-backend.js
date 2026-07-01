require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const email = `test_backend_${Date.now()}@test.com`;
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

  // Try checking limits via the local backend
  try {
    const res = await fetch('http://localhost:3001/api/check-limits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authData.user.id,
        deviceId: 'TEST-DEVICE',
        forceLogin: true,
        accessToken: token
      })
    });
    const result = await res.json();
    console.log("Backend check-limits response:", result);
  } catch (err) {
    console.log("Backend error:", err);
  }
}

test();
