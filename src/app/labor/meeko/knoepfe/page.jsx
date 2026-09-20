"use client";
// Knöpfe und Hot-Schild zum Vergleichen (Denis 20.09.2026: schwarze Knöpfe nur halb gut, schwarzes Hot-Schild nicht gut).
// Jede Zeile zeigt denselben Satz Knöpfe in einer anderen Art: Hauptknopf, Nebenknopf, kleiner Knopf in einem Hinweis.
import { Flame, Plus } from "lucide-react";

const INK = "#1D1D1D";
const basis = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 52, padding: "0 24px 4px", borderRadius: 10, border: `1px solid ${INK}`, fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", fontFamily: "inherit", cursor: "pointer" };
const neben = { ...basis, background: "#fff", color: INK, boxShadow: "inset 0 -4px 0 rgba(29,29,29,.14)" };

const ARTEN = [
  ["A", "Ink, wie jetzt", "Dunkel mit weisser Schrift. Stärkster Kontrast, wirkt aber schwer, wenn mehrere auf einer Seite stehen.", { ...basis, background: INK, color: "#fff", boxShadow: "inset 0 -5px 0 rgba(255,255,255,.22)" }],
  ["B", "Mint", "Die Farbe für gewählt und eingeschaltet wird auch die Farbe für Tun. Ink-Rand, eingedrückter Schatten.", { ...basis, background: "#DBF5F0", color: INK, boxShadow: "inset 0 -5px 0 rgba(29,29,29,.16)" }],
  ["C", "Lavendel", "Wie B, in der Farbe des Fusses und der Hover-Flächen.", { ...basis, background: "#E3E3FF", color: INK, boxShadow: "inset 0 -5px 0 rgba(29,29,29,.16)" }],
  ["D", "Weiss auf Ink-Sockel", "Weisser Knopf, der auf einer festen Ink-Kante steht. Beim Drücken sinkt er auf die Kante.", { ...basis, background: "#fff", color: INK, boxShadow: `0 4px 0 ${INK}`, marginBottom: 4 }],
  ["E", "Ink mit Mint-Kante", "Dunkel wie jetzt, aber die untere Kante leuchtet in Mint. Behält den Kontrast, nimmt die Schwere.", { ...basis, background: INK, color: "#fff", boxShadow: "inset 0 -5px 0 #DBF5F0" }],
];

const chip = { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: `1px solid ${INK}`, lineHeight: 1.5 };
const HOT = [
  ["1", "Rosa, Flamme Himbeer (jetzt)", { ...chip, background: "#FFE3FB", color: INK }, "#C2255C"],
  ["2", "Weiss, Flamme rot", { ...chip, background: "#fff", color: INK }, "#C62828"],
  ["3", "Butter, Flamme Ink", { ...chip, background: "#FFE7A9", color: INK }, INK],
  ["4", "Himbeer gefüllt", { ...chip, background: "#C2255C", color: "#fff" }, "#fff"],
];

export default function Page() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 140px", fontFamily: "'Instrument Sans', sans-serif", color: INK }}>
      <h1 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-.04em", margin: "0 0 6px" }}>Knöpfe: fünf Arten</h1>
      <p style={{ opacity: .7, margin: "0 0 32px", maxWidth: "46em" }}>Der Nebenknopf bleibt überall weiss. Es ändert sich nur der Hauptknopf. Sag mir den Buchstaben.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {ARTEN.map(([nr, name, text, stil]) => (
          <section key={nr} style={{ border: `1px solid ${INK}`, borderRadius: 20, padding: 24, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}><b style={{ display: "inline-block", minWidth: 26 }}>{nr}</b>{name}</p>
              <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, opacity: .7 }}>{text}</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <button className="eckig kein-akzent" style={stil}><Plus size={17} strokeWidth={2.4} aria-hidden="true" /> Inserat veröffentlichen</button>
              <button className="eckig kein-akzent" style={neben}>Entwurf speichern</button>
            </div>
            <div style={{ flex: "1 1 100%", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", padding: "14px 18px", borderRadius: 20, border: `1px solid ${INK}`, background: "#FFE7A9" }}>
              <span style={{ flex: "1 1 200px", fontSize: 14 }}>Für Auktionen brauchst du eine Adresse im Profil.</span>
              <button className="eckig kein-akzent" style={{ ...stil, minHeight: 38, padding: "0 16px 3px", fontSize: 13.5, marginBottom: 0, boxShadow: String(stil.boxShadow).replace("-5px", "-3px").replace("0 4px 0", "0 3px 0") }}>Zu den Einstellungen</button>
            </div>
          </section>
        ))}
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-.03em", margin: "56px 0 6px" }}>Hot-Schild: vier Arten</h2>
      <p style={{ opacity: .7, margin: "0 0 20px" }}>Jedes liegt auf den fünf Formatfarben, so wie es auf den Karten vorkommt. Daneben zum Vergleich «Endet bald».</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {HOT.map(([nr, name, stil, flamme]) => (
          <div key={nr} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <p style={{ margin: 0, flex: "0 0 250px", fontSize: 14.5 }}><b style={{ display: "inline-block", minWidth: 22 }}>{nr}</b>{name}</p>
            {["#FBEBEA", "#E3E3FF", "#E3F2FF", "#FFE7A9", "#FFE3FB"].map((bg) => (
              <span key={bg} style={{ display: "inline-flex", gap: 5, padding: "12px 12px", borderRadius: 14, border: `1px solid ${INK}`, background: bg }}>
                <span style={stil}><Flame size={11} color={flamme} fill={flamme} /> Hot</span>
                <span style={{ ...chip, background: "#C62828", color: "#fff" }}>Endet bald</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
