"use client";
// Wortmarken-Auswahl fürs neue Logo (Denis 20.09.2026: die Schrift neben dem B gefällt nicht). Jede Zeile zeigt das B mit
// einer anderen Schrift, gross wie im Fuss, klein wie im Header und auf Ink. Nur zum Vergleichen, nicht verlinkt.
import { useEffect } from "react";
import BLogo from "@/components/shared/BLogo";

const SCHRIFTEN = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=Host+Grotesk:wght@600;700&family=Space+Grotesk:wght@600;700&family=Unbounded:wght@500;600&family=Sora:wght@600;700&family=Instrument+Sans:wght@600&family=Pixelify+Sans:wght@600&family=Familjen+Grotesk:wght@600;700&display=swap";
const VARIANTEN = [
  { nr: "01", name: "Instrument Sans 600 (jetzt)", stil: { fontFamily: "'Instrument Sans'", fontWeight: 600, letterSpacing: "-.05em" }, text: "beedaro" },
  { nr: "02", name: "General Sans 700, die bisherige Hausschrift", stil: { fontFamily: "'General Sans'", fontWeight: 700, letterSpacing: "-.035em" }, text: "beedaro" },
  { nr: "03", name: "General Sans 700, Grossbuchstaben", stil: { fontFamily: "'General Sans'", fontWeight: 700, letterSpacing: ".02em", fontSize: ".82em" }, text: "BEEDARO" },
  { nr: "04", name: "Bricolage Grotesque 700", stil: { fontFamily: "'Bricolage Grotesque'", fontWeight: 700, letterSpacing: "-.04em" }, text: "beedaro" },
  { nr: "05", name: "Host Grotesk 700", stil: { fontFamily: "'Host Grotesk'", fontWeight: 700, letterSpacing: "-.045em" }, text: "beedaro" },
  { nr: "06", name: "Space Grotesk 700", stil: { fontFamily: "'Space Grotesk'", fontWeight: 700, letterSpacing: "-.05em" }, text: "beedaro" },
  { nr: "07", name: "Sora 700", stil: { fontFamily: "'Sora'", fontWeight: 700, letterSpacing: "-.05em", fontSize: ".92em" }, text: "beedaro" },
  { nr: "08", name: "Familjen Grotesk 700", stil: { fontFamily: "'Familjen Grotesk'", fontWeight: 700, letterSpacing: "-.03em" }, text: "beedaro" },
  { nr: "09", name: "Unbounded 600, breit und rund", stil: { fontFamily: "'Unbounded'", fontWeight: 600, letterSpacing: "-.04em", fontSize: ".78em" }, text: "beedaro" },
  { nr: "10", name: "Pixelify Sans 600, greift die Kacheln auf", stil: { fontFamily: "'Pixelify Sans'", fontWeight: 600, letterSpacing: "-.01em" }, text: "beedaro" },
];

function Marke({ stil, text, gr, farbe }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: gr * 0.3, color: farbe, lineHeight: 1 }}>
      <BLogo size={gr * 1.05} title="" />
      <span style={{ ...stil, fontSize: `calc(${gr}px * ${parseFloat(stil.fontSize) || 1})` }}>{text}</span>
    </span>
  );
}

export default function Page() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = SCHRIFTEN; document.head.appendChild(link);
    return () => link.remove();
  }, []);
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 120px", fontFamily: "'Instrument Sans', sans-serif", color: "#1D1D1D" }}>
      <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.04em", marginBottom: 6 }}>Wortmarke: welche Schrift neben dem B?</h1>
      <p style={{ opacity: .7, marginBottom: 28 }}>Links gross, in der Mitte so klein wie im Header, rechts auf Ink. Sag mir die Nummer.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {VARIANTEN.map((v) => (
          <section key={v.nr} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 28px", padding: "20px 22px", border: "1px solid #1D1D1D", borderRadius: 22, background: "#fff" }}>
            <span style={{ width: 34, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{v.nr}</span>
            <span style={{ flex: "1 1 300px", minWidth: 0 }}><Marke {...v} gr={56} farbe="#1D1D1D" /></span>
            <span style={{ flex: "0 0 150px" }}><Marke {...v} gr={26} farbe="#1D1D1D" /></span>
            <span style={{ flex: "0 0 auto", padding: "14px 20px", borderRadius: 14, background: "#1D1D1D" }}><Marke {...v} gr={26} farbe="#FFE7A9" /></span>
            <span style={{ flexBasis: "100%", fontSize: 13, opacity: .65, paddingLeft: 62 }}>{v.name}</span>
          </section>
        ))}
      </div>
    </main>
  );
}
