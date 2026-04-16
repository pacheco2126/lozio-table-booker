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
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;

        // Reuse existing subscription if the browser already has one
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await saveSubscription(existing, user.id);
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        await saveSubscription(subscription, user.id);
      } catch (err) {
        console.error('Push subscription error:', err);
      }
    };

    subscribe();
  }, [isAdmin, user]);
};
