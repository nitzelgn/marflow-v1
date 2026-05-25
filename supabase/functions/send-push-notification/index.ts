// ════════════════════════════════════════════════════════════════
// MARFLOW · Edge Function: send-push-notification
// Recibe { admin_id, title, body, url } y envía Web Push a todas
// las suscripciones registradas para ese admin.
// ════════════════════════════════════════════════════════════════
//
// Despliegue:
//   1. Set secrets:
//      supabase secrets set VAPID_PUBLIC_KEY="..." VAPID_PRIVATE_KEY="..." VAPID_SUBJECT="mailto:marianagnava@hotmail.com"
//   2. Deploy:
//      supabase functions deploy send-push-notification --no-verify-jwt
// ════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@marflow.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin_id, title, body, url } = await req.json();

    if (!admin_id || !title) {
      return new Response(JSON.stringify({ error: "admin_id y title son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Cliente con service role (puede leer todas las suscripciones)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Trae todas las suscripciones del admin (y sus asistentes)
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("admin_id", admin_id);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, msg: "Sin suscripciones activas." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = JSON.stringify({
      title,
      body: body || "",
      url: url || "/",
      tag: `marflow-${Date.now()}`,
    });

    const results = await Promise.allSettled(
      subs.map((s: any) => {
        const subscription = {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        };
        return webpush.sendNotification(subscription, payload)
          .then(() => ({ ok: true, id: s.id }))
          .catch(async (err: any) => {
            // Si la suscripción ya no es válida (410 Gone / 404), la borramos
            if (err?.statusCode === 410 || err?.statusCode === 404) {
              await supabase.from("push_subscriptions").delete().eq("id", s.id);
            }
            throw err;
          });
      })
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return new Response(JSON.stringify({ sent, failed, total: subs.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
