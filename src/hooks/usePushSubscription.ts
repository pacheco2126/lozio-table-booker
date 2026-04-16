import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/hooks/useAuth';

// Public key — safe to expose in frontend code
const VAPID_PUBLIC_KEY =
  'BFy3Ru15Qj70TU4JK3polKuevD0-qQp6bdOYjd8DgMQ0nL1gXVnS1m10tqbujXZ1k-RrEidt4ug9ggfXUqQTdBs';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function saveSubscription(sub: PushSubscription, userId: string) {
  const json = sub.toJSON();
  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
    { onConflict: 'endpoint' },
  );
}

export const usePushSubscription = () => {
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();

  useEffect(() => {
    if (!isAdmin || !user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const subscribe = async () => {
      try {
        console.log('[Push] Starting subscription flow for user', user.id);
        const permission = await Notification.requestPermission();
        console.log('[Push] Permission:', permission);
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        console.log('[Push] SW ready, scope:', registration.scope);

        let subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          console.log('[Push] Reusing existing subscription:', subscription.endpoint);
        } else {
          console.log('[Push] Creating new subscription...');
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
          });
          console.log('[Push] New subscription created:', subscription.endpoint);
        }

        const { error } = await supabase.from('push_subscriptions').upsert(
          {
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.toJSON().keys?.p256dh ?? '',
            auth: subscription.toJSON().keys?.auth ?? '',
          },
          { onConflict: 'endpoint' },
        );
        if (error) {
          console.error('[Push] Failed to save subscription:', error);
        } else {
          console.log('[Push] Subscription saved to DB ✓');
        }
      } catch (err) {
        console.error('[Push] Subscription error:', err);
      }
    };

    subscribe();
  }, [isAdmin, user]);
};
