import { supabase } from './supabase';

/**
 * Retrieves or generates a persistent unique Device ID for this device / browser instance.
 */
export function getDeviceId(): string {
  let id = localStorage.getItem('buktiin_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('buktiin_device_id', id);
  }
  return id;
}

/**
 * Registers this device as the single active device for the user account.
 * Updates user metadata, updates session table if available, and broadcasts force_logout event to kick any other active devices.
 */
export async function registerDeviceSession(userId: string, deviceId: string): Promise<void> {
  try {
    const nowIso = new Date().toISOString();

    // 1. Persist active device in Supabase Auth user metadata
    await supabase.auth.updateUser({
      data: {
        active_device_id: deviceId,
        active_device_at: nowIso
      }
    });

    // 2. Optional: Upsert to user_sessions table if present in DB
    try {
      await supabase.from('user_sessions').upsert({
        user_id: userId,
        device_id: deviceId,
        updated_at: nowIso
      }, { onConflict: 'user_id' });
    } catch (_) {}

    // 3. Broadcast realtime force_logout to all other active sessions for this user
    const channel = supabase.channel(`single-device-${userId}`);
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'force_logout',
            payload: { activeDeviceId: deviceId, timestamp: Date.now() }
          }).then(() => {
            setTimeout(() => {
              supabase.removeChannel(channel);
              resolve();
            }, 300);
          }).catch(() => resolve());
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          resolve();
        }
      });
      // Safety timeout after 1.5s
      setTimeout(() => resolve(), 1500);
    });
  } catch (err) {
    console.warn('[DeviceSession] Register device session error:', err);
  }
}

/**
 * Checks if this device is currently the registered active device for the user.
 */
export async function checkIsActiveDevice(userId: string, myDeviceId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const activeId = user.user_metadata?.active_device_id;
    if (activeId && activeId !== myDeviceId) {
      return false;
    }

    // Optional secondary check on user_sessions table
    try {
      const { data: sessionRow } = await supabase
        .from('user_sessions')
        .select('device_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (sessionRow?.device_id && sessionRow.device_id !== myDeviceId) {
        return false;
      }
    } catch (_) {}

    return true;
  } catch (err) {
    console.warn('[DeviceSession] checkIsActiveDevice error:', err);
    return true;
  }
}

/**
 * Listens in realtime and periodically monitors active device session.
 * Triggers onKick callback immediately when another device registers as active.
 */
export function listenToDeviceSession(
  userId: string,
  myDeviceId: string,
  onKick: () => void
): () => void {
  let isKicked = false;

  const triggerKick = () => {
    if (isKicked) return;
    isKicked = true;
    onKick();
  };

  // 1. Realtime Broadcast Channel
  const channel = supabase.channel(`single-device-${userId}`)
    .on('broadcast', { event: 'force_logout' }, (payload) => {
      if (payload.payload?.activeDeviceId && payload.payload.activeDeviceId !== myDeviceId) {
        console.warn('[SingleDevice] Force logout broadcast received. Active device ID:', payload.payload.activeDeviceId);
        triggerKick();
      }
    })
    .subscribe();

  // 2. Periodic Watchdog (Every 3.5s)
  const verifySession = async () => {
    if (isKicked) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const activeId = user.user_metadata?.active_device_id;
      if (activeId && activeId !== myDeviceId) {
        console.warn('[SingleDevice] Active device mismatch detected via periodic check:', activeId);
        triggerKick();
      }
    } catch (_) {}
  };

  const pollTimer = setInterval(verifySession, 3500);

  // 3. Tab Focus & Visibility change listeners
  const onFocus = () => verifySession();
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      verifySession();
    }
  };

  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    clearInterval(pollTimer);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    supabase.removeChannel(channel);
  };
}
