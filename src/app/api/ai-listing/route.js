// POST /api/ai-listing
// KI-Erkennung fuers Inserat-Formular: bekommt ein verkleinertes Foto
// (data-URL) und die Kategorienliste, fragt ueber OpenRouter ein Vision-Modell
// und liefert Titel/Beschreibung/Zustand/Kategorie/Preisspanne als JSON.
// Der OpenRouter-Key lebt NUR hier auf dem Server (OPENROUTER_API_KEY).
// Nur fuer eingeloggte Nutzer (Supabase-Token wird verifiziert) — die KI
// kostet pro Aufruf, anonym soll das niemand feuern koennen.

const MODEL = "anthropic/claude-haiku-4.5";
const MAX_IMAGE_CHARS = 2_000_000; // ~1.5 MB base64, Bild kommt clientseitig verkleinert

export async function POST(req) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  // Eingeloggt? Supabase-Access-Token gegen die Auth-API pruefen
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
  const { image, categories } = body || {};
  if (!image || typeof image !== "string" || !image.startsWith("data:image/") || image.length > MAX_IMAGE_CHARS) {
    return Response.json({ error: "bad_image" }, { status: 400 });
  }
  const slugs = Array.isArray(categories) ? categories.filter(s => typeof s === "string").slice(0, 40) : [];

  const prompt = `Du siehst das Foto eines Secondhand-Artikels für den Schweizer Marktplatz BEEDARO.
Antworte NUR mit einem JSON-Objekt, ohne Erklärtext und ohne Markdown:
{
  "title": "prägnanter Titel, max 60 Zeichen, mit Marke und Modell falls erkennbar",
  "description": "2 bis 3 sachliche Sätze auf Deutsch über den Artikel. Kein Werbedeutsch, keine Emojis, keine erfundenen Details.",
  "condition": "new | like_new | good | fair | poor",
  "category_slug": "genau einer aus dieser Liste: ${slugs.join(", ")}",
  "price_range_chf": [minimum, maximum]
}
Den Zustand aus sichtbaren Gebrauchsspuren schätzen, im Zweifel "good".
Die Preisspanne ist eine grobe Secondhand-Schätzung in Schweizer Franken.
Wenn du den Artikel nicht erkennst, beschreibe was sichtbar ist, statt zu raten.`;

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
        max_tokens: 500,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: image } },
            { type: "text", text: prompt },
          ],
        }],
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    return Response.json({ error: "upstream_failed" }, { status: 502 });
  }
  if (!res.ok) {
    return Response.json({ error: "upstream_error", status: res.status }, { status: 502 });
  }

  let text = "";
  try {
    const data = await res.json();
    text = data?.choices?.[0]?.message?.content || "";
  } catch {
    return Response.json({ error: "bad_upstream_json" }, { status: 502 });
  }

  // JSON aus der Antwort ziehen (Modelle packen gern ```json-Zaeune drumherum)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return Response.json({ error: "no_json" }, { status: 502 });
  let parsed;
  try { parsed = JSON.parse(match[0]); } catch {
    return Response.json({ error: "invalid_json" }, { status: 502 });
  }

  const CONDITIONS = ["new", "like_new", "good", "fair", "poor"];
  const out = {
    title: typeof parsed.title === "string" ? parsed.title.slice(0, 60) : "",
    description: typeof parsed.description === "string" ? parsed.description.slice(0, 1500) : "",
    condition: CONDITIONS.includes(parsed.condition) ? parsed.condition : "good",
    category_slug: slugs.includes(parsed.category_slug) ? parsed.category_slug : null,
    price_range_chf: Array.isArray(parsed.price_range_chf) && parsed.price_range_chf.length === 2
      && parsed.price_range_chf.every(n => typeof n === "number" && n >= 0)
      ? parsed.price_range_chf : null,
  };
  return Response.json(out);
}
