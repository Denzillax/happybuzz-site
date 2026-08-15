// ═══════════════════════════════════════════════════════════════
// Inserat-Import von Fremdplattformen (Ricardo, Tutti, eBay, FB Marketplace).
// Der Verkäufer fügt den Link seines EIGENEN Inserats ein (oder den kopierten
// Seiteninhalt, wenn die Plattform Server-Abrufe blockt) und bekommt Titel,
// Beschreibung, Preis und Bilder vorausgefüllt.
//
// Bewusst Regex-basiert statt DOM-Parser: dieselben Funktionen laufen im
// Route-Handler (Node) UND im Browser (Paste-Fallback), ohne Abhängigkeiten.
// ═══════════════════════════════════════════════════════════════

// Plattformen, von denen importiert werden darf. Gleichzeitig die
// SSRF-Whitelist der API-Route: alles andere wird abgelehnt, sonst wäre der
// Endpunkt ein offener Proxy ins Internet (oder Schlimmeres: interne Hosts).
export const IMPORT_SOURCES = [
  { key: "tutti",   label: "Tutti",          hosts: ["www.tutti.ch", "tutti.ch"] },
  { key: "ricardo", label: "Ricardo",        hosts: ["www.ricardo.ch", "ricardo.ch"] },
  { key: "ebay",    label: "eBay",           hosts: ["www.ebay.ch", "ebay.ch", "www.ebay.com", "ebay.com", "www.ebay.de", "ebay.de"] },
  { key: "facebook", label: "FB Marketplace", hosts: ["www.facebook.com", "facebook.com", "m.facebook.com"] },
];

// Bild-CDNs der Plattformen — Whitelist für den Bild-Proxy.
export const IMPORT_IMAGE_HOSTS = [
  "c.tutti.ch",
  "img.ricardostatic.ch", "www.ricardostatic.ch", "ricardostatic.ch",
  "i.ebayimg.com",
];
// FB liefert Bilder von scontent-*.fbcdn.net (variabler Subdomain-Teil).
export function isAllowedImageHost(host) {
  if (!host) return false;
  if (IMPORT_IMAGE_HOSTS.includes(host)) return true;
  return /^scontent[\w.-]*\.fbcdn\.net$/.test(host);
}

export function detectSource(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return IMPORT_SOURCES.find((s) => s.hosts.includes(host)) || null;
  } catch {
    return null;
  }
}

