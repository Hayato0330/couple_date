import { sha256Hex, signToken } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const { coupleId, pin } = await request.json();
    if (!coupleId || !pin) return json({ error: "招待コードとPINを入力してください。" }, 400);

    const row = await env.DB.prepare("SELECT * FROM couples WHERE id = ?").bind(coupleId.toUpperCase()).first();
    if (!row) return json({ error: "招待コードが見つかりません。" }, 404);

    const pinHash = await sha256Hex(pin);
    if (pinHash !== row.pin_hash) return json({ error: "PINが違います。" }, 401);

    const token = await signToken(row.id, env.SESSION_SECRET);
    return json({
      token,
      couple: {
        id: row.id,
        nameA: row.name_a,
        mbtiA: row.mbti_a,
        nameB: row.name_b,
        mbtiB: row.mbti_b,
      },
    });
  } catch (e) {
    return json({ error: "ログインに失敗しました。", detail: String(e) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
