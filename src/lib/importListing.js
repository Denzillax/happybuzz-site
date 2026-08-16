// ═══════════════════════════════════════════════════════════════
// Inserat-Import von Fremdplattformen (Ricardo, Tutti, eBay, FB Marketplace).
// Gespeist wird der Parser vom Import-Helfer (Bookmarklet): der läuft im
// Browser des Verkäufers auf der Fremdseite, wo dieser eingeloggt ist, und
// übergibt das ausgelesene Markup an /listings/new#import=…
//
// Bewusst Regex-basiert statt DOM-Parser: keine Abhängigkeiten, und die
// Funktionen laufen unverändert im Browser wie in Node (Tests).
// ═══════════════════════════════════════════════════════════════

// Plattformen, für die der Import gedacht ist (Anzeige auf /import-helfer).
export const IMPORT_SOURCES = [
  { key: "tutti",   label: "Tutti" },
  { key: "ricardo", label: "Ricardo" },
  { key: "ebay",    label: "eBay" },
  { key: "facebook", label: "Facebook Marketplace" },
];

// Bild-CDNs der Plattformen — SSRF-Whitelist für den Bild-Proxy.
// Ohne diese Liste wäre /api/import-image ein offener Proxy ins Internet
// (oder Schlimmeres: auf interne Hosts).
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

// HTML-Fragment auf das Beedaro-Beschreibungs-Subset eindampfen (b, i, ul/li,
// h3, p, br — ohne Attribute). Regex-basiert, laeuft in Browser UND Node;
// die finale DOM-Sanitisierung (sanitizeDescription) macht ohnehin der Client,
// bevor der Text ins Formular oder in die DB gelangt.
export function toRichSubset(fragment) {
  let s = String(fragment || "");
  s = s.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const MAP = { strong: "b", b: "b", em: "i", i: "i", ul: "ul", ol: "ul", li: "li", h1: "h3", h2: "h3", h3: "h3", h4: "h3", p: "p", div: "p", br: "br" };
  s = s.replace(/<\/?\s*([a-z0-9]+)[^>]*>/gi, (m, tag) => {
    const t = MAP[tag.toLowerCase()];
    if (!t) return " ";
    if (t === "br") return "<br>";
    return m.trimStart().startsWith("</") ? `</${t}>` : `<${t}>`;
  });
  return s.replace(/[ \t]+/g, " ").replace(/\s*(<br>)\s*/g, "$1").trim();
}

// Hat das Subset ueberhaupt Formatierung, die sich zu behalten lohnt?
function hasRichContent(subset) {
  return /<(b|i|ul|li|h3)>/i.test(String(subset || ""));
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
      if (node.description && !out.description) {
        out.description = stripTags(node.description);
        const subset = toRichSubset(node.description);
        if (hasRichContent(subset)) out.descriptionHtml = subset;
      }
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
// selben CDN. Beim Import-Helfer greift zusätzlich schon im Bookmarklet ein
// Filter (nur Bilder, die nicht in einem Link auf ein anderes Inserat liegen).
function cutAtRecommendations(html) {
  const m = html.search(/(?:&Auml;|Ä|&#196;|&#xC4;)hnliche\s+(?:Inserate|Artikel|Angebote)|Das k(?:ö|&ouml;)nnte dich auch|similar\s+(?:items|listings)|Weitere\s+Inserate/i);
  return m > 0 ? html.slice(0, m) : html;
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
  let descriptionHtml = ld.descriptionHtml || "";
  // og:description ist oft gekürzt ("…") — dann lieber der längste Textblock
  // aus dem Markup, falls einer deutlich mehr hergibt. Vom Gewinner-Block wird
  // zusätzlich das Roh-HTML behalten (Fett/Listen der Quelle).
  if (/…$|\.\.\.$/.test(description) || description.length < 80) {
    const blocks = (html.match(/<(?:p|div|span)[^>]*>([\s\S]{80,4000}?)<\/(?:p|div|span)>/gi) || [])
      .map((raw) => ({ raw, text: stripTags(raw) }))
      .filter((b) => b.text.length > description.length && !/{|}|function|window\.|cookie/i.test(b.text));
    if (blocks.length) {
      const winner = blocks.sort((a, b) => b.text.length - a.text.length)[0];
      description = winner.text;
      const subset = toRichSubset(winner.raw);
      descriptionHtml = hasRichContent(subset) ? subset : "";
    }
  }

  const price = ld.price != null
    ? ld.price
    : parsePrice(metaContent(html, "product:price:amount") || metaContent(html, "og:price:amount")
        || (html.match(/CHF\s*([\d'.,’]+)/i) || [])[1]);

  const ogImage = metaContent(html, "og:image");
  const candidates = [
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
    try {
      const p = new URL(u);
      if (!isAllowedImageHost(p.hostname)) return false;
      // Tutti-CDN: nur /big/-Varianten — Thumbnails desselben Bilds liegen
      // unter anderen Pfaden und wären sonst Duplikate. Hier statt in
      // collectImages, damit die Regel auch beim Hash-Import (Quelle
      // unbekannt, Bookmarklet) greift.
      if (p.hostname === "c.tutti.ch" && !/\/big\//.test(p.pathname)) return false;
      return true;
    } catch { return false; }
  }).slice(0, 10);   // Formular-Limit

  return {
    title: (title || "").slice(0, 120).trim(),
    description: (description || "").slice(0, 4000).trim(),
    // Formatierte Variante (Beedaro-Subset) — leer, wenn die Quelle nichts hergibt
    descriptionHtml: (descriptionHtml || "").slice(0, 8000).trim(),
    price,
    images,
  };
}
