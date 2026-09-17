// Automatische Inserat-Vorpruefung (Denis, 17.09.2026).
// Aufruf 1: vom Client direkt nach dem Einreichen (Nutzer-JWT, muss Besitzer sein).
// Aufruf 2: vom pg_cron alle 5 Minuten fuer Nachzuegler (Header x-review-token,
//           Wert liegt im Supabase-Vault als ai_review_token).
// Die Route holt Text + Bilder, fragt die KI und uebergibt das Ergebnis an
// die RPC auto_review_listing. Entschieden wird NUR dort (Regelsatz in der
// Spec). Der Client bekommt nie die Entscheidung zurueck, nur {ok:true}.
import { createClient } from "@supabase/supabase-js";

const MODEL = "anthropic/claude-haiku-4.5";
const TIMEOUT_MS = 25000;

const SYSTEM = `Du prüfst Inserate eines Schweizer Secondhand-Marktplatzes (Beedaro) vor der Freischaltung. Antworte NUR mit JSON, keine Erklärung.

BLOCKER (führen zur manuellen Prüfung), jeweils mit "code" und "grund" (ein kurzer deutscher Satz):
- verboten: Waffen, Munition, Tiere, Tabak, E-Zigaretten, Medikamente, Drogen, Erotik, Dokumente/Ausweise, offensichtlich gestohlene Ware
- faelschung: Replica, "Kopie", Luxusmarke zu einem Bruchteil des üblichen Preises
- betrug: Zahlung ausserhalb der Plattform verlangt (Vorkasse, Western Union, Krypto), Telefonnummer, WhatsApp, E-Mail-Adresse oder Link im Text
- bild_passt_nicht: Bilder zeigen etwas anderes als der Text beschreibt
- kein_echtes_foto: Stockfoto, Screenshot, Katalogbild, Text-Grafik statt Produktfoto
- preis_absurd: Preis, der zum Produkt unmöglich ist (z. B. iPhone 15 für CHF 1)

HINWEISE (Inserat darf live, Verkäufer bekommt einen Tipp), jeweils mit "code" und "tipp" (ein freundlicher deutscher Satz in Du-Form), optional "vorschlag":
- beschreibung_kurz: unter 30 Wörter
- foto_schwach: unscharf, sehr dunkel, stark abgeschnitten
- kategorie_passt_nicht: mit "vorschlag" der passenden Kategorie
- preis_auffaellig: deutlich über oder unter dem Üblichen für Secondhand
- titel_grossbuchstaben: Titel fast nur in Grossbuchstaben

Sei zurückhaltend mit Blockern: nur setzen, wenn du dir sicher bist. Normale Gebrauchsware (Möbel, Kleider, Elektronik, Spiele, Velos) ist erlaubt. Ein Preis ist nicht absurd, nur weil er günstig ist.

Format:
{"blocker":[{"code":"...","grund":"..."}],"hinweise":[{"code":"...","tipp":"...","vorschlag":"..."}]}`;

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

