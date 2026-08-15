"use client";

import { useState } from "react";
import { Download, Link2, ClipboardPaste, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { detectSource, parseListingHtml } from "@/lib/importListing";

// Import von Ricardo / Tutti / eBay / FB Marketplace beim Inserieren.
// Weg 1: Link einfügen → Server holt und parst die Seite (/api/import-listing).
// Weg 2 (wenn die Plattform Server-Abrufe blockt): Nutzer kopiert sein
// Inserat im Browser (Ctrl+A, Ctrl+C) und fügt es hier ein — das eingefügte
// HTML wird clientseitig mit demselben Parser gelesen.
export default function ImportBox({ onImport }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [done, setDone] = useState(null);

  const finish = async (parsed, sourceKey) => {
    // Bilder über den Proxy laden und in die normale Upload-Pipeline geben.
    const files = [];
    for (const [i, imgUrl] of (parsed.images || []).entries()) {
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
    setDone({ source: sourceKey, fields: [parsed.title && "Titel", parsed.description && "Beschreibung", parsed.price != null && "Preis"].filter(Boolean), imgCount: files.length });
    setBusy(false);
    setError("");
    setShowPaste(false);
  };

  const importFromUrl = async () => {
    const source = detectSource(url.trim());
    if (!source) {
      setError("Der Link muss von Ricardo, Tutti, eBay oder Facebook Marketplace stammen.");
      return;
    }
    setBusy(true); setError(""); setDone(null);
    try {
      const res = await fetch("/api/import-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.title || data.images?.length)) {
        await finish(data, data.source);
        return;
      }
      // Geblockt oder nichts Brauchbares → Paste-Fallback anbieten.
      setBusy(false);
      setShowPaste(true);
      setError(
        data.error === "login_required"
          ? `${source.label} zeigt Inserate nur eingeloggt. Öffne dein Inserat im Browser, kopiere die ganze Seite (Ctrl+A, Ctrl+C) und füge sie unten ein.`
          : `${source.label} blockiert den automatischen Abruf. Öffne dein Inserat, kopiere die ganze Seite (Ctrl+A, Ctrl+C) und füge sie unten ein.`
      );
    } catch {
      setBusy(false);
      setShowPaste(true);
      setError("Abruf fehlgeschlagen. Du kannst dein Inserat kopieren (Ctrl+A, Ctrl+C) und unten einfügen.");
    }
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    const sourceKey = detectSource(url.trim())?.key || null;
    setBusy(true); setError("");
    if (html) {
      const parsed = parseListingHtml(html, sourceKey);
      if (parsed.title || parsed.description || parsed.images.length) {
        await finish(parsed, sourceKey);
        return;
      }
    }
    if (text && text.trim()) {
      // Nur-Text-Fallback: erste Zeile als Titel, Rest als Beschreibung.
      const lines = text.trim().split(/\n+/).map((l) => l.trim()).filter(Boolean);
      await finish({ title: lines[0] || "", description: lines.slice(1).join("\n").slice(0, 4000), price: null, images: [] }, sourceKey);
      return;
    }
    setBusy(false);
    setError("Im eingefügten Inhalt war nichts Verwertbares. Kopiere die geöffnete Inseratseite komplett (Ctrl+A, Ctrl+C).");
  };

  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.borderLt}`, borderRadius: radius.md, padding: open ? "16px 18px" : "12px 18px", marginBottom: 20 }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: fonts.body, fontSize: 13.5, fontWeight: 700, color: colors.teal }}>
          <Download size={16} /> Inserat von Ricardo, Tutti, eBay oder FB Marketplace übernehmen
        </button>
      ) : (
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 700, fontFamily: fonts.body, color: colors.dark, display: "flex", alignItems: "center", gap: 7 }}>
            <Download size={15} /> Inserat übernehmen
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: colors.muted, fontFamily: fonts.body }}>
            Füge den Link deines eigenen Inserats ein. Titel, Beschreibung, Preis und Bilder werden übernommen, du kannst danach alles anpassen.
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "0 10px", background: colors.cream }}>
              <Link2 size={14} color={colors.muted} />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); importFromUrl(); } }}
                placeholder="https://www.tutti.ch/de/vi/…"
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", padding: "9px 0", fontSize: 13, fontFamily: fonts.body }}
              />
            </div>
            <button type="button" onClick={importFromUrl} disabled={busy || !url.trim()}
              style={{ padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${colors.dark}`, background: busy || !url.trim() ? colors.cream : colors.teal, color: busy || !url.trim() ? colors.muted : "#fff", fontSize: 13, fontWeight: 700, fontFamily: fonts.body, cursor: busy || !url.trim() ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              {busy ? "Lädt…" : "Importieren"}
            </button>
          </div>

          {error && (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#B4540A", fontFamily: fonts.body, display: "flex", alignItems: "flex-start", gap: 6 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{error}</span>
            </p>
          )}

          {showPaste && (
            <div
              onPaste={handlePaste}
              tabIndex={0}
              style={{ marginTop: 10, border: `1.5px dashed ${colors.border}`, borderRadius: 10, padding: "18px 14px", textAlign: "center", background: colors.cream, cursor: "text", outline: "none" }}>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, fontFamily: fonts.body, color: colors.dark, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <ClipboardPaste size={14} /> Hier klicken und mit Ctrl+V einfügen
              </p>
            </div>
          )}

          {done && (
            <p style={{ margin: "10px 0 0", fontSize: 12.5, color: colors.green, fontWeight: 700, fontFamily: fonts.body, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} />
              Übernommen: {done.fields.join(", ")}{done.imgCount ? `, ${done.imgCount} Bild${done.imgCount > 1 ? "er" : ""}` : ""}. Bitte prüfen und ergänzen.
            </p>
          )}

          <p style={{ margin: "10px 0 0", fontSize: 11, color: colors.muted, fontFamily: fonts.body }}>
            Nur für Inserate, die dir gehören. Texte und Fotos bleiben deine Inhalte.
          </p>
        </div>
      )}
    </div>
  );
}
