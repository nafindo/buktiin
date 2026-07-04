import { createClient } from '@supabase/supabase-js';
import { supabase } from '../db';

export interface PlanLimits {
  name: string;
  storageLimitMB: number;
  orderLimit: number;
  retentionDays: number;
  deviceLimit: number; // To track devices/accounts allowed
}

const DEFAULT_FREE_LIMITS: PlanLimits = {
  name: 'FREE',
  storageLimitMB: 5000,
  orderLimit: 10,
  retentionDays: 7,
  deviceLimit: 1
};

export const getPlanDeviceLimit = (planName: string): number => {
  if (planName === 'FREE' || planName === 'BASIC') return 1;
  if (planName === 'STARTER') return 3;
  if (planName === 'PRO') return 5;
  if (planName === 'BUSINESS') return 10;
  if (planName === 'ENTERPRISE') return 999999;
  return 1;
};

export const resolveParentId = async (userId: string, accessToken?: string): Promise<string> => {
  try {
    const client = accessToken ? createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    }) : supabase;

    const { data, error } = await client
      .from('sub_accounts')
      .select('parent_id')
      .eq('child_id', userId)
      .single();

    if (error || !data) return userId;
    return data.parent_id;
  } catch (err) {
    return userId;
  }
};

export const getUserPlanLimits = async (userId: string, accessToken?: string): Promise<PlanLimits> => {
  if (!userId) return DEFAULT_FREE_LIMITS;

  try {
    // Resolve to parent if this is a sub-account
    const resolvedUserId = await resolveParentId(userId, accessToken);
    let subData: any = null;

    if (accessToken) {
      const client = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
      });
      const { data, error } = await client
        .from('subscriptions')
        .select('status, end_date, plans (*)')
        .eq('user_id', resolvedUserId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!error && data && data.length > 0) {
        subData = data[0];
      }
    }

    if (!subData) {
      return DEFAULT_FREE_LIMITS;
    }

    const sub = subData;

    // Check expiration
    if (new Date(subData.end_date) < new Date()) {
      return DEFAULT_FREE_LIMITS;
    }

    const plan = subData.plans;
    return {
      name: plan.name,
      storageLimitMB: plan.storageLimit || plan.storagelimit || 5000,
      orderLimit: plan.orderLimit || plan.orderlimit || 10,
      retentionDays: plan.retentionDays || plan.retentiondays || 7,
      deviceLimit: plan.accountLimit || plan.accountlimit || getPlanDeviceLimit(plan.name)
    };
  } catch (err) {
    console.error('Error fetching user plan:', err);
    return DEFAULT_FREE_LIMITS;
  }
};
