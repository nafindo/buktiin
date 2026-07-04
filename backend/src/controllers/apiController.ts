import { Request, Response } from 'express';
import { supabase } from '../db';
import { getUserPlanLimits, resolveParentId } from '../services/subscriptionService';
import { triggerDriveUpload } from '../services/driveService';
import { triggerCleanupForUser } from '../services/cleanupService';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';

// Robust FFmpeg path resolution with multiple fallback strategies
function resolveFfmpegPath(): string {
  const candidates: string[] = [];

  // Strategy 1: Electron's process.resourcesPath (when require()'d by Electron main process)
  if ((process as any).resourcesPath) {
    candidates.push(path.join((process as any).resourcesPath, 'ffmpeg.exe'));
  }

  // Strategy 2: Relative to __dirname for production layout (resources/backend/dist/index.js → resources/ffmpeg.exe)
  candidates.push(path.join(__dirname, '..', '..', 'ffmpeg.exe'));
  candidates.push(path.join(__dirname, '..', 'ffmpeg.exe'));

  // Strategy 3: Common install paths
  candidates.push('C:\\Program Files\\Buktiin\\resources\\ffmpeg.exe');

  // Strategy 4: ffmpeg-static from node_modules (dev mode)
  const ffmpegStaticPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
  candidates.push(ffmpegStaticPath);

  // Strategy 5: Try require('ffmpeg-static') as last resort
  try {
    const staticPath = require('ffmpeg-static');
    if (staticPath && typeof staticPath === 'string') {
      candidates.push(staticPath);
    }
  } catch (_) {
    // ffmpeg-static not available, skip
  }

  console.log('[FFmpeg] Resolving path. Candidates:');
  for (const candidate of candidates) {
    const exists = fs.existsSync(candidate);
    console.log(`  [FFmpeg] ${exists ? '✓' : '✗'} ${candidate}`);
    if (exists) {
      console.log(`[FFmpeg] Using: ${candidate}`);
      return candidate;
    }
  }

  // Fallback: assume 'ffmpeg' is on system PATH
  console.warn('[FFmpeg] No binary found in candidates, falling back to system PATH "ffmpeg"');
  return 'ffmpeg';
}

const ffmpegPath = resolveFfmpegPath();
ffmpeg.setFfmpegPath(ffmpegPath);

// Helper to get authenticated supabase client
const getAuthClient = (accessToken?: string) => {
  if (!accessToken) return supabase;
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
};

