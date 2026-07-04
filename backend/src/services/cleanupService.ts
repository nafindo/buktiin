import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Triggered by checkLimits on user login
export const triggerCleanupForUser = async (userId: string, accessToken: string, retentionDays: number) => {
  console.log(`[CleanupService] Running cleanup for user ${userId}...`);
  
  const client = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });

  try {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    const { data: expiredRecordings, error } = await client
      .from('recordings')
      .select('id, video_path')
      .eq('user_id', userId)
      .lt('created_at', retentionDate.toISOString())
      .neq('status', 'DELETED');

    if (error) throw error;
    if (!expiredRecordings || expiredRecordings.length === 0) return;

    for (const recording of expiredRecordings) {
      try {
        // Delete local file if it somehow still exists in temp
        if (recording.video_path && fs.existsSync(recording.video_path)) {
          fs.unlinkSync(recording.video_path);
        }

        // Mark as deleted in DB
        await client.from('recordings').update({ status: 'DELETED' }).eq('id', recording.id);
        
      } catch (err) {
        console.error(`[CleanupService] Failed to clean up recording ${recording.id}:`, err);
      }
    }
    
    console.log(`[CleanupService] Cleanup check complete for user ${userId}. Cleaned ${expiredRecordings.length} records.`);
  } catch (error) {
    console.error('[CleanupService] Error running cleanup:', error);
  }
};
