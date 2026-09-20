"use client";
// Farbprüfung mit dem color-expert-Skill (20.09.2026). Oben die heutigen Pastelle, unten ein Vorschlag, der in OKLCH auf
// gleiche Helligkeit und ähnliche Farbkraft gebracht ist. Gemessen: Himmel und Mint liegen heute am engsten beieinander
// (OKLab-Abstand 2.7), danach Rosé und Rosa (3.6). Im Vorschlag 4.1 und 4.0.
const INK = "#1D1D1D";
const REIHEN = [
  ["Heute", [["Festpreis", "Rosé", "#FBEBEA"], ["Auktion", "Lavendel", "#E3E3FF"], ["Miete", "Himmel", "#E3F2FF"], ["Gratis", "Butter", "#FFE7A9"], ["Service", "Rosa", "#FFE3FB"], ["Hero, gewählt", "Mint", "#DBF5F0"]]],
  ["Vorschlag", [["Festpreis", "Rosé", "#FFE2DE"], ["Auktion", "Lavendel", "#E3E3FF"], ["Miete", "Himmel", "#D3F0FF"], ["Gratis", "Butter", "#FEE8B0"], ["Service", "Rosa", "#FFDFF9"], ["Hero, gewählt", "Mint", "#CEF6E8"]]],
];

export default function Page() {
  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 120px", fontFamily: "'Instrument Sans', sans-serif", color: INK }}>
      <h1 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-.04em", margin: "0 0 6px" }}>Pastelle: heute und Vorschlag</h1>
      <p style={{ opacity: .7, margin: "0 0 32px", maxWidth: "48em" }}>Achte auf zwei Paare: Miete neben Mint, und Festpreis neben Service. Im Vorschlag sind sie leichter auseinanderzuhalten, Rosé hat etwas mehr Farbe, Lavendel bleibt gleich.</p>
      {REIHEN.map(([name, farben]) => (
        <section key={name} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 12px" }}>{name}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {farben.map(([rolle, n, hex]) => (
              <div key={rolle} style={{ border: `1px solid ${INK}`, borderRadius: 20, overflow: "hidden", background: "#fff" }}>
                <div style={{ height: 120, background: hex, borderBottom: `1px solid ${INK}`, display: "flex", alignItems: "flex-end", padding: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: `1px solid ${INK}`, background: "#fff" }}>{rolle}</span>
                </div>
                <div style={{ padding: "10px 12px 12px" }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{n}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#5B626C" }}>{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
