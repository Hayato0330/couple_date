// Lightweight auth helpers using Web Crypto (available in Cloudflare Workers runtime).

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return toHex(buf);
}

export async function signToken(coupleId, secret) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(coupleId));
  return `${coupleId}.${toHex(sig)}`;
}

export async function verifyToken(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [coupleId, sig] = token.split(".");
  const expected = await signToken(coupleId, secret);
  return expected === token ? coupleId : null;
}

export function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) code += chars[b % chars.length];
  return code;
}

export async function requireAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const coupleId = await verifyToken(token, env.SESSION_SECRET);
  return coupleId;
}
