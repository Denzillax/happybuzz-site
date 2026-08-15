import { describe, it, expect, vi } from "vitest";
import {
  parseListingHtml, parsePrice, isAllowedImageHost, IMPORT_SOURCES,
} from "@/lib/importListing";
import { bookmarkletHref, decodeImportHash, stashImportHash, takeImportHtml } from "@/lib/importBookmarklet";

// ─── Fixtures (nachgebaut nach echten Seitenstrukturen) ────────
const TUTTI_HTML = `
<html><head>
<meta property="og:title" content="Mollerus Tasche neu Meyrin mit schwarzem Verschluss" />
<meta property="og:description" content="Mollerus Tasche neu Meyrin Neupreis 750 Preis ist nicht verhandelbar, da ganz neu. Mit schwarzem Verschluss und Staubbeutel, nie getragen." />
<meta property="og:image" content="https://c.tutti.ch/big/6363428334.jpg" />
</head><body>
<h1>Mollerus Tasche neu Meyrin mit schwarzem Verschluss</h1>
<span>CHF 460.-</span>
<img src="https://c.tutti.ch/big/6363428334.jpg" />
<img src="https://c.tutti.ch/big/9988776655.jpg" />
<img src="https://c.tutti.ch/thumbs/6363428334.jpg" />
<img src="https://evil.example.com/steal.jpg" />
<h2>Ähnliche Inserate</h2>
<img src="https://c.tutti.ch/big/3753193852.jpg" />
<img src="https://c.tutti.ch/big/8407751777.jpg" />
</body></html>`;

const EBAY_HTML = `
<html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product",
 "name":"Nintendo Game Boy Color lila",
 "description":"Funktioniert einwandfrei. Mit Tetris.",
 "image":["https://i.ebayimg.com/images/g/abc/s-l140.jpg"],
 "offers":{"@type":"Offer","price":"45.00","priceCurrency":"CHF"}}
</script>
</head><body><img src="https://i.ebayimg.com/images/g/xyz/s-l64.jpg" /></body></html>`;

const BLOCKED_HTML = `<html><head><title>Access denied</title></head><body>Checking your browser</body></html>`;

// Server-HTML von Tutti: fremde Thumbnails als <link rel="preload"> im HEAD
// (vor jeder Überschrift!), eigene Galerie nur im eingebetteten JSON-State.
const TUTTI_SSR_HTML = `
<html><head>
<link rel="preload" as="image" href="https://c.tutti.ch/big/1111111111.jpg" imageSizes="100vw"/>
<link rel="preload" as="image" href="https://c.tutti.ch/big/3753193852.jpg"/>
<link rel="preload" as="image" href="https://c.tutti.ch/big/8407751777.jpg"/>
<meta property="og:title" content="Mollerus Tasche" />
<meta property="og:image" content="http://c.tutti.ch/big/1111111111.jpg" />
</head><body>
<span>CHF 460.-</span>
<script>window.__STATE__={"ad":{"images":[{"rendition":{"src":"https://c.tutti.ch/big/1111111111.jpg"}},{"rendition":{"src":"https://c.tutti.ch/big/2222222222.jpg"}},{"rendition":{"src":"https://c.tutti.ch/big/3333333333.jpg"}}],"recommended":true}}</script>
</body></html>`;

describe("IMPORT_SOURCES (Anzeige auf /import-helfer)", () => {
  it("nennt die vier unterstuetzten Plattformen", () => {
    expect(IMPORT_SOURCES.map((s) => s.key).sort()).toEqual(["ebay", "facebook", "ricardo", "tutti"]);
    expect(IMPORT_SOURCES.every((s) => !!s.label)).toBe(true);
  });
});

describe("parseListingHtml: Tutti (OG-Tags + Bild-CDN)", () => {
  const r = parseListingHtml(TUTTI_HTML, "tutti");
  it("zieht Titel, Beschreibung, Preis", () => {
    expect(r.title).toBe("Mollerus Tasche neu Meyrin mit schwarzem Verschluss");
    expect(r.description).toContain("Neupreis 750");
    expect(r.price).toBe(460);
  });
  it("nimmt nur /big/-Bilder vom Tutti-CDN, dedupliziert, blockt Fremd-Hosts", () => {
    expect(r.images).toContain("https://c.tutti.ch/big/6363428334.jpg");
    expect(r.images).toContain("https://c.tutti.ch/big/9988776655.jpg");
    expect(r.images.some((u) => u.includes("/thumbs/"))).toBe(false);
    expect(r.images.some((u) => u.includes("evil.example.com"))).toBe(false);
    expect(r.images.length).toBe(2);
  });
  it("importiert KEINE Bilder aus der 'Ähnliche Inserate'-Sektion (fremde Artikel)", () => {
    expect(r.images.some((u) => u.includes("3753193852") || u.includes("8407751777"))).toBe(false);
  });
});

describe("parseListingHtml: Tutti Server-HTML (State-Array schlägt Head-Preloads)", () => {
  const r = parseListingHtml(TUTTI_SSR_HTML, "tutti");
  it("nimmt exklusiv die eigene Galerie aus dem JSON-State", () => {
    expect(r.images).toEqual([
      "https://c.tutti.ch/big/1111111111.jpg",
      "https://c.tutti.ch/big/2222222222.jpg",
      "https://c.tutti.ch/big/3333333333.jpg",
    ]);
  });
  it("fremde Preload-Thumbnails aus dem Head bleiben draussen", () => {
    expect(r.images.some((u) => u.includes("3753193852") || u.includes("8407751777"))).toBe(false);
  });
  it("normalisiert http-og:image zu https (kein Duplikat, Proxy verlangt https)", () => {
    expect(r.images.filter((u) => u.includes("1111111111")).length).toBe(1);
    expect(r.images.every((u) => u.startsWith("https://"))).toBe(true);
  });
});

