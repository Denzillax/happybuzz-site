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
  // Beide Namen akzeptieren: OPENROUTER_API_KEY (Standard) und Openroute_Key
  // (so heisst die Variable in Vercel)
  const key = process.env.OPENROUTER_API_KEY || process.env.Openroute_Key;
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
  const { image, categories, field, previous } = body || {};
  if (!image || typeof image !== "string" || !image.startsWith("data:image/") || image.length > MAX_IMAGE_CHARS) {
    return Response.json({ error: "bad_image" }, { status: 400 });
  }
  const slugs = Array.isArray(categories) ? categories.filter(s => typeof s === "string").slice(0, 40) : [];
  // Optional: gezielt eine NEUE Variante fuer ein Feld (KI-Titel/KI-Text-Knopf)
  const wantField = field === "title" || field === "description" ? field : null;
  const prevText = typeof previous === "string" ? previous.slice(0, 600) : "";

  const prompt = `Du bist ein kritischer Secondhand-Gutachter für den Schweizer Marktplatz BEEDARO und siehst das Foto eines Artikels.
Antworte NUR mit einem JSON-Objekt, ohne Erklärtext und ohne Markdown:
{
  "title": "prägnanter Titel, max 60 Zeichen, mit Marke und Modell falls erkennbar",
  "description": "strukturiertes Mini-HTML, siehe Formatvorgabe unten",
  "condition": "new | like_new | good | fair | poor",
  "category_slug": "genau einer aus dieser Liste: ${slugs.join(", ")}",
  "price_range_chf": [minimum, maximum]
}
Formatvorgabe für "description" (sachliches Deutsch in Schweizer Rechtschreibung, ss statt ß; kein Werbedeutsch, keine Emojis):
Mini-HTML mit genau dieser Struktur und NUR den Tags p, h3, ul, li, b, br:
<p>1 bis 2 Sätze, was der Artikel ist.</p>
<h3>Zustand</h3><p>Sichtbare Mängel und Gebrauchsspuren konkret benennen (was und wo).</p>
<h3>Lieferumfang</h3><ul><li>je ein sichtbares Teil pro Punkt</li></ul>
Kein Markdown, keine Attribute in den Tags, keine anderen Tags.

Eiserne Regel: Erwähne NUR, was auf dem Foto tatsächlich zu sehen ist.
Kein Zubehör, keine Kabel, keine Spiele/Module, keine Originalverpackung und keine
Funktionsfähigkeit behaupten, wenn das Bild sie nicht eindeutig zeigt. Lieber weglassen als raten.
Zähle den Lieferumfang exakt so, wie er im Bild liegt (z.B. wie viele Controller sichtbar sind).

Zustand streng nach sichtbaren Mängeln bewerten, nicht wohlwollend:
- new: originalverpackt/unbenutzt, like_new: praktisch makellos.
- good: nur leichte, normale Gebrauchsspuren.
- fair: deutliche Spuren wie Vergilbung, abgeriebene oder verschmierte Aufdrucke/Schriftzüge, Kratzer, Flecken, verblasste Stellen.
- poor: beschädigt oder stark abgenutzt.
Sobald ein deutlicher Mangel sichtbar ist (z.B. vergilbtes Plastik, unleserlicher Schriftzug), höchstens "fair".
Benenne jeden sichtbaren Mangel konkret in der description (was und wo).

Die Preisspanne ist eine grobe Secondhand-Schätzung in Schweizer Franken, passend zum Zustand.
Wenn du den Artikel nicht erkennst, beschreibe was sichtbar ist, statt zu raten.${wantField ? `

Der Nutzer möchte eine NEUE Variante für das Feld "${wantField === "title" ? "title" : "description"}".
Formuliere sie deutlich anders als die bisherige Version (anderer Satzbau, andere Wortwahl), inhaltlich weiterhin nur was sichtbar ist.${prevText ? `
Bisherige Version: ${prevText}` : ""}` : ""}`;

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
        max_tokens: 900,
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
    description: typeof parsed.description === "string" ? parsed.description.slice(0, 2500) : "",
    condition: CONDITIONS.includes(parsed.condition) ? parsed.condition : "good",
    category_slug: slugs.includes(parsed.category_slug) ? parsed.category_slug : null,
    price_range_chf: Array.isArray(parsed.price_range_chf) && parsed.price_range_chf.length === 2
      && parsed.price_range_chf.every(n => typeof n === "number" && n >= 0)
      ? parsed.price_range_chf : null,
  };
  return Response.json(out);
}
