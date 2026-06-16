import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authHeader?.startsWith("Bearer ") || !serviceRoleKey || authHeader.replace("Bearer ", "") !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // Find reservations confirmed, with user_id, not yet reminded,
    // and starting in the next ~30 minutes (with a 10-min look-back window
    // in case the cron job fires late).
    const now = new Date();
    const lo = new Date(now.getTime() + 20 * 60 * 1000); // 20 min from now
    const hi = new Date(now.getTime() + 35 * 60 * 1000); // 35 min from now

    // Fetch candidate reservations for today's date.
    // We do the precise time filter in JS to handle date+time properly.
    const today = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("id, user_id, reservation_date, reservation_time, guest_name, reminder_sent_at, status")
      .in("reservation_date", [today, tomorrow])
      .eq("status", "confirmed")
      .is("reminder_sent_at", null)
      .not("user_id", "is", null);

    if (error) throw error;
    if (!reservations?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT")!,
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    let sentCount = 0;
    for (const r of reservations) {
      const dt = new Date(`${r.reservation_date}T${r.reservation_time}`);
      if (dt < lo || dt > hi) continue;

      // Respect prefs
      const { data: profile } = await supabase
        .from("profiles")
        .select("notify_reservations")
        .eq("user_id", r.user_id!)
        .maybeSingle();
      if (profile && profile.notify_reservations === false) {
        await supabase.from("reservations").update({ reminder_sent_at: new Date().toISOString() }).eq("id", r.id);
        continue;
      }

      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", r.user_id!);

      if (subs?.length) {
        const payload = JSON.stringify({
          title: "⏰ Recordatorio de reserva",
          body: "¡Nos vemos en 30 minutos! 🍕",
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          url: "/mis-reservas",
          tag: `reservation-${r.id}`,
        });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
            );
            sentCount++;
          } catch (err: any) {
            if (err?.statusCode === 410 || err?.statusCode === 404) {
              await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            }
          }
        }
      }

      await supabase.from("reservations").update({ reminder_sent_at: new Date().toISOString() }).eq("id", r.id);
    }

    return new Response(JSON.stringify({ processed: reservations.length, sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("reservation-reminder-cron error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
