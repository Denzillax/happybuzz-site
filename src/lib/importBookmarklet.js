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

// Diese Fassung hat sich in der Praxis bewaehrt und ist bewusst so belassen.
// Zwei Details, die entscheidend sind und darum nicht "optimiert" werden:
//
// 1. naturalWidth>=200 haelt Logos, Icons und Avatare draussen. Ohne den
//    Filter landen UI-Grafiken vom selben CDN im Inserat.
// 2. Der Link-Check (a.href===location.href) wirft Bilder aus Empfehlungs-
//    Sektionen raus: die haengen in Links auf FREMDE Inserate.
//
// Der Preis wird aus dem sichtbaren Text gelesen, weil nicht jede Plattform
// strukturierte Preisdaten liefert; der Parser bevorzugt ohnehin JSON-LD,
// wenn vorhanden. Der Verkaeufer prueft den Wert im Formular.
const CODE = `(function(){
var parts=[];
document.querySelectorAll('meta[property],meta[name],script[type="application/ld+json"]').forEach(function(el){parts.push(el.outerHTML)});
var h1=document.querySelector('h1');if(h1)parts.push('<h1>'+h1.textContent.replace(/</g,'&lt;')+'</h1>');
var price=null;
document.querySelectorAll('span,div,p,strong,h2').forEach(function(el){
var t=(el.textContent||'').trim();
if(t.length<40&&el.children.length===0&&/CHF\\s*[\\d'.,’]|\\d+\\.–|\\d+\\.-/.test(t)){if(!price||t.length<price.length)price=t;}
});
if(price)parts.push('<span>'+price.replace(/</g,'&lt;')+'</span>');
var d=document.querySelector('[data-testid*="escription"],[class*="escription"],[itemprop="description"]');
if(d)parts.push('<div>'+d.innerHTML+'</div>');
var imgs=[];
Array.prototype.forEach.call(document.images,function(i){
var a=i.closest?i.closest('a[href]'):null;
if(i.src&&/^https:/.test(i.src)&&(!a||a.href===location.href)&&(i.naturalWidth>=200||/\\/big\\/|s-l|scontent/.test(i.src))&&imgs.indexOf(i.src)<0)imgs.push(i.src);
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
