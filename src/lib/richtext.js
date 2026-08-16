// Striktes Mini-HTML fuer Inserats-Beschreibungen.
// Erlaubt sind NUR: b, i, ul/li, h3, p, br — alles andere (Tags, saemtliche
// Attribute, Skripte, Links) fliegt raus. Eine Quelle fuer Speichern,
// Anzeigen und Import: nie ungefilterten Bestand rendern.

// Kanonisierung: strong→b, em→i, ol→ul, h1-h4→h3, div→p.
// null = Tag entfernen, Inhalt behalten (z.B. span, a, u).
const CANON = {
  B: "b", STRONG: "b", I: "i", EM: "i",
  UL: "ul", OL: "ul", LI: "li",
  H1: "h3", H2: "h3", H3: "h3", H4: "h3", H5: "h3", H6: "h3",
  P: "p", DIV: "p", BR: "br",
};
// Inhalt dieser Tags komplett verwerfen (Text darin ist kein Fliesstext)
const DROP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "OBJECT", "TEMPLATE", "HEAD", "TITLE", "SVG", "BUTTON", "SELECT"]);

function escapeText(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sanitizeDescription(html) {
  const s = String(html || "");
  if (!s) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    // Serverseite rendert die Beschreibung nie als HTML — zur Sicherheit
    // auf reinen Text reduzieren, falls doch jemand hier durchkommt.
    return escapeText(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  }
  const doc = new DOMParser().parseFromString(s, "text/html");
  const walk = (node, inList) => {
    let out = "";
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) { out += escapeText(child.textContent); continue; }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      if (DROP.has(child.tagName)) continue;
      const tag = CANON[child.tagName];
      if (tag === "br") { out += "<br>"; continue; }
      const inner = walk(child, tag === "ul" || inList);
      if (!tag) { out += inner; continue; } // unbekannter Tag: nur Inhalt behalten
      if (tag === "li" && !inList) { out += inner + "<br>"; continue; } // li ohne Liste
      if (inner.trim() === "" && tag !== "p") continue; // leere b/i/ul/h3 weg
      out += `<${tag}>${inner}</${tag}>`;
    }
    return out;
  };
  return walk(doc.body, false)
    .replace(/<p>(\s|<br>)*<\/p>/g, "<br>")
    .replace(/(<br>\s*){3,}/g, "<br><br>")
    .trim();
}

// Traegt der Text Formatierung/Entities aus dem Editor, oder ist es
// Alt-Bestand aus der Plaintext-Zeit?
export function isFormattedDescription(text) {
  return /<(b|i|ul|li|h3|p|br)[\s>/]|&(lt|gt|amp|quot|nbsp|#\d+);/i.test(String(text || ""));
}

// Reiner Text (fuer Zeichenzaehler, Pflichtfeld-Pruefung, Meta-Tags)
export function descriptionPlainText(text) {
  const s = String(text || "");
  if (!s) return "";
  if (!isFormattedDescription(s)) return s;
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return s.replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  }
  const doc = new DOMParser().parseFromString(s, "text/html");
  return (doc.body.textContent || "").trim();
}

// Plaintext (Alt-Bestand, KI-Texte) → Mini-HTML mit Zeilenumbruechen
export function plainToHtml(text) {
  if (!text) return "";
  return escapeText(String(text)).split(/\n/).join("<br>");
}
