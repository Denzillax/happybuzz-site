"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, MousePointerClick, ArrowRight, ShieldCheck, Smartphone } from "lucide-react";
import { bookmarkletHref } from "@/lib/importBookmarklet";
import { IMPORT_SOURCES } from "@/lib/importListing";

const INK = "#14110D";
const PAPER = "#FBF8F2";
const HONEY = "#F4C03F";
const MUTED = "rgba(20,17,13,0.6)";
const HEAD = "'General Sans', sans-serif";
const BODY = "'Manrope', sans-serif";
const MONO = "'Space Mono', monospace";

const card = { background: "#fff", border: `1px solid ${INK}`, borderRadius: 0, padding: "24px 26px" };

export default function ImportHelferPage() {
  const linkRef = useRef(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);

  // React blockt javascript:-URIs in href — fürs Bookmarklet ist genau das
  // aber der Sinn der Sache, darum wird das Attribut direkt am DOM gesetzt.
  useEffect(() => {
    if (linkRef.current && origin) linkRef.current.setAttribute("href", bookmarkletHref(origin));
  }, [origin]);

  return (
    <div style={{ background: PAPER, minHeight: "100vh" }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "40px 24px 80px" }}>

        <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: MUTED, margin: "0 0 10px" }}>
          Import-Helfer · Umzug leicht gemacht
        </p>
        <h1 style={{ fontFamily: HEAD, fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 700, color: INK, margin: "0 0 12px", letterSpacing: "-0.01em" }}>
          Dein Inserat mit einem Klick übernehmen
        </h1>
        <p style={{ fontFamily: BODY, fontSize: 15, color: MUTED, lineHeight: 1.7, margin: "0 0 28px", maxWidth: 560 }}>
          Ricardo, eBay und Facebook blockieren automatische Abrufe. Der Import-Helfer umgeht das sauber:
          er liest dein Inserat direkt in deinem Browser, dort wo du eingeloggt bist, und übergibt es an BEEDARO.
        </p>

        {/* Schritt 1: Button in die Leiste ziehen */}
        <div style={{ ...card, marginBottom: 16 }}>
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: MUTED, margin: "0 0 8px" }}>SCHRITT 1</p>
          <p style={{ fontFamily: BODY, fontSize: 14, color: INK, fontWeight: 700, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 7 }}>
            <Bookmark size={16} /> Diesen Button in deine Lesezeichenleiste ziehen
          </p>
          <p style={{ fontFamily: BODY, fontSize: 13, color: MUTED, margin: "0 0 16px", lineHeight: 1.6 }}>
            Lesezeichenleiste nicht sichtbar? In Chrome/Edge mit Ctrl+Shift+B einblenden.
          </p>
          {/* Der Linktext wird zum Namen des Lesezeichens. Browser erlauben für
              javascript:-Bookmarklets kein eigenes Favicon (Chrome/Edge zeigen
              immer ein generisches Symbol), darum trägt der Titel das Bienen-
              Zeichen als Erkennungsmerkmal in der Leiste. Ausnahme von der
              Emoji-Regel: das hier ist der Browser des Nutzers, keine UI-Fläche. */}
          <a
            ref={linkRef}
            onClick={(e) => e.preventDefault()}
            title="In die Lesezeichenleiste ziehen, nicht klicken"
            style={{
              display: "inline-block", padding: "12px 22px", borderRadius: 0,
              border: `1.5px solid ${INK}`, background: HONEY, color: INK,
              fontFamily: BODY, fontSize: 14, fontWeight: 800, textDecoration: "none",
              cursor: "grab", boxShadow: `3px 3px 0 ${INK}`,
            }}
          >
            🐝 BEEDARO Import
          </a>
          <p style={{ fontFamily: BODY, fontSize: 11.5, color: MUTED, margin: "12px 0 0", lineHeight: 1.6 }}>
            Ziehen, nicht klicken. In der Lesezeichenleiste erscheint er dann als
            <strong style={{ color: INK }}> 🐝 BEEDARO Import</strong>. Browser vergeben für solche
            Helfer kein eigenes Symbol, das Bienen-Zeichen im Namen macht ihn trotzdem sofort auffindbar.
            Du kannst ihn per Rechtsklick jederzeit umbenennen.
          </p>
        </div>

        {/* Schritt 2 */}
        <div style={{ ...card, marginBottom: 16 }}>
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: MUTED, margin: "0 0 8px" }}>SCHRITT 2</p>
          <p style={{ fontFamily: BODY, fontSize: 14, color: INK, fontWeight: 700, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 7 }}>
            <MousePointerClick size={16} /> Dein Inserat öffnen und den Button klicken
          </p>
          <p style={{ fontFamily: BODY, fontSize: 13, color: MUTED, margin: "0 0 10px", lineHeight: 1.6 }}>
            Öffne dein Inserat auf einer dieser Plattformen und klicke in der Lesezeichenleiste
            auf 🐝 BEEDARO Import.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {IMPORT_SOURCES.map((s) => (
              <span key={s.key} style={{
                fontFamily: MONO, fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase",
                border: `1px solid ${INK}1f`, borderRadius: 0, padding: "4px 9px", color: MUTED,
              }}>{s.label}</span>
            ))}
          </div>
        </div>

        {/* Schritt 3 */}
        <div style={{ ...card, marginBottom: 24 }}>
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: MUTED, margin: "0 0 8px" }}>SCHRITT 3</p>
          <p style={{ fontFamily: BODY, fontSize: 14, color: INK, fontWeight: 700, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 7 }}>
            <ArrowRight size={16} /> Prüfen und veröffentlichen
          </p>
          <p style={{ fontFamily: BODY, fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>
            BEEDARO öffnet sich mit ausgefülltem Formular: Titel, Beschreibung, Preis und Bilder.
            Du prüfst, ergänzt Kategorie und Bee-Rate, fertig.
          </p>
        </div>

        {/* Hinweise */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 28 }}>
          <div style={{ background: "#fff", border: `1px solid ${INK}1f`, borderRadius: 0, padding: "14px 16px" }}>
            <p style={{ fontFamily: BODY, fontSize: 12.5, color: INK, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={14} /> Deine Daten bleiben deine
            </p>
            <p style={{ fontFamily: BODY, fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.55 }}>
              Der Helfer schickt nichts an Dritte. Die Inhalte wandern direkt von deinem Browser in dein
              BEEDARO-Formular; gespeichert wird erst, wenn du veröffentlichst. Nur für Inserate, die dir gehören.
            </p>
          </div>
          <div style={{ background: "#fff", border: `1px solid ${INK}1f`, borderRadius: 0, padding: "14px 16px" }}>
            <p style={{ fontFamily: BODY, fontSize: 12.5, color: INK, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
              <Smartphone size={14} /> Am Handy?
            </p>
            <p style={{ fontFamily: BODY, fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.55 }}>
              Lesezeichenleisten gibt es am Handy kaum. Richte den Helfer am Computer ein,
              oder erfasse dein Inserat am Handy von Hand.
            </p>
          </div>
        </div>

        <Link href="/listings/new" style={{ fontFamily: BODY, fontSize: 13.5, fontWeight: 700, color: "#0B5E5C", textDecoration: "underline" }}>
          Zurück zum Inserieren
        </Link>
      </div>
    </div>
  );
}
