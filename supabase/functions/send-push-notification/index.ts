// ════════════════════════════════════════════════════════════════
// MARFLOW · send-push-notification (implementación NATIVA Deno)
// Web Push protocol: RFC 8030 + RFC 8291 (aes128gcm) + RFC 8292 (VAPID)
// Sin libraries externas — usa Web Crypto API nativo de Deno.
// ════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@marflow.app";

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

  // Importar private key como JWK (ECDSA P-256). x,y vienen de la pública.
  const publicBytes = b64uToBytes(VAPID_PUBLIC_KEY); // 65 bytes: 0x04 || X(32) || Y(32)
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
  uaPublic: Uint8Array,   // p256dh del subscriber (65 bytes)
  authSecret: Uint8Array, // auth del subscriber (16 bytes)
): Promise<{ body: Uint8Array }> {
  // 1. Generar ECDH keypair efímero (AS = application server)
  const asKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  );
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", asKeyPair.publicKey));

  // 2. Importar UA public key
  const uaPubKey = await crypto.subtle.importKey(
    "raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  // 3. ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaPubKey }, asKeyPair.privateKey, 256)
  );

  // 4. HKDF: IKM = HKDF-Expand(HKDF-Extract(auth, shared), keyInfo, 32)
  const prkKey = await hkdfExtract(authSecret, sharedSecret);
  const keyInfo = concat(
    new TextEncoder().encode("WebPush: info\0"),
    uaPublic, asPublic,
  );
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  // 5. Salt aleatorio + HKDF para CEK y NONCE
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdfExtract(salt, ikm);
  const cek = await hkdfExpand(prk, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prk, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);

  // 6. AES-128-GCM encrypt (payload || 0x02 padding delimiter)
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = concat(payloadBytes, new Uint8Array([0x02]));
  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, paddedPayload)
  );

  // 7. Body: salt(16) | rs(4 BE, = 4096) | idlen(1) | keyid(asPublic, 65) | ciphertext
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

// ── Servidor ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { admin_id, title, body, url } = await req.json();
    if (!admin_id || !title) {
      return new Response(JSON.stringify({ error: "admin_id y title son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("admin_id", admin_id);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, msg: "Sin suscripciones." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = JSON.stringify({
      title, body: body || "", url: url || "/",
      tag: `marflow-${Date.now()}`,
    });

    const results = await Promise.allSettled(
      subs.map(async (s: any) => {
        const resp = await sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload);
        if (!resp.ok) {
          // Limpiar suscripciones inválidas
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

    return new Response(JSON.stringify({ sent, failed, total: subs.length, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("[send-push-notification] error:", e?.message, e?.stack);
    return new Response(JSON.stringify({
      error: String(e?.message || e),
      stack: e?.stack ? String(e.stack).split("\n").slice(0, 6).join("\n") : null,
    }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
