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

// Farbiges B (Denis 20.09.2026: "kannst du das Logo auch färben"). Hier sind B und Kacheln getrennte Flächen, damit jede
// ihre Farbe bekommt. Die Kacheln an der B-Kante ragen 3 Einheiten unter das B, das B liegt darüber: keine Haarlinie.
const B_PFAD = "M828.18,480.94c-25.47-16.41-53.33-27.63-83.53-33.67v-9.55c30.21-6.04,58.06-17.26,83.53-33.67,25.37-16.41,45.7-38.64,60.84-66.71,15.11-28.04,22.68-62.79,22.68-104.26s-10.23-80.91-30.42-115.88c-20.38-34.98-51.16-63.25-92.64-84.83C747.22,10.82,694.53,0,630.65,0h-99.65v885h99.65c63.88,0,116.57-10.82,157.99-32.37,41.47-21.58,72.25-49.85,92.64-84.83,20.19-34.97,30.42-73.61,30.42-115.88s-7.57-76.23-22.68-104.26c-15.14-28.08-35.47-50.3-60.84-66.71Z";
// von oben nach unten, damit sich Farbverläufe lesen lassen: [x, y, Breite]
const KACHELN = [[354, 0.5, 180], [177, 177.5, 177], [0, 354.5, 177], [354, 354.5, 180], [177, 531.5, 177], [354, 708.5, 180]];
function FarbB({ size, b, k }) {
  return (
    <svg width={size} height={(size * 885.5) / 911.7} viewBox="0 0 911.7 885.5" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      {KACHELN.map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={177} fill={k[i % k.length]} />)}
      <path d={B_PFAD} fill={b} />
    </svg>
  );
}
const INK = "#1D1D1D", BUTTER = "#FFE7A9";
// kräftige Geschwister der Meeko-Pastelltöne: die Pastelle selbst sind auf Weiss zu blass für ein Zeichen
const KRAFT = ["#FFC94D", "#9B8CFF", "#FF8FD8", "#5DB8FF", "#4FD1B5", "#FF8A7A"];
const PASTELL6 = ["#FFE7A9", "#E3E3FF", "#FFE3FB", "#E3F2FF", "#DBF5F0", "#FBEBEA"];
const FARBIG = [
  { nr: "G", name: "Bunte Kacheln, Ink-B, auf Weiss: jede Kachel eine kräftige Formatfarbe", bg: "#FFFFFF", b: INK, k: KRAFT, rand: true },
  { nr: "H", name: "Bunte Kacheln, weisses B, auf Ink", bg: INK, b: "#FFFFFF", k: KRAFT },
  { nr: "I", name: "Pastell-Kacheln, Butter-B, auf Ink: die Farben der Seite", bg: INK, b: BUTTER, k: PASTELL6 },
  { nr: "J", name: "Verlauf Butter nach Rosa in den Kacheln, Ink-B, auf Butter", bg: BUTTER, b: INK, k: ["#1D1D1D", "#5A3A1E", "#8C4A2E", "#B5473F", "#C2255C", "#C2255C"] },
  { nr: "K", name: "Eine einzige Akzent-Kachel in Himbeer, Rest Ink, auf Butter", bg: BUTTER, b: INK, k: [INK, INK, "#C2255C", INK, INK, INK] },
  { nr: "L", name: "Kacheln lösen sich auf: Ink in drei Stufen, auf Butter", bg: BUTTER, b: INK, k: [INK, "rgba(29,29,29,.7)", "rgba(29,29,29,.4)", INK, "rgba(29,29,29,.7)", INK] },
  { nr: "M", name: "Lavendel-B mit Mint und Rosa, auf Ink", bg: INK, b: "#C9C4FF", k: ["#8EE3CF", "#FFB3EE", "#FFE7A9", "#8EE3CF", "#FFB3EE", "#8EE3CF"] },
  { nr: "N", name: "Weisse Kacheln, Ink-B, auf kräftigem Butter", bg: "#FFCF5A", b: INK, k: ["#FFFFFF"] },
];
// Einfarbiges Logo in Pastell-Kombinationen (Denis 20.09.2026). Drei Familien: Ink auf Pastell, Pastell auf Ink, und der
// kräftige Ton auf seinem eigenen Pastell (Ton in Ton). Der Kontrast steht dabei, ab etwa 3 bleibt ein Zeichen bei 16 px lesbar.
const TOENE = [["Butter", "#FFE7A9", "#B97A00"], ["Lavendel", "#E3E3FF", "#5B4BDB"], ["Rosa", "#FFE3FB", "#C2259B"], ["Himmel", "#E3F2FF", "#1F6FCC"], ["Mint", "#DBF5F0", "#0F7F6B"], ["Rosé", "#FBEBEA", "#C2453A"]];
const lum = (hex) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const kontrast = (a, b) => { const [h, d] = [lum(a), lum(b)].sort((x, y) => y - x); return ((h + 0.05) / (d + 0.05)).toFixed(1); };
const EINFARBIG = [
  ...TOENE.map(([n, hell], i) => ({ nr: `P${i + 1}`, name: `Ink auf ${n}`, bg: hell, b: INK })),
  ...TOENE.map(([n, hell], i) => ({ nr: `Q${i + 1}`, name: `${n} auf Ink`, bg: INK, b: hell })),
  ...TOENE.map(([n, hell, kraft], i) => ({ nr: `R${i + 1}`, name: `Ton in Ton: kräftiges ${n} auf ${n}`, bg: hell, b: kraft })),
  ...TOENE.map(([n, hell, kraft], i) => ({ nr: `S${i + 1}`, name: `${n} auf kräftigem ${n}`, bg: kraft, b: hell })),
  { nr: "T1", name: "Lavendel auf Butter (Pastell auf Pastell)", bg: "#FFE7A9", b: "#E3E3FF" },
  { nr: "T2", name: "Mint auf Rosa (Pastell auf Pastell)", bg: "#FFE3FB", b: "#DBF5F0" },
].map((v) => ({ ...v, k: [v.b], rand: lum(v.bg) > 0.85 }));

