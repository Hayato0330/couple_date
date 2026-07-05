export async function onRequestGet({ env }) {
  const key = env.GEMINI_API_KEY || "";
  return new Response(
    JSON.stringify({
      length: key.length,
      prefix: key.slice(0, 6),
      suffix: key.slice(-4),
      hasWhitespace: /\s/.test(key),
      hasQuotes: /["']/.test(key),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
