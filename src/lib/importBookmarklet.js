// ═══════════════════════════════════════════════════════════════
// Import-Helfer (Bookmarklet): läuft im Browser des Verkäufers AUF der
// Fremdseite (Ricardo/Tutti/eBay/FB). Dort ist er legitim eingeloggt, also
// greift kein Bot-Schutz — genau deshalb existiert dieser Weg: der
// serverseitige Abruf wird von Ricardo (403) und FB (Login) geblockt.
//
// Das Bookmarklet extrahiert Meta-Tags, JSON-LD, Titel, Preis, Beschreibung
// und die Galeriebilder aus dem gerenderten DOM, verpackt sie als Mini-HTML
// in einen base64-Hash und öffnet /listings/new#import=… — die ImportBox
// parst das mit demselben Parser wie den Server-Abruf. Es wird nichts an
// fremde Server geschickt; die Daten wandern direkt ins eigene Formular.
//
// Bewusst self-contained (kein Nachladen von Skripten): die CSP vieler
// Seiten würde externe Skripte blocken, Inline-Bookmarklets laufen trotzdem.
// ═══════════════════════════════════════════════════════════════

// Wichtig fuer die Preis-Erkennung: NUR strukturierte Quellen (JSON-LD,
// product:price:amount, og:price). Eine Textsuche nach "CHF …" im DOM traf im
// Test den falschen Betrag (Versandkosten statt Artikelpreis) — ein falscher
// Preis ist schlimmer als gar keiner, den ergaenzt der Verkaeufer selbst.
//
// Bilder: die Galerie laedt oft verzoegert, document.images enthaelt dann nur
// das sichtbare Bild. Darum zusaetzlich das "images"-Array aus dem
// eingebetteten Seiten-JSON mitgeben (dort steht die vollstaendige, und nur
// die eigene, Galerie) sowie data-src/srcset fuer Lazy-Loading-Platzhalter.
const CODE = `(function(){
var parts=[],H=document.documentElement.innerHTML;
document.querySelectorAll('meta[property],meta[name],script[type="application/ld+json"]').forEach(function(el){parts.push(el.outerHTML)});
var h1=document.querySelector('h1');if(h1)parts.push('<h1>'+h1.textContent.replace(/</g,'&lt;')+'</h1>');
var d=document.querySelector('[data-testid*="escription"],[class*="escription"],[itemprop="description"]');
if(d)parts.push('<div>'+d.innerHTML+'</div>');
var st=H.match(/"images"\\s*:\\s*\\[[^\\]]*\\]/);
if(st)parts.push('<script type="application/x-beedaro-state">{'+st[0]+'}<\\/script>');
var imgs=[];
Array.prototype.forEach.call(document.images,function(i){
[i.currentSrc,i.src,i.getAttribute('data-src'),i.getAttribute('data-zoom-image')].forEach(function(u){
if(!u||!/^https:/.test(u))return;
var a=i.closest?i.closest('a[href]'):null;
if(a&&a.href!==location.href)return;
if(imgs.indexOf(u)<0)imgs.push(u);});
});
imgs.slice(0,10).forEach(function(u){parts.push('<img src="'+u+'"/>')});
var html='<html><head></head><body>'+parts.join('')+'</body></html>';
var b=btoa(unescape(encodeURIComponent(html)));
var u='%%ORIGIN%%/listings/new#import='+encodeURIComponent(b);
// Neuer Tab ist angenehmer (das Inserat bleibt offen). Blockt ein
// Popup-Blocker, wird im selben Tab navigiert statt kommentarlos nichts zu tun.
var w=window.open(u,'_blank');
if(!w)location.href=u;
})();`;

// href für den <a>-Button auf /import-helfer. Origin dynamisch, damit es in
// Dev (localhost) und Produktion gleichermassen stimmt.
export function bookmarkletHref(origin) {
  const code = CODE.replace("%%ORIGIN%%", origin).replace(/\n/g, "");
  return "javascript:" + code;
}

// Hash einer /listings/new#import=…-URL zurück in HTML wandeln.
// Gegenstück zur btoa/encodeURIComponent-Kette im Bookmarklet.
export function decodeImportHash(hash) {
  const m = (hash || "").match(/#import=(.+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(escape(atob(decodeURIComponent(m[1]))));
  } catch {
    return null;
  }
}

const STASH_KEY = "beedaro_import_html";

// Wer ausgeloggt auf den Helfer klickt, landet auf /login — dabei geht der
// Hash verloren und der Import wäre still weg. Darum vor dem Redirect sichern.
export function stashImportHash() {
  if (typeof window === "undefined") return false;
  const html = decodeImportHash(window.location.hash);
  if (!html) return false;
  try { sessionStorage.setItem(STASH_KEY, html); } catch { return false; }
  return true;
}

// Holt das Import-Markup aus dem Hash ODER dem Zwischenspeicher und räumt
// beides weg, damit ein Reload nicht erneut importiert.
export function takeImportHtml() {
  if (typeof window === "undefined") return null;

  const fromHash = decodeImportHash(window.location.hash);
  if (fromHash) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    try { sessionStorage.removeItem(STASH_KEY); } catch { /* egal */ }
    return fromHash;
  }

  try {
    const stashed = sessionStorage.getItem(STASH_KEY);
    if (stashed) { sessionStorage.removeItem(STASH_KEY); return stashed; }
  } catch { /* Storage gesperrt */ }
  return null;
}
