import { Request, Response } from 'express';
import { prisma } from '../db';

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

    res.json({
      success: true,
      data: {
        total: totalRecordings,
        completed: completedRecordings,
        process: processRecordings,
        failed: failedRecordings,
        videoCount: completedRecordings,
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
    const { resi, customer, marketplace, items, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
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
