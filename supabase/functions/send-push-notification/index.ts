// ════════════════════════════════════════════════════════════════
// MARFLOW · send-push-notification (modificada 2026-06-08)
// Web Push protocol: RFC 8030 + RFC 8291 (aes128gcm) + RFC 8292 (VAPID)
// Sin libraries externas — usa Web Crypto API nativo de Deno.
//
// CAMBIOS:
//   - Acepta user_id explícito en payload (cron lo envía siempre)
//   - Backward compat con "Probar" desde app (JWT user → usa su id)
//   - Auth dual: MARFLOW_CRON_SECRET o user JWT de Supabase
//   - Cross-check: user_id pertenece al admin_id declarado
//   - Envía a subscriptions del user_id (no broadcast por admin_id)
// ════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@marflow.app";
const MARFLOW_CRON_SECRET = Deno.env.get("MARFLOW_CRON_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Helpers base64url + bytes ──
function b64uToBytes(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - b64.length % 4) % 4;
  const padded = b64 + "=".repeat(pad);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64u(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function concat(...arrays: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const a of arrays) total += a.length;
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}

// ── HKDF (Extract + Expand) sobre Web Crypto API ──
async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return await crypto.subtle.sign("HMAC", key, ikm);
}
async function hkdfExpand(prk: ArrayBuffer, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const blocks = Math.ceil(length / 32);
  let t = new Uint8Array(0);
  let okm = new Uint8Array(0);
  for (let i = 1; i <= blocks; i++) {
    const input = concat(t, info, new Uint8Array([i]));
    t = new Uint8Array(await crypto.subtle.sign("HMAC", key, input));
    okm = concat(okm, t);
  }
  return okm.slice(0, length);
}

