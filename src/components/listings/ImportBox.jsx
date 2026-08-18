"use client";

import { useEffect, useRef, useState } from "react";
import { Download, CheckCircle2, ArrowRight } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { parseListingHtml } from "@/lib/importListing";
import { takeImportHtml } from "@/lib/importBookmarklet";

// Inserat-Übernahme von Ricardo / Tutti / eBay / FB Marketplace.
//
// EIN Weg: der Import-Helfer (Bookmarklet). Er läuft im Browser des
// Verkäufers auf der Fremdseite, wo dieser eingeloggt ist — deshalb greift
// dort kein Bot-Schutz. Der frühere serverseitige Link-Import wurde entfernt:
// Ricardo (403) und FB (Login) blockten ihn, drei Wege mit unterschiedlicher
// Zuverlässigkeit waren für Verkäufer verwirrender als einer, der überall geht.
export default function ImportBox({ onImport }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const hashHandled = useRef(false);

  // Vom Import-Helfer geöffnet: /listings/new#import=… — oder aus dem
  // Zwischenspeicher, falls vorher der Login dazwischenkam.
  useEffect(() => {
    if (hashHandled.current) return;
    hashHandled.current = true;

    const html = takeImportHtml();
    if (!html) return;

    const parsed = parseListingHtml(html, null);
    if (!parsed.title && !parsed.description && !parsed.images.length) return;

    (async () => {
      setBusy(true);
      // Bilder über den Proxy holen und in die normale Upload-Pipeline geben,
      // damit sie uns gehören und nicht am Fremd-CDN hängen.
      const files = [];
      for (const [i, imgUrl] of parsed.images.entries()) {
        try {
          const res = await fetch(`/api/import-image?url=${encodeURIComponent(imgUrl)}`);
          if (!res.ok) continue;
          const blob = await res.blob();
          if (!blob.type.startsWith("image/")) continue;
          const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
          files.push(new File([blob], `import-${i + 1}.${ext}`, { type: blob.type }));
        } catch { /* einzelnes Bild überspringen */ }
      }
      onImport({ ...parsed, files });
      setDone({
        fields: [parsed.title && "Titel", parsed.description && "Beschreibung", parsed.price != null && "Preis"].filter(Boolean),
        imgCount: files.length,
      });
      setBusy(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) {
    return (
      <div style={{ background: "#EEF4EC", border: "1px solid #5B8C5A", borderRadius: 0, padding: "12px 18px", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#3F6B3E", fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 7 }}>
          <CheckCircle2 size={15} />
          Übernommen: {done.fields.join(", ")}{done.imgCount ? `, ${done.imgCount} Bild${done.imgCount > 1 ? "er" : ""}` : ""}. Bitte prüfen und ergänzen.
        </p>
      </div>
    );
  }

  if (busy) {
    return (
      <div style={{ background: "#fff", border: "1.5px solid #191615", borderRadius: 0, padding: "12px 18px", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.teal, fontFamily: fonts.body }}>
          Inserat wird übernommen…
        </p>
      </div>
    );
  }

  return (
    // Nur Desktop: der Import-Helfer (Bookmarklet) funktioniert am Handy nicht
    <div className="import-promo" style={{ background: "#fff", border: "1.5px solid #191615", borderRadius: 0, padding: "12px 18px", marginBottom: 20 }}>
      <a href="/import-helfer" target="_blank" rel="noopener"
        style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: fonts.body, fontSize: 13.5, fontWeight: 700, color: colors.teal, textDecoration: "none" }}>
        <Download size={16} />
        Inserat-Import
        <ArrowRight size={14} />
      </a>
      <p style={{ margin: "4px 0 0 24px", fontSize: 11.5, color: colors.muted, fontFamily: fonts.body }}>
        Bestehendes Inserat von Ricardo, Tutti, eBay oder Facebook übernehmen.
      </p>
    </div>
  );
}
