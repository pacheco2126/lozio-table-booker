import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { toast } from 'sonner';

const PushNotificationToggle = () => {
  const { status, busy, supported, enablePush, disablePush } = usePushSubscription();

  if (!supported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        Notificaciones no soportadas en este navegador
      </div>
    );
  }

  const handleEnable = async () => {
    const ok = await enablePush();
    if (ok) {
      toast.success('Notificaciones activadas', {
        description: 'Recibirás avisos aunque la app esté cerrada.',
      });
    } else if (status === 'denied') {
      toast.error('Permiso denegado', {
        description: 'Activa las notificaciones en Ajustes del sistema para esta app.',
      });
    } else {
      toast.error('No se pudo activar', { description: 'Inténtalo de nuevo.' });
    }
  };

  const handleDisable = async () => {
    const ok = await disablePush();
    if (ok) toast.info('Notificaciones desactivadas');
  };

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
        <BellOff className="w-5 h-5 text-destructive shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-destructive">Permiso bloqueado</p>
          <p className="text-muted-foreground text-xs mt-1">
            Activa las notificaciones desde los Ajustes de tu dispositivo (iOS: Ajustes → Notificaciones → Lo Zio).
          </p>
        </div>
      </div>
    );
  }

  if (status === 'granted-subscribed') {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-primary" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Notificaciones activas</p>
            <p className="text-xs text-muted-foreground">Recibirás avisos en este dispositivo.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDisable} disabled={busy}>
          Desactivar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">Activar notificaciones</p>
          <p className="text-xs text-muted-foreground">
            Imprescindible en iOS/Android para recibir reservas con la app cerrada.
          </p>
        </div>
      </div>
      <Button size="sm" onClick={handleEnable} disabled={busy}>
        {busy ? 'Activando…' : 'Activar'}
      </Button>
    </div>
  );
};

export default PushNotificationToggle;
