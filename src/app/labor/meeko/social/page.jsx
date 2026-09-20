"use client";
// Social-Media-Posts im Meeko-Look (Denis 20.09.2026). Format 1080 x 1350 (Instagram 4:5, geht auch für Facebook und LinkedIn).
// Ohne Parameter: Übersicht aller Posts, verkleinert. Mit ?nr=3: genau dieser Post in Originalgrösse oben links, ohne alles
// andere. So werden die PNG-Dateien erzeugt (Browser ohne Fenster, Fenstergrösse 1080 x 1350).
// Texte: nur belegte Aussagen (fünf Formate, wählbare Gebühr, 20 % an den Bienenschutz, geschlossene Beta). Keine Fotos von
// Nutzern, keine erfundenen Zahlen.
import { useEffect, useState } from "react";
import BLogo from "@/components/shared/BLogo";

const INK = "#1D1D1D";
const F = { lavendel: "#E3E3FF", himmel: "#E3F2FF", rosa: "#FFE3FB", mint: "#DBF5F0", rose: "#FBEBEA", butter: "#FFE7A9" };
const B = 1080, H = 1350;
const rand = `3px solid ${INK}`;
const blatt = (bg, mehr = {}) => ({ position: "relative", width: B, height: H, overflow: "hidden", background: bg, color: INK, fontFamily: "'Instrument Sans', sans-serif", display: "flex", flexDirection: "column", padding: 84, boxSizing: "border-box", ...mehr });
const titel = (gr = 124) => ({ margin: 0, fontSize: gr, fontWeight: 500, letterSpacing: "-.05em", lineHeight: 1.0 });
const text = { margin: 0, fontSize: 40, lineHeight: 1.3, letterSpacing: "-.02em" };
const marke = { display: "inline-flex", alignSelf: "flex-start", padding: "10px 24px 12px", border: rand, borderRadius: 999, background: "#fff", fontSize: 28, fontWeight: 600, letterSpacing: "-.01em" };

function Fuss({ hell = false }) {
  return (
    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", color: hell ? "#fff" : INK }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 18 }}>
        <BLogo size={62} title="" />
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 52, fontWeight: 700, letterSpacing: "-.05em", lineHeight: 1 }}>beedaro</span>
      </span>
      <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-.01em" }}>beedaro.ch</span>
    </div>
  );
}

const Knopf = ({ children, bg = F.mint }) => (
  <span style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 14, padding: "26px 44px 34px", border: rand, borderRadius: 22, background: bg, fontSize: 40, fontWeight: 600, letterSpacing: "-.02em", boxShadow: "inset 0 -10px 0 rgba(29,29,29,.16)" }}>{children}</span>
);

// 1: der Hauptsatz auf der Hero-Farbe, das B gross angeschnitten
function P1() {
  return (
    <div style={blatt(F.mint)}>
      <div style={{ position: "absolute", right: -190, top: 380, opacity: 1, color: "#fff" }}><BLogo size={760} title="" /></div>
      <span style={{ ...marke, position: "relative" }}>Secondhand aus der Schweiz</span>
      <h1 style={{ ...titel(148), position: "relative", marginTop: 56 }}>Was du suchst, hat schon jemand.</h1>
      <Fuss />
    </div>
  );
}

// 2: Verkäufer ansprechen
function P2() {
  return (
    <div style={blatt(F.lavendel)}>
      <span style={marke}>Für alle mit vollem Keller</span>
      <h1 style={{ ...titel(136), marginTop: 56 }}>Dein Keller hat Inventar.</h1>
      <h1 style={{ ...titel(136), marginTop: 18 }}>Wir haben Käufer.</h1>
      <div style={{ marginTop: 72 }}><Knopf>+ Inserieren</Knopf></div>
      <Fuss />
    </div>
  );
}

