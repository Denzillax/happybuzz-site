// POST /api/import-listing  { url }
// Holt die Inseratseite serverseitig (Browser kann nicht: CORS) und gibt die
// extrahierten Felder zurück. Nur die vier Import-Plattformen sind erlaubt —
// alles andere ablehnen, sonst ist das ein offener Proxy (SSRF).
import { detectSource, parseListingHtml } from "@/lib/importListing";

const FETCH_HEADERS = {
  // Realistische Browser-Headers: einige Plattformen liefern an nackte
  // fetch()-UAs nur Bot-Challenges aus.
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-CH,de;q=0.9,en;q=0.6",
};

export async function POST(req) {
  let url;
  try { ({ url } = await req.json()); } catch { /* leer */ }
  const source = detectSource(url);
  if (!source) {
    return Response.json({ error: "unsupported_source" }, { status: 400 });
  }

  let res;
  try {
    res = await fetch(url, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return Response.json({ error: "blocked", source: source.key }, { status: 502 });
  }

  // Nach Redirects prüfen, ob wir noch auf der erlaubten Plattform sind
  // (FB leitet z.B. auf die Login-Seite um; Redirect auf Fremdhost = ablehnen).
  const finalSource = detectSource(res.url || url);
  if (!finalSource) {
    return Response.json({ error: "blocked", source: source.key }, { status: 502 });
  }
  if (source.key === "facebook" && /login|checkpoint/.test(res.url || "")) {
    return Response.json({ error: "login_required", source: source.key }, { status: 502 });
  }
  if (!res.ok) {
    return Response.json({ error: "blocked", source: source.key, status: res.status }, { status: 502 });
  }

  const html = await res.text();
  const parsed = parseListingHtml(html, source.key);

  // Bot-Challenge-Seiten haben oft einen Titel, aber weder Bilder noch Preis —
  // das dem Client als "nichts Brauchbares" melden, damit er den
  // Paste-Fallback anbietet statt ein leeres Formular zu füllen.
  if (!parsed.title && !parsed.images.length) {
    return Response.json({ error: "no_data", source: source.key }, { status: 422 });
  }

  return Response.json({ source: source.key, ...parsed });
}