describe("parseListingHtml: eBay (JSON-LD)", () => {
  const r = parseListingHtml(EBAY_HTML, "ebay");
  it("liest Product-Schema", () => {
    expect(r.title).toBe("Nintendo Game Boy Color lila");
    expect(r.description).toBe("Funktioniert einwandfrei. Mit Tetris.");
    expect(r.price).toBe(45);
  });
  it("hebt Thumbnails auf die Grossvariante", () => {
    expect(r.images.some((u) => u.includes("s-l1600"))).toBe(true);
    expect(r.images.some((u) => /s-l(64|140)\.jpg/.test(u))).toBe(false);
  });
});

describe("parseListingHtml: geblockte/leere Seiten", () => {
  it("liefert leeres Ergebnis statt Muell", () => {
    const r = parseListingHtml(BLOCKED_HTML, "ricardo");
    expect(r.title === "" || r.title === "Access denied").toBe(true);
    expect(r.images).toEqual([]);
    expect(r.price).toBeNull();
  });
  it("uebersteht null/undefined", () => {
    expect(parseListingHtml(null)).toEqual({ title: "", description: "", price: null, images: [] });
  });
});

describe("parsePrice (Schweizer Formate)", () => {
  it("versteht CHF-Schreibweisen", () => {
    expect(parsePrice("CHF 460.-")).toBe(460);
    expect(parsePrice("1'250")).toBe(1250);
    expect(parsePrice("45.00")).toBe(45);
    expect(parsePrice(45)).toBe(45);
  });
  it("liefert null bei Unsinn", () => {
    expect(parsePrice("gratis")).toBeNull();
    expect(parsePrice(null)).toBeNull();
    expect(parsePrice(-5)).toBeNull();
  });
});

describe("Bookmarklet (Import-Helfer)", () => {
  it("bookmarkletHref ist ein einzeiliges javascript:-URI mit dem Origin", () => {
    const href = bookmarkletHref("https://beedaro.ch");
    expect(href.startsWith("javascript:")).toBe(true);
    expect(href).toContain("https://beedaro.ch/listings/new#import=");
    expect(href.includes("\n")).toBe(false);
  });

  it("decodeImportHash ist das exakte Gegenstück zur Bookmarklet-Kodierung", () => {
    const html = "<html><body><h1>Test Ünïcode äöü</h1></body></html>";
    // dieselbe Kette wie im Bookmarklet: encodeURIComponent → unescape → btoa → encodeURIComponent
    const b = Buffer.from(unescape(encodeURIComponent(html)), "binary").toString("base64");
    expect(decodeImportHash(`#import=${encodeURIComponent(b)}`)).toBe(html);
  });

  it("decodeImportHash liefert null bei Muell", () => {
    expect(decodeImportHash("#import=%%%kaputt")).toBeNull();
    expect(decodeImportHash("#anderes=x")).toBeNull();
    expect(decodeImportHash("")).toBeNull();
  });

  it("rettet den Import ueber den Login-Umweg (Hash -> sessionStorage -> Formular)", () => {
    const html = "<html><body><h1>Gerettet</h1></body></html>";
    const b = Buffer.from(unescape(encodeURIComponent(html)), "binary").toString("base64");

    // Ausgeloggt: /listings/new#import=… sichert vor dem Redirect
    const store = {};
    const win = {
      location: { hash: `#import=${encodeURIComponent(b)}`, pathname: "/listings/new", search: "" },
      history: { replaceState: () => {} },
    };
    vi.stubGlobal("window", win);
    vi.stubGlobal("sessionStorage", {
      setItem: (k, v) => { store[k] = v; },
      getItem: (k) => store[k] ?? null,
      removeItem: (k) => { delete store[k]; },
    });
    expect(stashImportHash()).toBe(true);

    // Nach dem Login: kein Hash mehr, Markup kommt aus dem Zwischenspeicher
    win.location.hash = "";
    expect(takeImportHtml()).toBe(html);
    // und nur einmal — ein Reload importiert nicht erneut
    expect(takeImportHtml()).toBeNull();

    vi.unstubAllGlobals();
  });

  it("Hash-Import ohne bekannte Quelle filtert Tutti-Thumbnails trotzdem", () => {
    // Quelle null (Bookmarklet weiss nicht, woher) — /big/-Regel muss greifen
    const html = `<html><body>
      <img src="https://c.tutti.ch/big/1111111111.jpg" />
      <img src="https://c.tutti.ch/thumbs/1111111111.jpg" />
    </body></html>`;
    const r = parseListingHtml(html, null);
    expect(r.images).toEqual(["https://c.tutti.ch/big/1111111111.jpg"]);
  });
});

describe("isAllowedImageHost (Proxy-Whitelist)", () => {
  it("erlaubt die Plattform-CDNs inkl. FB-Muster", () => {
    expect(isAllowedImageHost("c.tutti.ch")).toBe(true);
    expect(isAllowedImageHost("i.ebayimg.com")).toBe(true);
    expect(isAllowedImageHost("scontent-zrh1-1.xx.fbcdn.net")).toBe(true);
  });
  it("blockt alles andere", () => {
    expect(isAllowedImageHost("evil.example.com")).toBe(false);
    expect(isAllowedImageHost("c.tutti.ch.evil.com")).toBe(false);
    expect(isAllowedImageHost("fbcdn.net.evil.com")).toBe(false);
    expect(isAllowedImageHost("")).toBe(false);
  });
});
