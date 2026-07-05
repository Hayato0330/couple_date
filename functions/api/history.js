import { requireAuth } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const coupleId = await requireAuth(request, env);
  if (!coupleId) return json({ error: "ログインが必要です。" }, 401);

  const rows = await env.DB.prepare(
    `SELECT s.id, s.title, s.category, s.description, s.created_at,
            f.rating, f.did_it, f.comment
     FROM suggestions s
     LEFT JOIN feedback f ON f.suggestion_id = s.id
     WHERE s.couple_id = ?
     ORDER BY s.created_at DESC
     LIMIT 50`
  )
    .bind(coupleId)
    .all();

  return json({ history: rows.results });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
