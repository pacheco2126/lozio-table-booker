import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { location, guest_name, phone, reservation_date, reservation_time, guests, notes, user_id } = await req.json();

    if (!location || !guest_name || !phone || !reservation_date || !reservation_time || !guests) {
      throw new Error("Missing required fields");
    }

    const guestsNum = parseInt(guests) || 2;
    if (guestsNum < 1 || guestsNum > 6) {
      throw new Error("El número de comensales debe ser entre 1 y 6 para reservas online.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find available table using the DB function
    const { data: tableId, error: rpcError } = await supabase.rpc("find_available_table", {
      _location: location,
      _date: reservation_date,
      _time: reservation_time,
      _guests: guestsNum,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      throw new Error("Error checking table availability");
    }

    if (!tableId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "no_tables",
          message: "Lo sentimos, no hay mesas disponibles para ese horario. Por favor elige otro horario o llámanos directamente.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get table name for the confirmation message
    const { data: tableData } = await supabase
      .from("tables")
      .select("name")
      .eq("id", tableId)
      .single();

    const tableName = tableData?.name || "asignada";

    // Create reservation with auto-assigned table, already confirmed
    const { data: reservation, error: insertError } = await supabase
      .from("reservations")
      .insert({
        location,
        guest_name,
        email: "online@reserva.lozio",
        phone,
        reservation_date,
        reservation_time,
        guests: String(guestsNum),
        notes: notes || null,
        user_id: user_id || null,
        table_id: tableId,
        status: "confirmed",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Error creating reservation");
    }

    // Notify owner via WhatsApp (non-blocking)
    try {
      const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
      const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID");
      const OWNER_WHATSAPP = Deno.env.get("OWNER_WHATSAPP");

      if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID && OWNER_WHATSAPP) {
        const dateParts = reservation_date.split("-");
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        const formattedTime = reservation_time.substring(0, 5);
        const cleanPhone = OWNER_WHATSAPP.replace(/[\s\-()]/g, "");

        const message =
          `🍕 *Nueva reserva CONFIRMADA en Lo Zio*\n\n` +
          `👤 Nombre: ${guest_name}\n` +
          `📞 Teléfono: ${phone}\n` +
          `👥 Personas: ${guestsNum}\n` +
          `📅 Fecha: ${formattedDate}\n` +
          `🕐 Hora: ${formattedTime}\n` +
          `🪑 Mesa: ${tableName}\n` +
          `📍 Local: ${location}${notes ? `\n📝 Notas: ${notes}` : ""}`;

        await fetch(
          `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanPhone,
              type: "text",
              text: { body: message },
            }),
          }
        );
      }
    } catch (whatsappError) {
      console.error("WhatsApp notification failed (non-blocking):", whatsappError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        reservation_id: reservation.id,
        table_name: tableName,
        message: `¡Reserva confirmada! Te esperamos el ${reservation_date} a las ${reservation_time.substring(0, 5)} en la ${tableName}.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in auto-assign-reservation:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: "server_error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
