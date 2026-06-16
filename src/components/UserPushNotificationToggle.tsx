import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useAuth } from "@/hooks/useAuth";

interface Prefs {
  notify_reservations: boolean;
  notify_orders: boolean;
}

const UserPushNotificationToggle = () => {
  const { user } = useAuth();
  const { status, busy, supported, enablePush, disablePush } = usePushSubscription();
  const [testing, setTesting] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ notify_reservations: true, notify_orders: true });
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const subscribed = status === "granted-subscribed";

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("notify_reservations, notify_orders")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          notify_reservations: data.notify_reservations ?? true,
          notify_orders: data.notify_orders ?? true,
        });
      }
      setPrefsLoaded(true);
    })();
  }, [user]);

  const updatePref = async (key: keyof Prefs, value: boolean) => {
    if (!user) return;
    setPrefs((p) => ({ ...p, [key]: value }));
    const { error } = await supabase
      .from("profiles")
      .update({ [key]: value })
      .eq("user_id", user.id);
    if (error) {
      toast.error("No se pudo guardar la preferencia");
      setPrefs((p) => ({ ...p, [key]: !value }));
    }
  };

  const handleEnable = async () => {
    const ok = await enablePush();
    if (ok) toast.success("¡Notificaciones activadas! 🔔");
    else toast.error("No se pudieron activar las notificaciones");
  };

  const handleDisable = async () => {
    await disablePush();
    toast.info("Notificaciones desactivadas");
  };

  const handleTest = async () => {
    if (!user) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-user-push", {
        body: {
          title: "🔔 Notificación de prueba",
          body: "¡Funciona! Te avisaremos de tus reservas y pedidos.",
          url: "/perfil",
        },
      });
      if (error) throw error;
      const sent = (data as { sent?: number })?.sent ?? 0;
      if (sent > 0) toast.success(`Notificación enviada (${sent})`);
      else toast.warning("Sin suscripciones activas en este dispositivo");
    } catch {
      toast.error("Error enviando notificación de prueba");
    } finally {
      setTesting(false);
    }
  };

  if (!supported) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-lg border border-border mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BellOff className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-display text-lg font-bold text-foreground">Notificaciones</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Tu navegador no soporta notificaciones push. Para recibirlas, instala la app desde Chrome y vuelve a esta pantalla.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg border border-border mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground">Notificaciones</h2>
      </div>

      {!subscribed ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Activa las notificaciones para recibir el estado de tus pedidos y un recordatorio 30 min antes de tu reserva.
          </p>
          <Button onClick={handleEnable} disabled={busy} className="w-full">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
            Activar notificaciones
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notificaciones activas en este dispositivo
            </span>
          </div>

          {prefsLoaded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Label htmlFor="notify_orders" className="text-sm font-bold">Estado de mis pedidos</Label>
                  <p className="text-xs text-muted-foreground">Confirmación, preparación, listo, en camino, entregado.</p>
                </div>
                <Switch
                  id="notify_orders"
                  checked={prefs.notify_orders}
                  onCheckedChange={(v) => updatePref("notify_orders", v)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Label htmlFor="notify_reservations" className="text-sm font-bold">Recordatorio de reservas</Label>
                  <p className="text-xs text-muted-foreground">30 minutos antes: "¡Nos vemos en 30 minutos!"</p>
                </div>
                <Switch
                  id="notify_reservations"
                  checked={prefs.notify_reservations}
                  onCheckedChange={(v) => updatePref("notify_reservations", v)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing} className="flex-1">
              {testing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Send className="w-3 h-3 mr-2" />}
              Enviar prueba
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDisable} disabled={busy}>
              <BellOff className="w-3 h-3 mr-2" /> Desactivar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPushNotificationToggle;
