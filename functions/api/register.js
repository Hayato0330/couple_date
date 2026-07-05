import { sha256Hex, signToken, generateInviteCode } from "../_lib/auth.js";
import { ALL_MBTI_CODES } from "../_lib/mbti.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { nameA, mbtiA, nameB, mbtiB, pin } = body;

    if (!nameA || !nameB || !pin || pin.length < 4) {
      return json({ error: "名前とPIN(4文字以上)を入力してください。" }, 400);
    }
    const a = (mbtiA || "").toUpperCase();
    const b = (mbtiB || "").toUpperCase();
    if (!ALL_MBTI_CODES.includes(a) || !ALL_MBTI_CODES.includes(b)) {
      return json({ error: "MBTIタイプが不正です。" }, 400);
    }

    let id = generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const existing = await env.DB.prepare("SELECT id FROM couples WHERE id = ?").bind(id).first();
      if (!existing) break;
      id = generateInviteCode();
    }

    const pinHash = await sha256Hex(pin);
    await env.DB.prepare(
      `INSERT INTO couples (id, name_a, mbti_a, name_b, mbti_b, pin_hash) VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(id, nameA, a, nameB, b, pinHash)
      .run();

    const token = await signToken(id, env.SESSION_SECRET);
    return json({ coupleId: id, token });
  } catch (e) {
    return json({ error: "登録に失敗しました。", detail: String(e) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
