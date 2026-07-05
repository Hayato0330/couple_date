-- Cloudflare D1 schema for couple_date app

CREATE TABLE IF NOT EXISTS couples (
  id TEXT PRIMARY KEY,          -- short invite code, e.g. "AB12CD"
  name_a TEXT NOT NULL,
  mbti_a TEXT NOT NULL,
  name_b TEXT NOT NULL,
  mbti_b TEXT NOT NULL,
  pin_hash TEXT NOT NULL,       -- sha256 of pin
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  couple_id TEXT NOT NULL REFERENCES couples(id),
  mbti_pair TEXT NOT NULL,      -- normalized "INFP_ENTJ" (sorted)
  category TEXT,
  title TEXT NOT NULL,
  description TEXT,
  raw_json TEXT NOT NULL,       -- full suggestion object from AI
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  suggestion_id TEXT NOT NULL REFERENCES suggestions(id),
  couple_id TEXT NOT NULL REFERENCES couples(id),
  mbti_pair TEXT NOT NULL,
  category TEXT,
  rating INTEGER NOT NULL,      -- 1 (bad) .. 5 (loved it)
  did_it INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_suggestions_couple ON suggestions(couple_id);
CREATE INDEX IF NOT EXISTS idx_feedback_pair ON feedback(mbti_pair);
CREATE INDEX IF NOT EXISTS idx_feedback_couple ON feedback(couple_id);