// Get Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { userId, accessToken } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const client = getAuthClient(accessToken as string);
    const { data: recordings, error } = await client
      .from('recordings')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    
    const recs = recordings || [];
    const totalRecordings = recs.length;
    const completedRecordings = recs.filter(r => r.status === 'DONE').length;
    const processRecordings = recs.filter(r => r.status === 'PROCESS').length;
    const failedRecordings = recs.filter(r => r.status === 'FAILED').length;
    const pendingUploadCount = recs.filter(r => r.upload_status === 'PENDING').length;
    const uploadSuccessCount = recs.filter(r => r.upload_status === 'SUCCESS').length;

    const totalStorageBytes = recs.reduce((sum, r) => sum + (Number(r.video_size) || 0), 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRecordings = recs.filter(r => new Date(r.created_at) >= thirtyDaysAgo);

    const orderTrendsMap: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      orderTrendsMap[dateStr] = 0;
    }

    recentRecordings.forEach(rec => {
      const d = new Date(rec.created_at);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (orderTrendsMap[dateStr] !== undefined) {
        orderTrendsMap[dateStr]++;
      }
    });

    const orderTrends = { labels: Object.keys(orderTrendsMap), data: Object.values(orderTrendsMap) };

    const marketplaceCounts: Record<string, number> = {};
    recentRecordings.forEach(rec => {
      const mp = (rec.marketplace || 'OTHER').toUpperCase();
      marketplaceCounts[mp] = (marketplaceCounts[mp] || 0) + 1;
    });

    const marketplaceDistribution = { labels: Object.keys(marketplaceCounts), data: Object.values(marketplaceCounts) };

    const videosWithSizes = recentRecordings.filter(r => r.video_size && r.video_size > 0);
    const totalSizeThisMonth = videosWithSizes.reduce((acc, curr) => acc + (Number(curr.video_size) || 0), 0);
    const avgSizeBytes = videosWithSizes.length > 0 ? totalSizeThisMonth / videosWithSizes.length : 0;
    
    res.json({
      success: true,
      data: {
        total: totalRecordings,
        completed: completedRecordings,
        process: processRecordings,
        failed: failedRecordings,
        pendingUploads: pendingUploadCount,
        uploadSuccessCount: uploadSuccessCount,
        videoCount: completedRecordings,
        totalStorageBytes: totalStorageBytes,
        orderTrends,
        marketplaceDistribution,
        storageMetrics: { totalVideosThisMonth: recentRecordings.length, totalSizeThisMonth, avgSizeBytes }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get History
export const getHistory = async (req: Request, res: Response) => {
  try {
    const { userId, scanType, accessToken } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

    const client = getAuthClient(accessToken as string);
    
    let query = client
      .from('recordings')
      .select('*')
      .eq('user_id', userId);
      
    if (scanType) {
      query = query.eq('scan_type', scanType);
    }
      
    const { data: history, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    // Map to frontend expected format
    const mappedHistory = (history || []).map(h => ({
      ...h,
      userId: h.user_id,
      videoPath: h.video_path,
      videoSize: h.video_size,
      uploadStatus: h.upload_status,
      driveFileId: h.drive_file_id,
      createdAt: h.created_at,
      updatedAt: h.updated_at
    }));

    res.json({ success: true, data: mappedHistory });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Create new recording entry
export const saveRecording = async (req: Request, res: Response) => {
  try {
    const { resi, customer, marketplace, items, scanType, userId, accessToken } = req.body;
    
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

    const client = getAuthClient(accessToken);
    const limits = await getUserPlanLimits(userId, accessToken);
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data: todaysData, error: countErr } = await client
      .from('recordings')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
      
    if (countErr) throw countErr;
    const todaysRecordings = todaysData?.length || 0;

    if (todaysRecordings >= limits.orderLimit) {
      return res.status(403).json({ success: false, message: 'LIMIT_EXCEEDED_ORDER', limit: limits.orderLimit });
    }

    const { data: allData, error: storageErr } = await client
      .from('recordings')
      .select('video_size')
      .eq('user_id', userId);
      
    if (storageErr) throw storageErr;
    const currentStorageMB = (allData || []).reduce((sum, r) => sum + (Number(r.video_size) || 0), 0) / (1024 * 1024);
    
    if (currentStorageMB >= limits.storageLimitMB) {
      return res.status(403).json({ success: false, message: 'LIMIT_EXCEEDED_STORAGE', limit: limits.storageLimitMB });
    }

    const { data: recording, error } = await client
      .from('recordings')
      .insert({
        resi, customer, marketplace, 
        items: items, // Supabase handles JSON automatically
        user_id: userId,
        status: 'PROCESS',
        scan_type: scanType || 'PACKING'
      })
      .select()
      .single();

    if (error) throw error;
    
    const mappedRecording = {
      ...recording,
      userId: recording.user_id,
      videoPath: recording.video_path,
      videoSize: recording.video_size,
      uploadStatus: recording.upload_status,
      driveFileId: recording.drive_file_id,
      createdAt: recording.created_at,
      updatedAt: recording.updated_at
    };

    res.status(201).json({ success: true, data: mappedRecording });
  } catch (error: any) {
    console.error('Error saving recording:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + (error?.message || String(error)) });
  }
};

// Check Limits & Enforce Device Sessions
export const checkLimits = async (req: Request, res: Response) => {
  try {
    const { userId, deviceId, accessToken } = req.body;
    if (!userId || !deviceId) return res.status(400).json({ success: false, message: 'Missing userId or deviceId' });

    const client = getAuthClient(accessToken);
    const limits = await getUserPlanLimits(userId, accessToken);
    const resolvedUserId = await resolveParentId(userId, accessToken);

    if (limits.deviceLimit <= 1) {
      const { data: existingSession, error: sessionErr } = await client
        .from('user_sessions')
        .select('*')
        .eq('user_id', resolvedUserId)
        .single();

      if (!existingSession) {
        await client.from('user_sessions').insert({ user_id: resolvedUserId, device_id: deviceId });
      } else if (existingSession.device_id !== deviceId) {
        if (req.body.forceLogin) {
           await client.from('user_sessions').update({ device_id: deviceId }).eq('user_id', resolvedUserId);
        } else {
           return res.status(403).json({ success: false, message: 'DEVICE_LIMIT_REACHED' });
        }
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data: todaysData } = await client.from('recordings').select('id').eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
    const todaysRecordings = todaysData?.length || 0;

    const { data: allData } = await client.from('recordings').select('video_size').eq('user_id', userId);
    const currentStorageMB = (allData || []).reduce((sum, r) => sum + (Number(r.video_size) || 0), 0) / (1024 * 1024);

    // Trigger cleanup asynchronously
    triggerCleanupForUser(userId, accessToken, limits.retentionDays).catch(err => console.error(err));

    res.json({
      success: true,
      data: {
        plan: limits.name,
        isSubAccount: resolvedUserId !== userId,
        orders: { used: todaysRecordings, limit: limits.orderLimit },
        storage: { usedMB: currentStorageMB, limitMB: limits.storageLimitMB }
      }
    });
  } catch (error) {
    console.error('Error checking limits:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Upload video
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const { recordingId, accessToken } = req.body;
    const file = req.file;

    if (!file || !recordingId) {
      return res.status(400).json({ success: false, message: 'Missing file or recordingId' });
    }

    const client = getAuthClient(accessToken);
    const { data: recData, error } = await client
      .from('recordings')
      .select('resi, marketplace')
      .eq('id', recordingId)
      .single();

    if (error) throw error;

    const mp4Path = file.path.replace('.webm', '.mp4');

    console.log(`[Upload] Transcoding ${file.path} to ${mp4Path}`);
    
    ffmpeg(file.path)
      .outputOptions([
        '-c:v libx264',
        '-preset ultrafast',
        '-crf 28',
        '-r 30'
      ])
      .output(mp4Path)
      .on('end', async () => {
        console.log(`[Upload] Transcoding finished: ${mp4Path}`);
        try {
          fs.unlinkSync(file.path); // clean up webm
        } catch (e) {
          console.error('Failed to clean up webm:', e);
        }

        const finalStat = fs.statSync(mp4Path);
        
        await client
          .from('recordings')
          .update({
            status: 'DONE',
            video_path: mp4Path,
            video_size: finalStat.size
          })
          .eq('id', recordingId);

        // Async background upload to Drive
        triggerDriveUpload(recordingId, mp4Path, accessToken, recData.resi, recData.marketplace).catch(err => {
          console.error('Async drive upload error:', err);
        });
      })
      .on('error', async (err) => {
          const errorDetails = [
            `[FFmpeg Error] ${new Date().toISOString()}`,
            `FFmpeg Path: ${ffmpegPath}`,
            `Input: ${file.path}`,
            `Input Exists: ${fs.existsSync(file.path)}`,
            `Input Size: ${fs.existsSync(file.path) ? fs.statSync(file.path).size : 'N/A'}`,
            `Output: ${mp4Path}`,
            `Error: ${err.message || String(err)}`,
            `Stack: ${err.stack || 'N/A'}`,
            ''
          ].join('\n');
          console.error(errorDetails);
          try {
            const logPath = path.join(os.tmpdir(), 'ffmpeg-error.log');
            fs.appendFileSync(logPath, errorDetails + '\n---\n');
          } catch (_) {}
          await client
            .from('recordings')
            .update({ status: 'FAILED' })
            .eq('id', recordingId);
      })
      .run();

    res.json({ success: true, message: 'Video processing started', file: mp4Path });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Sub-Accounts
export const getSubAccounts = async (req: Request, res: Response) => {
  try {
    const { userId, accessToken } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

    const client = getAuthClient(accessToken as string);
    const { data: subAccounts, error } = await client
      .from('sub_accounts')
      .select('*')
      .eq('parent_id', userId);
      
    if (error) throw error;
    
    const mapped = (subAccounts || []).map(s => ({
      ...s, childId: s.child_id, parentId: s.parent_id, createdAt: s.created_at, updatedAt: s.updated_at
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Error fetching subaccounts:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addSubAccount = async (req: Request, res: Response) => {
  try {
    const { parentId, email, password, accessToken } = req.body;
    if (!parentId || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

    const client = getAuthClient(accessToken);
    const limits = await getUserPlanLimits(parentId, accessToken);
    
    const { data: existingData } = await client.from('sub_accounts').select('id').eq('parent_id', parentId);
    const existingCount = existingData?.length || 0;
    
    if (existingCount + 1 >= limits.deviceLimit) {
      return res.status(403).json({ success: false, message: `Batas akun tercapai untuk paket ${limits.name}.` });
    }

    const tempClient = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await tempClient.auth.signUp({ email, password });
    if (authError || !authData.user) {
      return res.status(400).json({ success: false, message: authError?.message || 'Gagal mendaftar' });
    }

    const childId = authData.user.id;
    const { data: subAccount, error: insertErr } = await client
      .from('sub_accounts')
      .insert({ child_id: childId, parent_id: parentId, email })
      .select()
      .single();

    if (insertErr) throw insertErr;
    res.status(201).json({ success: true, data: { ...subAccount, childId: subAccount.child_id, parentId: subAccount.parent_id } });
  } catch (err) {
    console.error('Error adding subaccount:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteSubAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accessToken } = req.body; // Need to pass accessToken in DELETE body
    
    const client = getAuthClient(accessToken);
    const { error } = await client.from('sub_accounts').delete().eq('id', id);
    
    if (error) throw error;
    res.json({ success: true, message: 'Akun berhasil dihapus dari sistem.' });
  } catch (err) {
    console.error('Error deleting subaccount:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const streamVideo = (req: Request, res: Response) => {
  const { filename } = req.params;
  const videoPath = path.join(os.tmpdir(), 'buktiin_uploads', filename as string);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video not found');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range as string;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if(start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n'+start+' >= '+fileSize);
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head: Record<string, any> = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    
    if (req.query.download) {
      head['Content-Disposition'] = `attachment; filename="${filename}"`;
    }

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head: Record<string, any> = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    if (req.query.download) {
      head['Content-Disposition'] = `attachment; filename="${filename}"`;
    }
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
};
