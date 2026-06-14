import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Refund an order's Stripe payment. Caller must be an admin (admin role) OR a
// service-role caller (e.g. the auto-cancel-stale-orders edge function).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const admin = createClient(supabaseUrl, serviceRoleKey);

    if (!isServiceRole) {
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims, error: claimsErr } = await authClient.auth.getClaims(token);
      if (claimsErr || !claims?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await admin.rpc("has_role", {
        _user_id: claims.claims.sub, _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) throw new Error("Stripe not configured");

    const body = await req.json().catch(() => ({}));
    const orderId = body?.orderId ?? body?.order_id;
    if (!orderId || typeof orderId !== "string") {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, payment_status, stripe_payment_intent_id, total_amount")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.payment_status !== "paid" || !order.stripe_payment_intent_id) {
      return new Response(JSON.stringify({ error: "Order not eligible for refund" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    });

    await admin.from("orders").update({ payment_status: "refunded" }).eq("id", orderId);

    return new Response(JSON.stringify({ success: true, refundId: refund.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in refund-order:", msg);
    return new Response(JSON.stringify({ error: "Refund failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
