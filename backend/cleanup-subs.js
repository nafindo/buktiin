const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function cleanup() {
  console.log('Fetching active subscriptions...');
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  const seenUsers = new Set();
  const toDelete = [];

  subs.forEach(sub => {
    if (seenUsers.has(sub.user_id)) {
      toDelete.push(sub.id);
    } else {
      seenUsers.add(sub.user_id);
    }
  });

  if (toDelete.length > 0) {
    console.log(`Found ${toDelete.length} duplicate active subscriptions. Deleting them...`);
    const { error: delError } = await supabase
      .from('subscriptions')
      .delete()
      .in('id', toDelete);
    
    if (delError) {
      console.error('Error deleting:', delError);
    } else {
      console.log('Duplicates deleted successfully! Each user now has exactly 1 active subscription.');
    }
  } else {
    console.log('No duplicates found. Database is clean!');
  }
}

cleanup();
