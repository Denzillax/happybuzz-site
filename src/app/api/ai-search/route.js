// POST /api/ai-search
// KI-Suche (Beta-Feedback Tacocat 08.09.): bekommt eine Alltagsbeschreibung
// ("günstiges Rennvelo für den Sommer, max 300 Franken") und die
// Hauptkategorien, fragt über OpenRouter ein Textmodell und liefert
// Suchbegriffe + Filter als JSON. Key lebt NUR hier auf dem Server.
// Nur für eingeloggte Nutzer (kostet pro Aufruf), wie /api/ai-listing.

const MODEL = "anthropic/claude-haiku-4.5";

export async function POST(req) {
  const key = process.env.OPENROUTER_API_KEY || process.env.Openroute_Key;
  if (!key) return Response.json({ error: "not_configured" }, { status: 503 });

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const check = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!check.ok) return Response.json({ error: "unauthorized" }, { status: 401 });
  } catch {
    return Response.json({ error: "auth_failed" }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const frage = typeof body?.query === "string" ? body.query.trim().slice(0, 400) : "";
  if (!frage) return Response.json({ error: "empty_query" }, { status: 400 });
  const kats = Array.isArray(body?.categories)
    ? body.categories.filter(k => k && typeof k.id === "string" && typeof k.name === "string").slice(0, 30)
    : [];

  const prompt = `Du übersetzt eine Alltagsbeschreibung in eine Marktplatz-Suche für den Schweizer Secondhand-Marktplatz BEEDARO.
Beschreibung des Nutzers: "${frage}"

Verfügbare Hauptkategorien (id: name):
${kats.map(k => `${k.id}: ${k.name}`).join("\n")}

Angebotsarten: sell (Festpreis-Kauf), auction (Auktion), rent (Miete), free (gratis), service (Dienstleistung).

Antworte NUR mit einem JSON-Objekt, ohne Erklärtext und ohne Markdown:
{
  "q": "1-3 prägnante deutsche Suchbegriffe für die Volltextsuche (das Kernprodukt, keine Füllwörter, keine Preise)",
  "category_id": "passende id aus der Liste oder null",
  "listing_type": "sell | auction | rent | free | service oder null, nur wenn die Beschreibung es klar sagt (z.B. 'mieten' -> rent, 'geschenkt/gratis' -> free)",
  "min_price": Zahl oder null,
  "max_price": Zahl oder null
}
Preise nur setzen, wenn der Nutzer sie nennt ("unter 300" -> max_price 300, "ab 50" -> min_price 50, "günstig" allein ist KEIN Preis).
Wenn nichts Passendes: category_id null lassen statt raten.`;

  let res;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://beedaro.ch",
        "X-Title": "BEEDARO",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    return Response.json({ error: "upstream_failed" }, { status: 502 });
  }
  if (!res.ok) return Response.json({ error: "upstream_error", status: res.status }, { status: 502 });

  let text = "";
  try {
    const data = await res.json();
    text = data?.choices?.[0]?.message?.content || "";
  } catch {
    return Response.json({ error: "bad_upstream_json" }, { status: 502 });
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return Response.json({ error: "no_json" }, { status: 502 });
  let parsed;
  try { parsed = JSON.parse(match[0]); } catch {
    return Response.json({ error: "invalid_json" }, { status: 502 });
  }

  const TYPES = ["sell", "auction", "rent", "free", "service"];
  const katIds = new Set(kats.map(k => k.id));
  const num = (v) => (typeof v === "number" && isFinite(v) && v >= 0 ? v : null);
  return Response.json({
    q: typeof parsed.q === "string" ? parsed.q.trim().slice(0, 80) : "",
    category_id: katIds.has(parsed.category_id) ? parsed.category_id : null,
    listing_type: TYPES.includes(parsed.listing_type) ? parsed.listing_type : null,
    min_price: num(parsed.min_price),
    max_price: num(parsed.max_price),
  });
}