// ─── Hilfen ──────────────────────────────────────────────────
function decodeEntities(s) {
  return (s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function metaContent(html, property) {
  // <meta property="og:title" content="..."> — Attribut-Reihenfolge variabel
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|` +
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i"
  );
  const m = html.match(re);
  return m ? decodeEntities(m[1] || m[2] || "") : "";
}

function stripTags(s) {
  return decodeEntities(String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

// "CHF 460.-", "460.00", "Fr. 1'250" → 460 / 1250
export function parsePrice(raw) {
  if (raw == null) return null;
  if (typeof raw === "number") return isFinite(raw) && raw >= 0 ? raw : null;
  const cleaned = String(raw).replace(/['’\s]/g, "").replace(/,/, ".");
  const m = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return isFinite(n) && n >= 0 ? n : null;
}

// ─── JSON-LD (eBay, teils Ricardo) ───────────────────────────
function fromJsonLd(html) {
  const out = {};
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of scripts) {
    const body = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    let data;
    try { data = JSON.parse(body); } catch { continue; }
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      const node = item?.["@graph"] ? item["@graph"].find((n) => n["@type"] === "Product") : item;
      if (!node || node["@type"] !== "Product") continue;
      if (node.name && !out.title) out.title = decodeEntities(String(node.name));
      if (node.description && !out.description) out.description = stripTags(node.description);
      const imgs = Array.isArray(node.image) ? node.image : node.image ? [node.image] : [];
      if (imgs.length && !out.images) out.images = imgs.map(String);
      const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      if (offer?.price != null && out.price == null) out.price = parsePrice(offer.price);
    }
  }
  return out;
}

// ─── Bild-URLs aus dem HTML ziehen ───────────────────────────
// Empfehlungs-Sektionen ("Ähnliche Inserate") zeigen Bilder FREMDER Artikel vom
// selben CDN. Ohne den Schnitt hier importiert man fremde Fotos ins eigene
// Inserat — auf der Tutti-Testseite waren 7 von 9 gesammelten Bildern fremd.
// Der Schnitt hilft nur beim Paste-Fallback (kopiertes DOM in Leserichtung);
// im Server-HTML stehen die fremden Thumbnails als <link rel="preload"> im
// <head>, also VOR der Überschrift — dort greift stattdessen fromTuttiState.
function cutAtRecommendations(html) {
  const m = html.search(/(?:&Auml;|Ä|&#196;|&#xC4;)hnliche\s+(?:Inserate|Artikel|Angebote)|Das k(?:ö|&ouml;)nnte dich auch|similar\s+(?:items|listings)|Weitere\s+Inserate/i);
  return m > 0 ? html.slice(0, m) : html;
}

// Tutti (Server-HTML): die eigene Galerie liegt als "images"-Array im
// eingebetteten Seiten-JSON — die einzige Stelle, die NUR die Bilder dieses
// Inserats enthält. Wenn vorhanden, ist sie die alleinige Quelle.
function fromTuttiState(html) {
  const m = html.match(/"images"\s*:\s*\[([^\]]*)\]/);
  if (!m) return [];
  return m[1].match(/https?:\/\/c\.tutti\.ch\/[^"\\]+/g) || [];
}

function collectImages(fullHtml, sourceKey) {
  const html = cutAtRecommendations(fullHtml);
  const urls = new Set();
  const re = /(?:src|content|href)=["'](https?:\/\/[^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1]);
      if (!isAllowedImageHost(u.hostname)) continue;
      // Tutti: Thumbnails und Grossbilder teilen die ID — nur /big/ nehmen,
      // Thumbnail-Varianten (z.B. /thumbs/) desselben Bilds überspringen.
      if (sourceKey === "tutti" && !/\/big\//.test(u.pathname)) continue;
      // eBay: s-l64/s-l140-Thumbnails auf die Grossvariante heben.
      if (sourceKey === "ebay") u.pathname = u.pathname.replace(/s-l\d+/, "s-l1600");
      urls.add(u.toString());
    } catch { /* kaputte URL ignorieren */ }
  }
  return [...urls];
}

// ─── Hauptfunktion ───────────────────────────────────────────
// html: kompletter Quelltext (Server-Fetch) ODER eingefügtes HTML (Paste).
// sourceKey: "tutti" | "ricardo" | "ebay" | "facebook" | null (unbekannt).
export function parseListingHtml(html, sourceKey = null) {
  if (!html || typeof html !== "string") return { title: "", description: "", price: null, images: [] };

  const ld = fromJsonLd(html);

  const title = ld.title
    || metaContent(html, "og:title")
    || stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "");

  let description = ld.description || metaContent(html, "og:description") || "";
  // og:description ist oft gekürzt ("…") — dann lieber der längste Textblock
  // aus dem Markup, falls einer deutlich mehr hergibt.
  if (/…$|\.\.\.$/.test(description) || description.length < 80) {
    const blocks = (html.match(/<(?:p|div|span)[^>]*>([\s\S]{80,4000}?)<\/(?:p|div|span)>/gi) || [])
      .map((b) => stripTags(b))
      .filter((t) => t.length > description.length && !/{|}|function|window\.|cookie/i.test(t));
    if (blocks.length) description = blocks.sort((a, b) => b.length - a.length)[0];
  }

  const price = ld.price != null
    ? ld.price
    : parsePrice(metaContent(html, "product:price:amount") || metaContent(html, "og:price:amount")
        || (html.match(/CHF\s*([\d'.,’]+)/i) || [])[1]);

  const ogImage = metaContent(html, "og:image");
  const tuttiOwn = sourceKey === "tutti" ? fromTuttiState(html) : [];
  const candidates = tuttiOwn.length
    ? tuttiOwn   // exklusiv: alles andere ist bei Tutti durch Fremd-Preloads vergiftet
    : [
        ...(ld.images || []),
        ...(ogImage ? [ogImage] : []),
        ...collectImages(html, sourceKey),
      ];
  const images = [...new Set(
    candidates.map((u) => {
      // Normalisierung zentral, damit auch JSON-LD/og-Bilder erfasst sind:
      // http→https (og:image liefert teils http; der Bild-Proxy verlangt https),
      // eBay-Thumbnails (s-l64/s-l140) → Grossvariante.
      let s = String(u).replace(/^http:\/\//, "https://");
      if (sourceKey === "ebay") s = s.replace(/s-l\d+/, "s-l1600");
      return s;
    })
  )].filter((u) => {
    try { return isAllowedImageHost(new URL(u).hostname); } catch { return false; }
  }).slice(0, 10);   // Formular-Limit

  return {
    title: (title || "").slice(0, 120).trim(),
    description: (description || "").slice(0, 4000).trim(),
    price,
    images,
  };
}
