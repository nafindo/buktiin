import { Request, Response } from 'express';
import crypto from 'crypto';
// @ts-ignore
import midtransClient from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';

// removed top level instantiation

export const createPayment = async (req: Request, res: Response) => {
  try {
    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });
    const { planId, price, name, userId } = req.body;
    
    if (!planId || !price || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = `SUB-${userId.substring(0, 5)}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: price
      },
      item_details: [{
        id: planId,
        price: price,
        quantity: 1,
        name: `Langganan BUKTIIN - ${name}`
      }],
      customer_details: {
        first_name: "User",
        email: "user@toko.com" // Ideally fetched from DB
      },
      custom_field1: userId,
      custom_field2: planId
    };

    const transaction = await snap.createTransaction(parameter);
    
    res.json({ 
      token: transaction.token, 
      redirect_url: transaction.redirect_url,
      order_id: orderId 
    });
  } catch (error: any) {
    console.error('Payment Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const activateSubscription = async (req: Request, res: Response) => {
  try {
    const { userId, planId, token } = req.body;
    
    // In a real app, we would verify the token with Midtrans here
    // For this local prototype, we'll just activate it directly via Supabase.
    // NOTE: Requires Supabase RLS to allow INSERT for authenticated users, 
    // or we use a Service Role Key. Since we use anon key here, it will fail 
    // unless RLS allows it.
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Add 30 days

    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );

    // Upsert subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_id: planId,
        status: 'ACTIVE',
        end_date: endDate.toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    res.json({ success: true, message: 'Subscription Activated!' });
  } catch (error: any) {
    console.error('Activation Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const handleMidtransWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Midtrans sends these keys
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      custom_field1: userId,
      custom_field2: planId
    } = payload;

    if (!userId || !planId) {
      // Not a subscription payment or missing custom fields
      return res.status(200).json({ message: 'Ignored, missing custom fields' });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    
    // Verify signature
    const hashInput = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const generatedSignature = crypto.createHash('sha512').update(hashInput).digest('hex');

    if (generatedSignature !== signature_key) {
      console.warn('Invalid Midtrans Signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Only process successful payments
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Add 30 days based on monthly sub
      
      const supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
      );

      // Upsert subscription (using Service Role Key because this runs anonymously)
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'ACTIVE',
          end_date: endDate.toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Webhook DB Error:', error);
        return res.status(500).json({ error: 'Database update failed' });
      }
      
      console.log(`Successfully activated subscription for user ${userId} (Plan: ${planId})`);
    }

    // Always return 200 OK to midtrans so it stops retrying
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: error.message });
  }
};
