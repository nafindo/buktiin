import { createClient } from '@supabase/supabase-js';
import { prisma } from '../db';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

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
  if (planName === 'PRO') return 10;
  if (planName === 'BUSINESS') return 50;
  if (planName === 'ENTERPRISE') return 9999;
  return 1;
};

export const resolveParentId = async (userId: string): Promise<string> => {
  try {
    const sub = await prisma.subAccount.findUnique({
      where: { childId: userId }
    });
    return sub ? sub.parentId : userId;
  } catch (err) {
    return userId;
  }
};

export const getUserPlanLimits = async (userId: string, accessToken?: string): Promise<PlanLimits> => {
  if (!userId) return DEFAULT_FREE_LIMITS;

  try {
    // Resolve to parent if this is a sub-account
    const resolvedUserId = await resolveParentId(userId);

    // If accessToken is provided, create a scoped client to bypass RLS properly using the user's session
    let client = supabase;
    if (accessToken) {
      client = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
      });
    }

    const { data, error } = await client
      .from('subscriptions')
      .select(`
        status,
        end_date,
        plans (*)
      `)
      .eq('user_id', resolvedUserId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return DEFAULT_FREE_LIMITS;
    }

    const sub = data[0];

    // Check expiration
    if (new Date(sub.end_date) < new Date()) {
      return DEFAULT_FREE_LIMITS;
    }

    const planData = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans;

    if (!planData) return DEFAULT_FREE_LIMITS;

    return {
      name: planData.name,
      storageLimitMB: planData.storageLimit || planData.storagelimit,
      orderLimit: planData.orderLimit || planData.orderlimit,
      retentionDays: planData.retentionDays || planData.retentiondays,
      deviceLimit: getPlanDeviceLimit(planData.name)
    };
  } catch (err) {
    console.error('Error fetching user plan:', err);
    return DEFAULT_FREE_LIMITS;
  }
};