// 3: die fünf Formate, jedes auf seiner Tafel
const FORMATE = [["Festpreis", "Preis nennen, verkaufen.", F.rose], ["Auktion", "Startpreis setzen, bieten lassen.", F.lavendel], ["Miete", "Verleihen, was selten gebraucht wird.", F.himmel], ["Gratis", "Verschenken statt entsorgen.", F.butter], ["Service", "Können anbieten, Rechnung inklusive.", F.rosa]];
function P3() {
  return (
    <div style={blatt("#fff", { padding: 72 })}>
      <h1 style={titel(104)}>Fünf Formate.<br />Ein Marktplatz.</h1>
      <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 16 }}>
        {FORMATE.map(([n, t, bg]) => (
          <div key={n} style={{ display: "flex", alignItems: "baseline", gap: 28, padding: "26px 36px 30px", border: rand, borderRadius: 32, background: bg }}>
            <span style={{ flex: "0 0 250px", fontSize: 50, fontWeight: 600, letterSpacing: "-.04em" }}>{n}</span>
            <span style={{ fontSize: 31, lineHeight: 1.25, letterSpacing: "-.01em" }}>{t}</span>
          </div>
        ))}
      </div>
      <Fuss />
    </div>
  );
}

// 4: wählbare Gebühr, 20 % an den Bienenschutz
const STUFEN = [["3 %", "Fair"], ["5 %", "Supporter"], ["7 %", "Impact"], ["10 %", "Bee Hero"]];
function P4() {
  return (
    <div style={blatt(F.butter)}>
      <span style={marke}>Bee-Rate</span>
      <h1 style={{ ...titel(128), marginTop: 48 }}>Du wählst die Gebühr.</h1>
      <div style={{ marginTop: 52, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {STUFEN.map(([p, n], i) => (
          <div key={p} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "26px 34px 30px", border: rand, borderRadius: 30, background: i === 2 ? F.mint : "#fff" }}>
            <span style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-.02em" }}>{n}</span>
            <span style={{ fontSize: 60, fontWeight: 500, letterSpacing: "-.05em" }}>{p}</span>
          </div>
        ))}
      </div>
      <p style={{ ...text, marginTop: 44, maxWidth: 820 }}>Nur bei Verkauf. 20 % jeder Gebühr gehen an den Bienenschutz.</p>
      <Fuss />
    </div>
  );
}

// 5: Miete
function P5() {
  return (
    <div style={blatt(F.himmel)}>
      <span style={marke}>Miete</span>
      <h1 style={{ ...titel(124), marginTop: 56 }}>Die Bohrmaschine brauchst du einmal im Jahr.</h1>
      <p style={{ ...text, fontSize: 56, fontWeight: 500, letterSpacing: "-.04em", marginTop: 48 }}>Miet sie. Oder vermiete deine.</p>
      <Fuss />
    </div>
  );
}

// 6: Beta, dunkel als Gegenpol
function P6() {
  return (
    <div style={blatt(INK, { color: "#fff" })}>
      <span style={{ ...marke, background: F.mint, color: INK, borderColor: F.mint }}>Geschlossene Beta</span>
      <h1 style={{ ...titel(140), marginTop: 56, color: "#fff" }}>Wir suchen Leute, die alles kaputt testen.</h1>
      <div style={{ marginTop: 64 }}><span style={{ display: "inline-flex", padding: "26px 44px 34px", borderRadius: 22, background: "#fff", color: INK, fontSize: 40, fontWeight: 600, letterSpacing: "-.02em", boxShadow: "inset 0 -10px 0 rgba(29,29,29,.16)" }}>beedaro.ch/bewerben</span></div>
      <Fuss hell />
    </div>
  );
}

const POSTS = [P1, P2, P3, P4, P5, P6];

export default function Page() {
  const [nr, setNr] = useState(null);
  useEffect(() => { const n = parseInt(new URLSearchParams(window.location.search).get("nr") || "0", 10); setNr(n >= 1 && n <= POSTS.length ? n : 0); }, []);
  if (nr === null) return null;
  if (nr > 0) { const P = POSTS[nr - 1]; return <div style={{ position: "fixed", left: 0, top: 0, zIndex: 99999, zoom: "calc(1 / var(--bd-zoom, 1))" }}><P /></div>; }
  const k = 0.3;
  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 120px", fontFamily: "'Instrument Sans', sans-serif", color: INK }}>
      <h1 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-.04em", margin: "0 0 6px" }}>Social-Media-Posts</h1>
      <p style={{ opacity: .7, margin: "0 0 28px" }}>1080 x 1350 px. Die fertigen PNG-Dateien liegen im Ordner social-posts im Projekt.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {POSTS.map((P, i) => (
          <div key={i} style={{ width: B * k, height: H * k, border: `1px solid ${INK}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ transform: `scale(${k})`, transformOrigin: "0 0", width: B, height: H }}><P /></div>
          </div>
        ))}
      </div>
    </main>
  );
}
