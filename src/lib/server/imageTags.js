// Bild-Merkmale fuer die Bildersuche (Denis, 15.09.). Server-only (OpenRouter-
// Key). Ein Bildaufruf pro Inserat, danach ist "Aehnlich per Bild" nur noch
// ein Merkmalsvergleich in der Datenbank (RPC similar_by_tags).
//
// Merkmale sind feste Slots in Kleinbuchstaben, damit sich Inserate ueberhaupt
// ueberschneiden koennen: art, kategorie, marke, farbe, material, stil, epoche,
// nutzung. Beispiel Game Boy: ["handheld-konsole","videospiele","nintendo",
// "grau","kunststoff","retro","90er","gaming"].

const MODEL = "anthropic/claude-haiku-4.5";
const SUPA = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const TAG_PROMPT = `Du beschreibst einen Secondhand-Artikel fuer eine Merkmals-Suche. Antworte NUR mit JSON ohne Markdown:
{"tags":["...", "..."]}
Regeln: 8 bis 12 Merkmale, alles Kleinbuchstaben, Deutsch, Singular, ohne Fuellwoerter, Mehrwortbegriffe mit Bindestrich.
Feste Reihenfolge der Slots (jeder genau einmal, falls erkennbar):
1. art des dings (praezise, z.B. "handheld-konsole", "esszimmerstuhl", "pendelleuchte", "rennvelo")
2. oberkategorie (z.B. "videospiele", "moebel", "leuchte", "velo")
3. marke oder hersteller (z.B. "nintendo", "ikea", "micasa"; "unbekannt" weglassen)
4. hauptfarbe (z.B. "grau", "schwarz", "holzfarben")
5. material (z.B. "kunststoff", "holz", "metall", "stoff", "bambus")
6. stil (z.B. "retro", "modern", "skandinavisch", "industrial", "klassisch")
7. epoche oder zielgruppe (z.B. "90er", "vintage", "kinder", "neuware")
8. nutzung oder raum (z.B. "gaming", "esszimmer", "wohnzimmer", "sport", "garten")
Danach optional bis zu 4 weitere treffende Merkmale (z.B. "set", "vierteilig", "tragbar", "faltbar").
Nur was auf dem Foto und im Titel wirklich erkennbar ist.`;

function normTags(arr) {
  const out = [];
  for (const t of Array.isArray(arr) ? arr : []) {
    if (typeof t !== "string") continue;
    const v = t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9äöüß\-]/g, "").slice(0, 40);
    if (v && v !== "unbekannt" && !out.includes(v)) out.push(v);
    if (out.length >= 12) break;
  }
  return out;
}

// Merkmale vom Bildmodell holen (Titel hilft bei schwer erkennbaren Fotos).
export async function computeImageTags({ imageUrl, title }) {
  const key = process.env.OPENROUTER_API_KEY || process.env.Openroute_Key;
  if (!key) throw new Error("not_configured");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://beedaro.ch", "X-Title": "BEEDARO" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 200,
      messages: [{ role: "user", content: [
        { type: "image_url", image_url: { url: imageUrl } },
        { type: "text", text: `Titel des Inserats: "${String(title || "").slice(0, 120)}"\n\n${TAG_PROMPT}` },
      ] }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const text = (await res.json())?.choices?.[0]?.message?.content || "";
  const m = text.match(/\{[\s\S]*\}/);
  let parsed = {}; try { parsed = JSON.parse(m ? m[0] : "{}"); } catch {}
  return normTags(parsed.tags);
}

// Inserat laden (Titel + Titelbild) ueber PostgREST mit dem Anon-Key.
export async function loadListingForTags(listingId) {
  const r = await fetch(`${SUPA()}/rest/v1/listings?select=id,title,image_tags,listing_images(url,sort_order)&id=eq.${listingId}&limit=1`, {
    headers: { apikey: ANON(), Authorization: `Bearer ${ANON()}` }, signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`rest ${r.status}`);
  const [l] = await r.json();
  if (!l) return null;
  const cover = (l.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url || null;
  return { id: l.id, title: l.title, tags: l.image_tags, cover };
}

// Merkmale mit dem Token des Nutzers speichern (RPC set_image_tags prueft
// Eigentuemer/Staff bzw. write-once fuer Altbestand).
export async function storeImageTags(listingId, tags, userToken) {
  const r = await fetch(`${SUPA()}/rest/v1/rpc/set_image_tags`, {
    method: "POST",
    headers: { apikey: ANON(), Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_listing_id: listingId, p_tags: tags }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`rpc ${r.status}`);
  return tags;
}

// Komplett: laden, rechnen, speichern. Gibt die Merkmale zurueck (oder [] ohne Foto).
export async function ensureImageTags(listingId, userToken, { force = false } = {}) {
  const l = await loadListingForTags(listingId);
  if (!l) return null;
  if (!force && Array.isArray(l.tags) && l.tags.length) return l.tags;
  if (!l.cover) return [];
  const tags = await computeImageTags({ imageUrl: l.cover, title: l.title });
  if (tags.length) await storeImageTags(listingId, tags, userToken);
  return tags;
}
