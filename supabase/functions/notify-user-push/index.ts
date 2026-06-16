import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushBody {
  user_id?: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  kind?: "orders" | "reservations" | "other";
  test?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === serviceRoleKey;

    const body = (await req.json()) as PushBody;

    // Resolve target user_id
    let targetUserId = body.user_id;
    if (!isServiceRole) {
      // User JWT path: force target = self (test only)
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims } = await authClient.auth.getClaims(token);
      const uid = claims?.claims?.sub;
      if (!uid) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = uid;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Respect user preferences
    if (body.kind === "orders" || body.kind === "reservations") {
      const { data: profile } = await admin
        .from("profiles")
        .select("notify_orders, notify_reservations")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (profile) {
        if (body.kind === "orders" && profile.notify_orders === false) {
          return new Response(JSON.stringify({ sent: 0, reason: "user_opted_out" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (body.kind === "reservations" && profile.notify_reservations === false) {
          return new Response(JSON.stringify({ sent: 0, reason: "user_opted_out" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", targetUserId);

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

    const payload = JSON.stringify({
      title: body.title,
      body: body.body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      url: body.url ?? "/",
      tag: body.tag,
    });

    const results = await Promise.allSettled(
      subs.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
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
    console.error("notify-user-push error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