function klartext(html) {
  return String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }
  const listingId = String(body?.listing_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) return Response.json({ error: "listing_id" }, { status: 400 });

  const sb = admin();

  // ── Wer ruft? Cron (Vault-Token) oder der Besitzer (JWT) ──
  let cronAufruf = false;
  const token = req.headers.get("x-review-token");
  if (token) {
    const { data: secret } = await sb.rpc("worker_secret", { p_name: "ai_review_token" });
    if (!secret || secret !== token) return Response.json({ error: "unauthorized" }, { status: 401 });
    cronAufruf = true;
  }
  let userId = null;
  if (!cronAufruf) {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) return Response.json({ error: "unauthorized" }, { status: 401 });
    const check = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${jwt}` },
    });
    if (!check.ok) return Response.json({ error: "unauthorized" }, { status: 401 });
    userId = (await check.json())?.id || null;
  }

  // ── Schalter ──
  const { data: settings } = await sb.from("site_settings").select("auto_review_enabled").eq("id", 1).maybeSingle();
  if (settings && settings.auto_review_enabled === false) return Response.json({ ok: true, uebersprungen: "aus" });

  // ── Inserat ──
  const { data: l } = await sb.from("listings")
    .select("id, user_id, status, title, description, listing_type, price, start_price, buy_now_price, rent_price, rent_period, condition, category_id, listing_images(url, sort_order)")
    .eq("id", listingId).maybeSingle();
  if (!l) return Response.json({ error: "not_found" }, { status: 404 });
  if (userId && l.user_id !== userId) return Response.json({ error: "forbidden" }, { status: 403 });
  if (l.status !== "pending_review") return Response.json({ ok: true, uebersprungen: l.status });

  // Kategorie-Pfad (Kind -> Eltern)
  const { data: cats } = await sb.from("categories").select("id, name, parent_id");
  const pfad = [];
  let cur = (cats || []).find((c) => c.id === l.category_id);
  while (cur) { pfad.unshift(cur.name); cur = cur.parent_id ? (cats || []).find((c) => c.id === cur.parent_id) : null; }

  const bilder = (l.listing_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((i) => i.url).filter((u) => /^https?:\/\//.test(u)).slice(0, 4);
  const preis = l.listing_type === "auction" ? `Startpreis CHF ${l.start_price ?? "?"}${l.buy_now_price ? `, Sofortkauf CHF ${l.buy_now_price}` : ""}`
    : l.listing_type === "rent" ? `Miete CHF ${l.rent_price ?? "?"} pro ${l.rent_period || "Tag"}`
    : l.listing_type === "free" ? "Gratis"
    : `CHF ${l.price ?? "?"}`;
  const text = `Titel: ${l.title}\nTyp: ${l.listing_type}\nKategorie: ${pfad.join(" > ") || "unbekannt"}\nZustand: ${l.condition || "-"}\nPreis: ${preis}\n\nBeschreibung:\n${klartext(l.description).slice(0, 3000)}`;

  const key = process.env.OPENROUTER_API_KEY || process.env.Openroute_Key;
  if (!key) { await sb.rpc("auto_review_versuch", { p_listing: listingId }); return Response.json({ ok: true, fehler: "kein_key" }); }

  // ── KI ──
  const content = [{ type: "text", text }, ...bilder.map((u) => ({ type: "image_url", image_url: { url: u } }))];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let parsed = null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://beedaro.ch", "X-Title": "Beedaro Inserat-Pruefung" },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, temperature: 0, messages: [{ role: "system", content: SYSTEM }, { role: "user", content }] }),
    });
    if (res.ok) {
      const raw = (await res.json())?.choices?.[0]?.message?.content || "";
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
  } catch { parsed = null; } finally { clearTimeout(timer); }

  const gueltig = parsed && Array.isArray(parsed.blocker) && Array.isArray(parsed.hinweise);
  if (!gueltig) {
    await sb.rpc("auto_review_versuch", { p_listing: listingId });
    return Response.json({ ok: true, fehler: "ki" });
  }
  const ergebnis = {
    blocker: parsed.blocker.filter((b) => b && b.code).map((b) => ({ code: String(b.code).slice(0, 40), grund: String(b.grund || "").slice(0, 200) })).slice(0, 6),
    hinweise: parsed.hinweise.filter((h) => h && h.code).map((h) => ({ code: String(h.code).slice(0, 40), tipp: String(h.tipp || "").slice(0, 200), ...(h.vorschlag ? { vorschlag: String(h.vorschlag).slice(0, 80) } : {}) })).slice(0, 6),
    bilder_geprueft: bilder.length > 0,
    modell: MODEL,
    quelle: cronAufruf ? "cron" : "client",
  };
  const { data: entscheid, error } = await sb.rpc("auto_review_listing", { p_listing: listingId, p_ergebnis: ergebnis });
  if (error) return Response.json({ ok: false, error: "rpc" }, { status: 500 });
  // Bewusst keine Entscheidung an den Client: der liest den Status aus der DB
  return Response.json({ ok: true, ...(cronAufruf ? { entscheidung: entscheid?.entscheidung } : {}) });
}
