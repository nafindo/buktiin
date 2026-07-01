import { Request, Response } from 'express';
import { prisma } from '../db';
import { MarketplaceFactory } from '../services/marketplace/MarketplaceFactory';

// Setup Marketplace API Key
export const setupIntegration = async (req: Request, res: Response) => {
  try {
    const { marketplaceName, appId, appSecret, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    // Upsert the integration
    const integration = await prisma.marketplaceIntegration.upsert({
      where: {
        userId_marketplaceName: {
          userId: userId as string,
          marketplaceName: marketplaceName.toUpperCase()
        }
      },
      update: {
        appId,
        appSecret,
        isActive: true
      },
      create: {
        userId: userId as string,
        marketplaceName: marketplaceName.toUpperCase(),
        appId,
        appSecret,
        isActive: true
      }
    });

    res.json({ success: true, message: `${marketplaceName} integration saved successfully`, data: integration });
  } catch (error) {
    console.error('Error setting up integration:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Sync Order by Resi
export const syncOrderByResi = async (req: Request, res: Response) => {
  try {
    const { resi, marketplace, userId } = req.query;
    if (!resi || !marketplace || !userId) {
      return res.status(400).json({ success: false, message: 'Missing resi, marketplace, or userId' });
    }

    const integration = await prisma.marketplaceIntegration.findUnique({
      where: {
        userId_marketplaceName: {
          userId: userId as string,
          marketplaceName: (marketplace as string).toUpperCase()
        }
      }
    });

    if (!integration || !integration.appId) {
      return res.status(400).json({ success: false, message: `Marketplace ${marketplace} is not configured.` });
    }

    // Use Factory to get the correct service
    const service = MarketplaceFactory.getService(integration.marketplaceName, {
      appId: integration.appId,
      appSecret: integration.appSecret,
      accessToken: integration.accessToken // Will be null initially
    });

    const orderData = await service.getOrderDetail(resi as string);

    res.json({ success: true, data: orderData });
  } catch (error: any) {
    console.error('Error syncing order:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