// ── VAPID JWT (ES256) ──
async function createVapidJWT(audience: string, subject: string): Promise<string> {
  const header = bytesToB64u(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64u(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })));
  const signingInput = `${header}.${payload}`;

  const publicBytes = b64uToBytes(VAPID_PUBLIC_KEY);
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: VAPID_PRIVATE_KEY,
    x: bytesToB64u(publicBytes.slice(1, 33)),
    y: bytesToB64u(publicBytes.slice(33, 65)),
    ext: true,
  };
  const privKey = await crypto.subtle.importKey(
    "jwk", jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privKey,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${bytesToB64u(new Uint8Array(signature))}`;
}

// ── Encriptar payload Web Push (aes128gcm — RFC 8291) ──
async function encryptPayload(
  payload: string,
  uaPublic: Uint8Array,
  authSecret: Uint8Array,
): Promise<{ body: Uint8Array }> {
  const asKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  );
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", asKeyPair.publicKey));

  const uaPubKey = await crypto.subtle.importKey(
    "raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaPubKey }, asKeyPair.privateKey, 256)
  );

  const prkKey = await hkdfExtract(authSecret, sharedSecret);
  const keyInfo = concat(
    new TextEncoder().encode("WebPush: info\0"),
    uaPublic, asPublic,
  );
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdfExtract(salt, ikm);
  const cek = await hkdfExpand(prk, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prk, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);

  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = concat(payloadBytes, new Uint8Array([0x02]));
  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, paddedPayload)
  );

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const body = concat(salt, rs, new Uint8Array([65]), asPublic, ciphertext);

  return { body };
}

// ── Enviar push a un endpoint ──
async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<Response> {
  const uaPublic = b64uToBytes(sub.p256dh);
  const authSecret = b64uToBytes(sub.auth);
  const { body } = await encryptPayload(payload, uaPublic, authSecret);

  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await createVapidJWT(audience, VAPID_SUBJECT);

  return await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
    },
    body,
  });
}

// ── Helper response JSON ──
function jsonResponse(status: number, body: any): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Servidor ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ═══ FASE 1: AUTENTICACIÓN ═══
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return jsonResponse(401, { error: "Missing Authorization header" });
    }

    let isCron = false;
    let userIdFromJWT: string | null = null;

    if (token === MARFLOW_CRON_SECRET) {
      // Cron: token preshared
      isCron = true;
    } else {
      // App: validar como user JWT con anon client
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
      if (authErr || !user) {
        return jsonResponse(401, { error: "Invalid token" });
      }
      userIdFromJWT = user.id;
    }

    // ═══ FASE 2: PARSE PAYLOAD ═══
    const body = await req.json();
    let { user_id, admin_id, title, body: msgBody, url, tag } = body;

    // Backward compat: si "Probar" no manda user_id, usar el JWT
    if (!user_id && userIdFromJWT) user_id = userIdFromJWT;
    if (!admin_id && userIdFromJWT) admin_id = userIdFromJWT;

    // Validaciones obligatorias
    if (!user_id) return jsonResponse(400, { error: "user_id es obligatorio" });
    if (!admin_id) return jsonResponse(400, { error: "admin_id es obligatorio" });
    if (!title) return jsonResponse(400, { error: "title es obligatorio" });

    // Cliente con service_role (para queries cross-tenant validadas)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ═══ FASE 3: CROSS-CHECK user_id ↔ admin_id ═══
    const { data: cuenta, error: errCuenta } = await supabase
      .from("cuentas")
      .select("id, admin_id, rol")
      .eq("id", user_id)
      .maybeSingle();

    if (errCuenta || !cuenta) {
      console.error("[send-push] user_id no existe", { user_id });
      return jsonResponse(403, { error: "user_id no existe en cuentas" });
    }

    const esAdminMismo       = cuenta.id === admin_id;
    const esAsistenteDeAdmin = cuenta.rol === "asistente" && cuenta.admin_id === admin_id;
    const esSuperadminPropio = cuenta.rol === "superadmin" && cuenta.id === admin_id;

    if (!esAdminMismo && !esAsistenteDeAdmin && !esSuperadminPropio) {
      console.error("[send-push] cross-check FAIL", { user_id, admin_id, cuenta_admin: cuenta.admin_id, cuenta_rol: cuenta.rol });
      return jsonResponse(403, { error: "user_id no pertenece al admin_id declarado" });
    }

    // ═══ FASE 4: SI VIENE DE JWT (no cron), AUTORIZAR QUE PUEDA NOTIFICAR ═══
    if (!isCron && userIdFromJWT !== user_id) {
      // Solo permitir notificar a self o a asistentes propios
      const { data: targetCuenta } = await supabase
        .from("cuentas")
        .select("admin_id, rol")
        .eq("id", user_id)
        .maybeSingle();

      const targetEsAsistentePropio =
        targetCuenta?.rol === "asistente" && targetCuenta?.admin_id === userIdFromJWT;

      if (!targetEsAsistentePropio) {
        return jsonResponse(403, { error: "JWT user no autorizado para notificar a este user_id" });
      }
    }

    // ═══ FASE 5: BUSCAR SUBSCRIPTIONS DEL user_id ═══
    const { data: subs, error: errSubs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (errSubs) throw errSubs;
    if (!subs || subs.length === 0) {
      return jsonResponse(200, { sent: 0, total: 0, message: "Sin suscripciones activas para este user" });
    }

    // ═══ FASE 6: ENVIAR PUSH ═══
    const payload = JSON.stringify({
      title,
      body: msgBody || "",
      url: url || "/",
      tag: tag || `marflow-${Date.now()}`,
    });

    const results = await Promise.allSettled(
      subs.map(async (s: any) => {
        const resp = await sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload);
        if (!resp.ok) {
          // Limpiar suscripciones inválidas (gone / not found)
          if (resp.status === 410 || resp.status === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id);
          }
          const text = await resp.text().catch(() => "");
          throw new Error(`Push ${resp.status}: ${text || resp.statusText}`);
        }
        return { ok: true, id: s.id };
      })
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;
    const errors = results.filter(r => r.status === "rejected")
      .map((r: any) => String(r.reason?.message || r.reason));

    return jsonResponse(200, { sent, failed, total: subs.length, errors });
  } catch (e: any) {
    console.error("[send-push-notification] error:", e?.message, e?.stack);
    return jsonResponse(500, {
      error: String(e?.message || e),
      stack: e?.stack ? String(e.stack).split("\n").slice(0, 6).join("\n") : null,
    });
  }
});
