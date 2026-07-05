import { requireAuth } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const coupleId = await requireAuth(request, env);
  if (!coupleId) return json({ error: "ログインが必要です。" }, 401);

  const { suggestionId, rating, didIt = false, comment = "" } = await request.json().catch(() => ({}));
  if (!suggestionId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: "suggestionIdと1〜5のratingが必要です。" }, 400);
  }

  const suggestion = await env.DB.prepare("SELECT * FROM suggestions WHERE id = ? AND couple_id = ?")
    .bind(suggestionId, coupleId)
    .first();
  if (!suggestion) return json({ error: "対象の提案が見つかりません。" }, 404);

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO feedback (id, suggestion_id, couple_id, mbti_pair, category, rating, did_it, comment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, suggestionId, coupleId, suggestion.mbti_pair, suggestion.category, rating, didIt ? 1 : 0, comment)
    .run();

  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
