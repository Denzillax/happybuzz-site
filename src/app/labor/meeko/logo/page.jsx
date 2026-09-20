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

// Icon-Vorschläge für Favicon und App-Icon: Fläche plus B. Das B füllt 58 % der Kachel, damit es auch im Kreis-Zuschnitt
// von Android ganz bleibt (sichere Zone 80 %).
const ICONS = [
  { nr: "A", name: "Ink auf Butter", bg: "#FFE7A9", fg: "#1D1D1D" },
  { nr: "B", name: "Butter auf Ink", bg: "#1D1D1D", fg: "#FFE7A9" },
  { nr: "C", name: "Weiss auf Ink", bg: "#1D1D1D", fg: "#FFFFFF" },
  { nr: "D", name: "Zitrone auf Ink (Farbe aus deiner Logo-Datei)", bg: "#1D1D1D", fg: "#FBF062" },
  { nr: "E", name: "Ink auf Lavendel", bg: "#E3E3FF", fg: "#1D1D1D" },
  { nr: "F", name: "Ink auf Weiss mit Rand", bg: "#FFFFFF", fg: "#1D1D1D", rand: true },
];
function Icon({ v, gr, rund }) {
  return (
    <span style={{ width: gr, height: gr, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: v.bg, color: v.fg,
      borderRadius: rund ? "50%" : gr * 0.22, boxShadow: v.rand ? "inset 0 0 0 1px #1D1D1D" : "none" }}>
      <BLogo size={gr * 0.58} title="" />
    </span>
  );
}
function Tab({ v, dunkel }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, width: 190, padding: "8px 12px", borderRadius: "10px 10px 0 0", background: dunkel ? "#2B2B2F" : "#F1F3F5", color: dunkel ? "#E8E8EA" : "#1D1D1D", fontSize: 12.5, borderBottom: dunkel ? "2px solid #2B2B2F" : "2px solid #F1F3F5" }}>
      <Icon v={v} gr={16} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>BEEDARO: Kaufen, Verkaufen</span>
    </span>
  );
}

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
      <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-.04em", margin: "56px 0 6px" }}>Favicon und App-Icon: welche Farbe?</h2>
      <p style={{ opacity: .7, marginBottom: 24 }}>Gross wie auf dem Homescreen, daneben der Kreis-Zuschnitt von Android, dann 64, 32 und 16 Pixel und zuletzt im hellen und im dunklen Browser-Tab.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ICONS.map((v) => (
          <section key={v.nr} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 22px", padding: "20px 22px", border: "1px solid #1D1D1D", borderRadius: 22, background: "#fff" }}>
            <span style={{ width: 34, fontSize: 15, fontWeight: 700 }}>{v.nr}</span>
            <Icon v={v} gr={120} />
            <Icon v={v} gr={120} rund />
            <Icon v={v} gr={64} />
            <Icon v={v} gr={32} />
            <Icon v={v} gr={16} />
            <span style={{ display: "inline-flex", flexDirection: "column", gap: 8 }}><Tab v={v} /><Tab v={v} dunkel /></span>
            <span style={{ flexBasis: "100%", fontSize: 13, opacity: .65, paddingLeft: 56 }}>{v.name}</span>
          </section>
        ))}
      </div>
    </main>
  );
}
