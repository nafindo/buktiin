import { Request, Response } from 'express';
import { prisma } from '../db';
import { getUserPlanLimits, resolveParentId } from '../services/subscriptionService';
import { createClient } from '@supabase/supabase-js';

// Get Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const totalRecordings = await prisma.recording.count({ where: { userId } });
    const completedRecordings = await prisma.recording.count({
      where: { userId, status: 'DONE' }
    });
    const processRecordings = await prisma.recording.count({
      where: { userId, status: 'PROCESS' }
    });
    const failedRecordings = await prisma.recording.count({
      where: { userId, status: 'FAILED' }
    });
    const pendingUploadCount = await prisma.recording.count({
      where: { userId, uploadStatus: 'PENDING' }
    });

    const totalStorageAgg = await prisma.recording.aggregate({
      where: { userId },
      _sum: {
        videoSize: true
      }
    });
    const totalStorageBytes = totalStorageAgg._sum.videoSize || 0;

    // Fetch recent 30 days of recordings for aggregation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRecordings = await prisma.recording.findMany({
      where: { 
        userId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        marketplace: true,
        videoSize: true,
      }
    });

    // 1. Order Trends (last 7 days grouped by date string e.g., "01 May")
    const orderTrendsMap: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // e.g. "01 May"
      orderTrendsMap[dateStr] = 0;
    }

    recentRecordings.forEach(rec => {
      const d = new Date(rec.createdAt);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (orderTrendsMap[dateStr] !== undefined) {
        orderTrendsMap[dateStr]++;
      }
    });

    const orderTrends = {
      labels: Object.keys(orderTrendsMap),
      data: Object.values(orderTrendsMap)
    };

    // 2. Marketplace Distribution
    const marketplaceCounts: Record<string, number> = {};
    recentRecordings.forEach(rec => {
      const mp = (rec.marketplace || 'OTHER').toUpperCase();
      marketplaceCounts[mp] = (marketplaceCounts[mp] || 0) + 1;
    });

    const marketplaceDistribution = {
      labels: Object.keys(marketplaceCounts),
      data: Object.values(marketplaceCounts)
    };

    // 3. Storage Metrics
    const videosWithSizes = recentRecordings.filter(r => r.videoSize && r.videoSize > 0);
    const totalSizeThisMonth = videosWithSizes.reduce((acc, curr) => acc + (curr.videoSize || 0), 0);
    const avgSizeBytes = videosWithSizes.length > 0 ? totalSizeThisMonth / videosWithSizes.length : 0;
    const storageMetrics = {
      totalVideosThisMonth: recentRecordings.length,
      totalSizeThisMonth,
      avgSizeBytes
    };

    res.json({
      success: true,
      data: {
        total: totalRecordings,
        completed: completedRecordings,
        process: processRecordings,
        failed: failedRecordings,
        pendingUploads: pendingUploadCount,
        videoCount: completedRecordings,
        totalStorageBytes: totalStorageBytes,
        orderTrends,
        marketplaceDistribution,
        storageMetrics
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
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const history = await prisma.recording.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for now
    });
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Create new recording entry
export const saveRecording = async (req: Request, res: Response) => {
  try {
    const { resi, customer, marketplace, items, userId, accessToken } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    // Check Limits before saving
    const limits = await getUserPlanLimits(userId, accessToken);
    
    // Check order limits
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todaysRecordings = await prisma.recording.count({
      where: {
        userId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    });

    if (todaysRecordings >= limits.orderLimit) {
      return res.status(403).json({ 
        success: false, 
        message: 'LIMIT_EXCEEDED_ORDER',
        limit: limits.orderLimit 
      });
    }

    // Check storage limits
    const storageAgg = await prisma.recording.aggregate({
      where: { userId },
      _sum: { videoSize: true }
    });
    
    const currentStorageMB = (storageAgg._sum.videoSize || 0) / (1024 * 1024);
    if (currentStorageMB >= limits.storageLimitMB) {
      return res.status(403).json({ 
        success: false, 
        message: 'LIMIT_EXCEEDED_STORAGE',
        limit: limits.storageLimitMB 
      });
    }

    const recording = await prisma.recording.create({
      data: {
        resi,
        customer,
        marketplace,
        items: JSON.stringify(items),
        userId,
        status: 'PROCESS'
      }
    });

    res.status(201).json({ success: true, data: recording });
  } catch (error) {
    console.error('Error saving recording:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Check Limits & Enforce Device Sessions
export const checkLimits = async (req: Request, res: Response) => {
  try {
    const { userId, deviceId, accessToken } = req.body;
    
    if (!userId || !deviceId) {
      return res.status(400).json({ success: false, message: 'Missing userId or deviceId' });
    }

    const limits = await getUserPlanLimits(userId, accessToken);

    // Check Limits & Enforce Device Sessions
    const resolvedUserId = await resolveParentId(userId);

    // Enforce 1-Device Rule (Count all sessions across parent and subaccounts)
    // Actually, device limits should allow up to X devices total for the entire account family.
    // For now, if limits.deviceLimit == 1, we only allow 1 device.
    if (limits.deviceLimit <= 1) {
      const existingSession = await prisma.userSession.findUnique({
        where: { userId: resolvedUserId }
      });

      if (!existingSession) {
        // Register new session for the parent
        await prisma.userSession.create({
          data: { userId: resolvedUserId, deviceId }
        });
      } else if (existingSession.deviceId !== deviceId) {
        if (req.body.forceLogin) {
           await prisma.userSession.update({
             where: { userId: resolvedUserId },
             data: { deviceId }
           });
        } else {
           return res.status(403).json({ success: false, message: 'DEVICE_LIMIT_REACHED' });
        }
      }
    }

    // Check order limits
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todaysRecordings = await prisma.recording.count({
      where: {
        userId,
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    });

    // Check storage limits
    const storageAgg = await prisma.recording.aggregate({
      where: { userId },
      _sum: { videoSize: true }
    });
    const currentStorageMB = (storageAgg._sum.videoSize || 0) / (1024 * 1024);

    res.json({
      success: true,
      data: {
        plan: limits.name,
        isSubAccount: resolvedUserId !== userId,
        orders: {
          used: todaysRecordings,
          limit: limits.orderLimit
        },
        storage: {
          usedMB: currentStorageMB,
          limitMB: limits.storageLimitMB
        }
      }
    });
  } catch (error) {
    console.error('Error checking limits:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Upload video and trigger compression (mock for now without Redis)
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    if (!recordingId) {
      return res.status(400).json({ success: false, message: 'No recordingId provided' });
    }

    // Update recording status
    await prisma.recording.update({
      where: { id: recordingId },
      data: {
        status: 'DONE',
        videoPath: file.path,
        videoSize: file.size
      }
    });

    // In a real app with Redis, we would push the file.path to a BullMQ queue here
    // for async FFmpeg processing. Since we don't have Redis locally, we'll
    // skip the BullMQ queue and just mark it as DONE.

    res.json({ success: true, message: 'Video uploaded successfully', file: file.path });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ========================
// SUB-ACCOUNTS API
// ========================

export const getSubAccounts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

    const subAccounts = await prisma.subAccount.findMany({
      where: { parentId: userId as string }
    });

    res.json({ success: true, data: subAccounts });
  } catch (err) {
    console.error('Error fetching subaccounts:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addSubAccount = async (req: Request, res: Response) => {
  try {
    const { parentId, email, password, accessToken } = req.body;
    if (!parentId || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // Check plan limits
    const limits = await getUserPlanLimits(parentId, accessToken);
    const existingCount = await prisma.subAccount.count({ where: { parentId } });
    
    // We allow up to limits.deviceLimit accounts in total. 1 parent + X sub-accounts
    if (existingCount + 1 >= limits.deviceLimit) {
      return res.status(403).json({ success: false, message: `Batas akun tercapai untuk paket ${limits.name}.` });
    }

    // Create Supabase user
    // We use a temporary client to avoid modifying the current session
    const tempClient = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(400).json({ success: false, message: authError?.message || 'Gagal mendaftarkan akun di server' });
    }

    const childId = authData.user.id;

    const subAccount = await prisma.subAccount.create({
      data: {
        childId,
        parentId,
        email
      }
    });

    res.status(201).json({ success: true, data: subAccount });
  } catch (err) {
    console.error('Error adding subaccount:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteSubAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subAccount.delete({
      where: { id: id as string }
    });
    // Note: We are not deleting the user from Supabase Auth because we don't have the Service Role Key here.
    // However, they will no longer be linked to the parent account and won't consume their quotas.
    res.json({ success: true, message: 'Akun berhasil dihapus dari sistem.' });
  } catch (err) {
    console.error('Error deleting subaccount:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
