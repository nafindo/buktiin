import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export const migrateUserServer = async (req: Request, res: Response) => {
  try {
    const { userId, targetNodeId, pinCode } = req.body;
    if (pinCode !== '123456') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }
    
    const client = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
    
    // Fetch target folder
    const { data: targetNode, error: targetError } = await client
      .from('storage_nodes')
      .select('folder_id')
      .eq('id', targetNodeId)
      .single();
      
    if (targetError || !targetNode) {
      return res.status(400).json({ success: false, message: 'Target node not found' });
    }
    const newFolderId = targetNode.folder_id;

    // Fetch user recordings
    const { data: recordings, error: recError } = await client
      .from('recordings')
      .select('id, drive_file_id')
      .eq('user_id', userId)
      .not('drive_file_id', 'is', null);

    if (recError) throw recError;

    // Auth Drive API
    const keyPath = path.join(__dirname, '../../service-account.json');
    if (fs.existsSync(keyPath)) {
      const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      const drive = google.drive({ version: 'v3', auth });

      let movedCount = 0;
      for (const rec of recordings || []) {
        if (!rec.drive_file_id) continue;
        try {
          const file = await drive.files.get({
            fileId: rec.drive_file_id,
            fields: 'parents',
          });
          const previousParents = file.data.parents ? file.data.parents.join(',') : '';
          
          await drive.files.update({
            fileId: rec.drive_file_id,
            addParents: newFolderId,
            removeParents: previousParents,
            fields: 'id, parents',
          });
          movedCount++;
        } catch (err: any) {
          console.error(`Failed to move file ${rec.drive_file_id}:`, err.message);
        }
      }
      console.log(`Successfully moved ${movedCount} files to ${newFolderId}`);
    } else {
      console.warn('service-account.json not found, skipping actual Drive API migration. Only DB will update.');
    }

    // Update DB
    const { error: dbError } = await client.rpc('admin_migrate_tenant_server', {
      pin_code: '123456',
      p_user_id: userId,
      p_node_id: targetNodeId
    });

    if (dbError) throw dbError;

    res.json({ success: true, message: 'Migration completed' });
  } catch (err: any) {
    console.error('Migration error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
