// POST /api/ai-similar  { listingId }
// KI-Bildersuche (Denis, 15.09.): das Bildmodell vergleicht das Titelbild eines
// Inserats mit Kandidaten aus dem Sortiment (gleiche Hauptkategorie zuerst) und
// liefert eine Rangliste aehnlicher Inserate. Nur eingeloggt (kostet pro Klick).
// Grenze: ein Bildaufruf pro Klick, Kandidaten auf 24 gedeckelt (12 mit Bild).
// Bei mehreren hundert Inseraten auf Bild-Tags beim Inserieren umstellen.

const MODEL = "anthropic/claude-haiku-4.5";
const MAX_KANDIDATEN = 24;
const MAX_MIT_BILD = 12;

async function rest(path) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`rest ${r.status}`);
  return r.json();
}
const cover = (l) => ((l.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url) || null;

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
  } catch { return Response.json({ error: "auth_failed" }, { status: 401 }); }

  let body; try { body = await req.json(); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }
  const id = String(body?.listingId || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "bad_id" }, { status: 400 });

  const SEL = "id,title,price,rent_price,rent_period,listing_type,category_id,status,expires_at,auction_end,buy_now_price,fee_percentage,created_at,view_count,user_id,listing_images(url,sort_order),category:categories(id,name,parent_id),seller:profiles!listings_user_id_fkey(id,display_name,avatar_url,account_type,company_name,avg_rating,rating_count,is_verified,id_verified,founder_number)";
  let ziel, alle;
  try {
    [ziel] = await rest(`listings?select=${SEL}&id=eq.${id}&limit=1`);
    if (!ziel) return Response.json({ error: "not_found" }, { status: 404 });
    alle = await rest(`listings?select=${SEL}&status=eq.active&id=neq.${id}&limit=400`);
  } catch { return Response.json({ error: "db_failed" }, { status: 502 }); }
  const zielBild = cover(ziel);
  if (!zielBild) return Response.json({ treffer: [], hinweis: "Dieses Inserat hat kein Foto zum Vergleichen." });

  // Kandidaten: gleiche Hauptkategorie zuerst (Elternkategorie oder Kategorie selbst)
  const hauptKat = (l) => l.category?.parent_id || l.category_id;
  const meineHaupt = hauptKat(ziel);
  const kandidaten = [...alle.filter(l => hauptKat(l) === meineHaupt), ...alle.filter(l => hauptKat(l) !== meineHaupt)].slice(0, MAX_KANDIDATEN);
  if (!kandidaten.length) return Response.json({ treffer: [], hinweis: "Dazu ist gerade nichts Ähnliches im Angebot." });

  const mitBild = kandidaten.slice(0, MAX_MIT_BILD).filter(l => cover(l));
  const nurTitel = kandidaten.filter(l => !mitBild.includes(l));
  const content = [
    { type: "text", text: `Artikelfoto des Ausgangs-Inserats "${ziel.title}":` },
    { type: "image_url", image_url: { url: zielBild } },
  ];
  mitBild.forEach((l, i) => {
    content.push({ type: "text", text: `Kandidat ${i + 1} (id ${l.id}): "${l.title}"` });
    content.push({ type: "image_url", image_url: { url: cover(l) } });
  });
  content.push({ type: "text", text: `Weitere Kandidaten nur mit Titel:
${nurTitel.map(l => `- id ${l.id}: "${l.title}"`).join("\n") || "(keine)"}

Aufgabe: Finde die Kandidaten, die dem Ausgangsartikel wirklich ähnlich sind (gleiche Art von Ding, gleiche Marke, gleicher Stil oder sinnvoller Ersatz). Beurteile Fotos, wo vorhanden, sonst den Titel.
Antworte NUR mit JSON, ohne Markdown:
{"treffer":[{"id":"...","grund":"Halbsatz wie 'gleiche Art: Pendelleuchte' oder 'gleiche Marke: IKEA'"}],"hinweis":null}
Maximal 6 Treffer, beste zuerst. Nur echte Ähnlichkeit aufnehmen, keine Verlegenheits-Treffer. Passt nichts: "treffer":[] und "hinweis":"Dazu ist gerade nichts Ähnliches im Angebot."` });

  let res;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://beedaro.ch", "X-Title": "BEEDARO" },
      body: JSON.stringify({ model: MODEL, max_tokens: 500, messages: [{ role: "user", content }] }),
      signal: AbortSignal.timeout(45000),
    });
  } catch { return Response.json({ error: "upstream_failed" }, { status: 502 }); }
  if (!res.ok) return Response.json({ error: "upstream_error", status: res.status }, { status: 502 });
  let text = "";
  try { text = (await res.json())?.choices?.[0]?.message?.content || ""; } catch { return Response.json({ error: "bad_upstream_json" }, { status: 502 }); }
  const m = text.match(/\{[\s\S]*\}/);
  let parsed; try { parsed = JSON.parse(m ? m[0] : "{}"); } catch { return Response.json({ error: "invalid_json" }, { status: 502 }); }

  const byId = new Map(kandidaten.map(l => [l.id, l]));
  const treffer = (Array.isArray(parsed.treffer) ? parsed.treffer : [])
    .filter(t => t && byId.has(t.id))
    .slice(0, 6)
    .map(t => {
      const l = byId.get(t.id);
      return { ...l, cover_image: cover(l), categoryName: l.category?.name || null, sellerName: l.seller?.display_name || "Benutzer", grund: typeof t.grund === "string" ? t.grund.slice(0, 80) : "" };
    });
  const hinweis = treffer.length ? null : (typeof parsed.hinweis === "string" && parsed.hinweis.trim() ? parsed.hinweis.trim().slice(0, 160) : "Dazu ist gerade nichts Ähnliches im Angebot.");
  return Response.json({ treffer, hinweis });
}
