import { Request, Response } from 'express';
import { supabase } from '../db';
import { MarketplaceFactory } from '../services/marketplace/MarketplaceFactory';

// Setup Marketplace API Key
export const setupIntegration = async (req: Request, res: Response) => {
  try {
    const { marketplaceName, appId, appSecret, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    // Upsert the integration
    const { data: integration, error } = await supabase
      .from('marketplace_integrations')
      .upsert({
        user_id: userId as string,
        marketplace_name: marketplaceName.toUpperCase(),
        app_id: appId,
        app_secret: appSecret,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, marketplace_name' })
      .select()
      .single();

    if (error) throw error;

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

    const { data: integration, error } = await supabase
      .from('marketplace_integrations')
      .select('*')
      .eq('user_id', userId as string)
      .eq('marketplace_name', (marketplace as string).toUpperCase())
      .single();

    if (error || !integration || !integration.app_id) {
      return res.status(400).json({ success: false, message: `Marketplace ${marketplace} is not configured.` });
    }

    // Use Factory to get the correct service
    const service = MarketplaceFactory.getService(integration.marketplace_name, {
      appId: integration.app_id,
      appSecret: integration.app_secret,
      accessToken: integration.access_token // Will be null initially
    });

    const orderData = await service.getOrderDetail(resi as string);

    res.json({ success: true, data: orderData });
  } catch (error: any) {
    console.error('Error syncing order:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