function FarbIcon({ v, gr, rund }) {
  return (
    <span style={{ width: gr, height: gr, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: v.bg, borderRadius: rund ? "50%" : gr * 0.22, boxShadow: v.rand ? "inset 0 0 0 1px #1D1D1D" : "none" }}>
      <FarbB size={gr * 0.58} b={v.b} k={v.k} />
    </span>
  );
}
function FarbTab({ v, dunkel }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, width: 190, padding: "8px 12px", borderRadius: "10px 10px 0 0", background: dunkel ? "#2B2B2F" : "#F1F3F5", color: dunkel ? "#E8E8EA" : "#1D1D1D", fontSize: 12.5 }}>
      <FarbIcon v={v} gr={16} />
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
      <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-.04em", margin: "56px 0 6px" }}>Farbiges Logo</h2>
      <p style={{ opacity: .7, marginBottom: 24 }}>Icon gross, im Kreis, in 32 und 16 Pixel, in den Tabs, und ganz rechts als Logo mit Wortmarke im Header.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FARBIG.map((v) => (
          <section key={v.nr} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 22px", padding: "20px 22px", border: "1px solid #1D1D1D", borderRadius: 22, background: "#fff" }}>
            <span style={{ width: 34, fontSize: 15, fontWeight: 700 }}>{v.nr}</span>
            <FarbIcon v={v} gr={120} />
            <FarbIcon v={v} gr={120} rund />
            <FarbIcon v={v} gr={32} />
            <FarbIcon v={v} gr={16} />
            <span style={{ display: "inline-flex", flexDirection: "column", gap: 8 }}><FarbTab v={v} /><FarbTab v={v} dunkel /></span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "12px 18px", borderRadius: 999, border: "1px solid #1D1D1D", background: v.bg === INK ? INK : "#fff", color: v.bg === INK ? "#fff" : INK }}>
              <FarbB size={30} b={v.bg === INK ? v.b : INK} k={v.k} />
              <span style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 24, letterSpacing: "-.05em", lineHeight: 1 }}>beedaro</span>
            </span>
            <span style={{ flexBasis: "100%", fontSize: 13, opacity: .65, paddingLeft: 56 }}>{v.name}</span>
          </section>
        ))}
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-.04em", margin: "56px 0 6px" }}>Einfarbiges Logo in Pastell-Kombinationen</h2>
      <p style={{ opacity: .7, marginBottom: 24 }}>P: Ink auf Pastell. Q: Pastell auf Ink. R: Ton in Ton. S: Pastell auf seinem kräftigen Ton. T: Pastell auf Pastell. Die Zahl ist der Kontrast zwischen Zeichen und Fläche.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {EINFARBIG.map((v) => (
          <section key={v.nr} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 14px", padding: "16px 18px", border: "1px solid #1D1D1D", borderRadius: 22, background: "#fff" }}>
            <FarbIcon v={v} gr={96} />
            <FarbIcon v={v} gr={96} rund />
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}><FarbIcon v={v} gr={32} /><FarbIcon v={v} gr={16} /></span>
            <span style={{ flexBasis: "100%", display: "inline-flex", flexDirection: "column", gap: 6 }}><FarbTab v={v} /><FarbTab v={v} dunkel /></span>
            <span style={{ flexBasis: "100%", fontSize: 13 }}><strong>{v.nr}</strong> <span style={{ opacity: .7 }}>{v.name}. Kontrast {kontrast(v.bg, v.b)}</span></span>
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
