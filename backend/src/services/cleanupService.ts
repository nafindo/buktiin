import { prisma } from '../db';
import { getUserPlanLimits } from './subscriptionService';
import fs from 'fs';

export class CleanupService {
  private isRunning: boolean = false;
  private interval: number = 1000 * 60 * 60 * 24; // Run once a day
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    console.log('[CleanupService] Initialized.');
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[CleanupService] Background worker started.');

    this.timer = setInterval(() => {
      this.runCleanup();
    }, this.interval);

    // Run once immediately
    this.runCleanup();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[CleanupService] Background worker stopped.');
  }

  async runCleanup() {
    console.log('[CleanupService] Scanning for expired recordings based on retention policies...');
    try {
      // Get all unique users who have recordings
      const users = await prisma.recording.groupBy({
        by: ['userId']
      });

      for (const { userId } of users) {
        if (!userId) continue;
        
        const limits = await getUserPlanLimits(userId);
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - limits.retentionDays);

        const expiredRecordings = await prisma.recording.findMany({
          where: {
            userId,
            createdAt: { lt: retentionDate },
            status: { not: 'DELETED' }
          }
        });

        for (const recording of expiredRecordings) {
          try {
            // Delete local file if it exists
            if (recording.videoPath && fs.existsSync(recording.videoPath)) {
              fs.unlinkSync(recording.videoPath);
              console.log(`[CleanupService] Deleted local file for ${recording.id}`);
            }

            // Mark as deleted in DB
            await prisma.recording.update({
              where: { id: recording.id },
              data: { status: 'DELETED' }
            });
            
            // NOTE: Deleting from Google Drive would require a specific Apps Script endpoint to trigger delete by driveFileId.
            // For now, local deletion frees up the PC storage which is the most critical constraint.

          } catch (err) {
            console.error(`[CleanupService] Failed to clean up recording ${recording.id}:`, err);
          }
        }
      }
      
      console.log('[CleanupService] Cleanup check complete.');
    } catch (error) {
      console.error('[CleanupService] Error running cleanup:', error);
    }
  }
}

export const cleanupService = new CleanupService();
