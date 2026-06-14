import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Verifies a Stripe payment with the Stripe API (source of truth) and marks
// the order paid via service role. Authorization: caller must own the order
// (matching user_id) OR the order must be a guest order (user_id null) created
// within the last hour. Additionally, the paymentIntent metadata.orderId must
// match — forging that requires actually paying through Stripe.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, paymentIntentId } = await req.json();
    if (
      !orderId || !paymentIntentId ||
      typeof orderId !== "string" || typeof paymentIntentId !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "orderId and paymentIntentId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) throw new Error("Stripe not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .select("id, user_id, created_at, pickup_store, assigned_to")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !orderRow) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization check.
    const authHeader = req.headers.get("Authorization");
    let callerUserId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: claims } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
      callerUserId = claims?.claims?.sub ?? null;
    }

    if (orderRow.user_id) {
      if (callerUserId !== orderRow.user_id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const ageMs = Date.now() - new Date(orderRow.created_at).getTime();
      if (ageMs > 60 * 60 * 1000) {
        return new Response(JSON.stringify({ error: "Order expired for confirmation" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.metadata?.orderId !== orderId) {
      console.warn("Payment intent metadata mismatch", { orderId, piId: paymentIntentId });
      return new Response(
        JSON.stringify({ error: "Payment intent does not match order" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (pi.status === "succeeded") {
      const fallback: "tarragona" | "arrabassada" =
        orderRow.pickup_store === "arrabassada" ? "arrabassada" : "tarragona";

      const { data: updated, error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          stripe_payment_intent_id: paymentIntentId,
          assigned_to: orderRow.assigned_to ?? fallback,
        })
        .eq("id", orderId)
        .select("*")
        .single();

      if (updateError) {
        console.error("Order update failed:", updateError);
        throw new Error("Failed to mark order as paid");
      }

      const { data: items } = await supabase
        .from("order_items").select("*").eq("order_id", orderId);

      return new Response(
        JSON.stringify({ success: true, order: updated, items: items ?? [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (pi.status === "canceled" || pi.status === "requires_payment_method") {
      await supabase.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
      return new Response(
        JSON.stringify({ success: false, error: "payment_failed", status: pi.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: false, status: pi.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in confirm-stripe-payment:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: "Payment confirmation failed." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
