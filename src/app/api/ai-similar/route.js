// POST /api/ai-similar  { listingId }
// KI-Bildersuche (Denis, 15.09.): "unmittelbar" wie bei Ricardo. Statt bei
// jedem Klick 13 Fotos ans Bildmodell zu schicken, hat jedes Inserat einmalig
// gespeicherte Bild-Merkmale (lib/server/imageTags); der Klick ist nur noch
// ein Merkmalsvergleich in der Datenbank (RPC similar_by_tags, < 100 ms).
// Fehlen dem Ausgangs-Inserat die Merkmale (Altbestand), werden sie beim
// ersten Klick einmalig nachgerechnet (dann dauert genau dieser Klick ~5 s).
import { ensureImageTags } from "@/lib/server/imageTags";

const SEL = "id,title,price,rent_price,rent_period,listing_type,category_id,status,expires_at,auction_end,buy_now_price,fee_percentage,created_at,view_count,user_id,condition,city,listing_images(url,sort_order),category:categories(id,name,parent_id),seller:profiles!listings_user_id_fkey(id,display_name,avatar_url,account_type,company_name,avg_rating,rating_count,is_verified,id_verified,founder_number)";
const cover = (l) => ((l.listing_images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url) || null;
const hdr = () => ({ apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`, "Content-Type": "application/json" });

export async function POST(req) {
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

  // 1) Merkmale des Ausgangs-Inserats (einmalig nachrechnen, falls noch keine)
  let tags;
  try { tags = await ensureImageTags(id, token); } catch (e) {
    return Response.json({ error: "tags_failed", detail: String(e?.message || "") }, { status: 502 });
  }
  if (tags === null) return Response.json({ error: "not_found" }, { status: 404 });
  if (!tags.length) return Response.json({ treffer: [], hinweis: "Dieses Inserat hat kein Foto zum Vergleichen." });

  // 2) Merkmalsvergleich in der Datenbank
  let hits;
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/similar_by_tags`, {
      method: "POST", headers: hdr(), body: JSON.stringify({ p_listing_id: id, p_limit: 6 }), signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`rpc ${r.status}`);
    hits = await r.json();
  } catch { return Response.json({ error: "db_failed" }, { status: 502 }); }
  // Mindestens 2 gemeinsame Merkmale, sonst ist es Zufall (Farbe allein reicht nicht)
  hits = (hits || []).filter(h => h.score >= 2);
  if (!hits.length) return Response.json({ treffer: [], hinweis: "Dazu ist gerade nichts Ähnliches im Angebot." });

  // 3) Vollstaendige Inserate fuer die Karten
  let rows;
  try {
    const ids = hits.map(h => h.id).join(",");
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?select=${SEL}&id=in.(${ids})`, { headers: hdr(), signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`rest ${r.status}`);
    rows = await r.json();
  } catch { return Response.json({ error: "db_failed" }, { status: 502 }); }
  const byId = new Map(rows.map(l => [l.id, l]));
  const treffer = hits.filter(h => byId.has(h.id)).map(h => {
    const l = byId.get(h.id);
    const gem = (h.gemeinsam || []).slice(0, 3).join(", ");
    return { ...l, cover_image: cover(l), categoryName: l.category?.name || null, sellerName: l.seller?.display_name || "Benutzer", grund: gem ? `Gemeinsam: ${gem}` : "" };
  });
  return Response.json({ treffer, hinweis: null });
}
