import { requireAuth } from "../_lib/auth.js";
import { describeType, getCompatibilityNote, normalizePair } from "../_lib/mbti.js";

export async function onRequestPost({ request, env }) {
  const coupleId = await requireAuth(request, env);
  if (!coupleId) return json({ error: "ログインが必要です。" }, 401);

  const couple = await env.DB.prepare("SELECT * FROM couples WHERE id = ?").bind(coupleId).first();
  if (!couple) return json({ error: "カップル情報が見つかりません。" }, 404);

  const body = await request.json().catch(() => ({}));
  const { mood = "", budget = "", area = "", freeText = "" } = body;

  const mbtiPair = normalizePair(couple.mbti_a, couple.mbti_b);

  // 1. own history: what this couple liked / disliked before
  const ownHistory = await env.DB.prepare(
    `SELECT s.title, s.category, f.rating, f.did_it, f.comment
     FROM feedback f JOIN suggestions s ON s.id = f.suggestion_id
     WHERE f.couple_id = ? ORDER BY f.created_at DESC LIMIT 20`
  )
    .bind(coupleId)
    .all();

  const liked = ownHistory.results.filter((r) => r.rating >= 4).map((r) => `${r.title}(${r.category || "その他"})`);
  const disliked = ownHistory.results.filter((r) => r.rating <= 2).map((r) => `${r.title}(${r.category || "その他"})`);

  // 2. other couples with the same MBTI pair: aggregate what worked well
  const peerStats = await env.DB.prepare(
    `SELECT s.title, s.category, AVG(f.rating) as avg_rating, COUNT(*) as n, SUM(f.did_it) as done_count
     FROM feedback f JOIN suggestions s ON s.id = f.suggestion_id
     WHERE f.mbti_pair = ? AND f.couple_id != ?
     GROUP BY s.title, s.category
     HAVING avg_rating >= 3.5
     ORDER BY avg_rating DESC, n DESC
     LIMIT 10`
  )
    .bind(mbtiPair, coupleId)
    .all();

  const peerHighlights = peerStats.results.map(
    (r) => `${r.title}(${r.category || "その他"}) 平均評価${Number(r.avg_rating).toFixed(1)}/5, 実行数${r.done_count || 0}`
  );

  const compatibilityNote = getCompatibilityNote(couple.mbti_a, couple.mbti_b);

  const prompt = buildPrompt({
    nameA: couple.name_a,
    mbtiA: couple.mbti_a,
    nameB: couple.name_b,
    mbtiB: couple.mbti_b,
    compatibilityNote,
    liked,
    disliked,
    peerHighlights,
    mood,
    budget,
    area,
    freeText,
  });

  let suggestions;
  try {
    suggestions = await callGemini(env.GEMINI_API_KEY, prompt);
  } catch (e) {
    return json({ error: "AIの呼び出しに失敗しました。", detail: String(e) }, 502);
  }

  // persist suggestions, return with ids so the client can send feedback later
  const saved = [];
  for (const s of suggestions) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO suggestions (id, couple_id, mbti_pair, category, title, description, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, coupleId, mbtiPair, s.category || null, s.title, s.description || "", JSON.stringify(s))
      .run();
    saved.push({ id, ...s });
  }

  return json({ suggestions: saved });
}

function buildPrompt({ nameA, mbtiA, nameB, mbtiB, compatibilityNote, liked, disliked, peerHighlights, mood, budget, area, freeText }) {
  return `あなたはカップル向けのデートプランナーです。以下の情報をもとに、2人にぴったりのデート・一緒に楽しめるアクティビティを4つ提案してください。

# カップル情報
- ${nameA}: ${describeType(mbtiA)}
- ${nameB}: ${describeType(mbtiB)}
- 相性メモ: ${compatibilityNote || "情報なし"}

# このカップルが過去に高評価だった提案
${liked.length ? liked.join(", ") : "(まだ履歴なし)"}

# このカップルが過去に低評価だった提案(避けること)
${disliked.length ? disliked.join(", ") : "(まだ履歴なし)"}

# 同じMBTIの組み合わせの他カップルで評価が高かった実績
${peerHighlights.length ? peerHighlights.join("\n") : "(データなし)"}

# 今回の条件
- 気分・要望: ${mood || "指定なし"}
- 予算感: ${budget || "指定なし"}
- エリア: ${area || "指定なし"}
- 自由記述: ${freeText || "なし"}

# 出力ルール
- 低評価だった提案と似た内容は避けてください。
- 高評価だった提案の傾向や、他カップルの実績も参考にしてください。
- 必ず次のJSON配列の形式のみで出力してください。説明文やコードブロック記号は不要です。
[
  {
    "title": "string (短いタイトル)",
    "category": "string (例: アウトドア/カフェ/おうちデート/学び/アート/アクティブ など)",
    "description": "string (2〜3文の具体的な提案内容)",
    "whyItFits": "string (このカップルのMBTIになぜ合うかの理由)",
    "estimatedCost": "string (例: 3000円〜5000円)",
    "duration": "string (例: 半日/1〜2時間)"
  }
]`;
}

async function callGemini(apiKey, prompt) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini API returned no content");

  const cleaned = text.trim().replace(/^```json\s*|```$/g, "");
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Unexpected Gemini response shape");
  return parsed;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
