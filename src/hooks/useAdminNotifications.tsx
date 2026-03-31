import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const useAdminNotifications = () => {
  const { isAdmin, loading } = useIsAdmin();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const permissionGranted = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if (!isAdmin || loading) return;

    // Preload audio
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.7;

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        permissionGranted.current = perm === 'granted';
      });
    } else if ('Notification' in window) {
      permissionGranted.current = Notification.permission === 'granted';
    }
  }, [isAdmin, loading]);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked — user hasn't interacted yet
      });
    }
  }, []);

  const showNotification = useCallback((guestName: string, guests: string, time: string, date: string) => {
    const dateParts = date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    const formattedTime = time.substring(0, 5);
    const body = `👤 ${guestName} — 👥 ${guests}p\n📅 ${formattedDate} a las ${formattedTime}`;

    // Browser push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🍕 Nueva reserva en Lo Zio', {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'new-reservation',
        vibrate: [200, 100, 200],
      });
    }

    // Also show in-app toast
    toast.info('🍕 Nueva reserva', {
      description: body,
      duration: 8000,
    });
  }, []);

  // Subscribe to realtime reservation inserts
  useEffect(() => {
    if (!isAdmin || loading) return;

    const channel = supabase
      .channel('admin-reservation-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
        },
        (payload) => {
          const record = payload.new as any;
          playSound();
          showNotification(
            record.guest_name || 'Cliente',
            record.guests || '2',
            record.reservation_time || '',
            record.reservation_date || ''
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, loading, playSound, showNotification]);
};
