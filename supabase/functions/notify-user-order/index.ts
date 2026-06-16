import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OrderType = "pickup" | "delivery";

function buildMessage(status: string, orderType: OrderType): { title: string; body: string } | null {
  switch (status) {
    case "confirmed":
      return { title: "✅ Pedido confirmado", body: "Hemos recibido tu pedido. ¡Nos ponemos manos a la obra!" };
    case "preparing":
      return { title: "👨‍🍳 En preparación", body: "Estamos preparando tu pedido en el horno." };
    case "ready":
      if (orderType !== "pickup") return null;
      return { title: "🛍️ ¡Listo para recoger!", body: "Tu pedido te espera en el local." };
    case "out_for_delivery":
      if (orderType !== "delivery") return null;
      return { title: "🛵 En camino", body: "Nuestro repartidor ya está en camino." };
    case "delivered":
      return {
        title: orderType === "delivery" ? "🍕 ¡Pedido entregado!" : "🍕 ¡Pedido recogido!",
        body: "Buon appetito! Gracias por elegir Lo Zio.",
      };
    default:
      return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require service-role (DB trigger only)
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authHeader?.startsWith("Bearer ") || !serviceRoleKey || authHeader.replace("Bearer ", "") !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const record = payload.record;
    if (!record?.user_id) {
      return new Response(JSON.stringify({ skipped: "no_user_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const msg = buildMessage(record.status, record.order_type as OrderType);
    if (!msg) {
      return new Response(JSON.stringify({ skipped: "status_not_notified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // Respect user preference
    const { data: profile } = await supabase
      .from("profiles")
      .select("notify_orders")
      .eq("user_id", record.user_id)
      .maybeSingle();
    if (profile && profile.notify_orders === false) {
      return new Response(JSON.stringify({ skipped: "user_opted_out" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", record.user_id);

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT")!,
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const notif = JSON.stringify({
      title: msg.title,
      body: msg.body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      url: "/mis-pedidos",
      tag: `order-${record.id}`,
    });

    const results = await Promise.allSettled(
      subs.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            notif,
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
          throw err;
        }
      }),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return new Response(JSON.stringify({ sent, total: subs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-user-order error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
