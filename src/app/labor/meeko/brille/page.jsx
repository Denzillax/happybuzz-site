import fs from "fs";
import path from "path";
// Brillen-Animationen zum Vergleichen (Denis 22.09.2026: die Jalousie gefiel nicht). Sechs Arten, derselbe Tiger.
// Der Tiger kommt aus public/tiger-hero.svg, hier sechsmal eingebettet, weil Animationen auf Innenteilen nur so greifen.
// Im style-Block stehen bewusst keine Kind-Selektoren und keine Anführungszeichen.
const VARIANTEN = [
  ["1", "Jalousie", "Die Lamellen gehen auf und zu, Reihe für Reihe. Der bisherige Stand."],
  ["2", "Lauflicht", "Ein gelber Blitz läuft von oben nach unten durch die Lamellen, wie bei einer Anzeigetafel."],
  ["3", "Farbfluss", "Die fünf Formatfarben fliessen nacheinander durch die Lamellen nach unten."],
  ["4", "Lichtreflex", "Ein weisser Lichtstreif zieht alle paar Sekunden schräg über beide Gläser, wie bei echten Sonnenbrillen."],
  ["5", "Cool nicken", "Die ganze Brille neigt sich langsam hin und her, der Kopf bleibt still."],
  ["6", "Neon", "Die Lamellen flackern wie eine Leuchtreklame, ab und zu springt eine auf Gelb."],
];
export default function Page() {
  const roh = fs.readFileSync(path.join(process.cwd(), "public", "tiger-hero.svg"), "utf8");
  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 140px", fontFamily: "'Instrument Sans', sans-serif", color: "#1D1D1D" }}>
      <style>{`
        .br-raster { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
        .br-feld { border: 1px solid #1D1D1D; border-radius: 20px; padding: 18px; background: #CEF6E8; }
        .br-feld svg { display: block; width: 100%; height: auto; }
        .br-name { margin: 14px 0 4px; font-size: 18px; font-weight: 600; }
        .br-text { margin: 0; font-size: 14px; line-height: 1.5; opacity: .75; }
        @media (max-width: 860px) { .br-raster { grid-template-columns: 1fr; } }
        .v1 .tg-lamelle { animation: br-jalousie 3.6s cubic-bezier(.45,0,.55,1) infinite; }
        .v1 .r1 { animation-delay: .12s } .v1 .r2 { animation-delay: .24s } .v1 .r3 { animation-delay: .36s }
        @keyframes br-jalousie { 0%, 100% { transform: scaleY(1) } 45%, 55% { transform: scaleY(.16) } }
        .v2 .tg-lamelle { animation: br-lauf 2.4s linear infinite; }
        .v2 .r1 { animation-delay: .16s } .v2 .r2 { animation-delay: .32s } .v2 .r3 { animation-delay: .48s }
        @keyframes br-lauf { 0%, 30%, 100% { fill: #FF9EE0 } 8% { fill: #F4C03F } 16% { fill: #fff } }
        .v3 .tg-lamelle { animation: br-fluss 5s linear infinite; }
        .v3 .r1 { animation-delay: -.5s } .v3 .r2 { animation-delay: -1s } .v3 .r3 { animation-delay: -1.5s }
        @keyframes br-fluss { 0% { fill: #FFE2DE } 20% { fill: #E3E3FF } 40% { fill: #D3F0FF } 60% { fill: #E1F2D8 } 80% { fill: #FFDFF9 } 100% { fill: #FFE2DE } }
        .v4 .tg-streif { opacity: 1; animation: br-reflex 4.5s cubic-bezier(.4,0,.2,1) infinite; }
        @keyframes br-reflex { 0%, 55% { transform: rotate(22deg) translateX(-140px) } 100% { transform: rotate(22deg) translateX(1000px) } }
        .v4 .tg-streif { transform-box: view-box; transform-origin: 627px 470px; }
        .v5 .tg-brille-a, .v5 .tg-brille-b { animation: br-nicken 4s ease-in-out infinite; }
        @keyframes br-nicken { 0%, 100% { transform: rotate(-3deg) translateY(0) } 50% { transform: rotate(3deg) translateY(4px) } }
        .v6 .tg-lamelle { animation: br-neon 3.2s steps(1, end) infinite; }
        .v6 .r1 { animation-delay: -.7s } .v6 .r2 { animation-delay: -1.9s } .v6 .r3 { animation-delay: -1.1s }
        @keyframes br-neon { 0%, 100% { opacity: 1 } 6% { opacity: .35 } 8% { opacity: 1 } 31% { opacity: 1 } 33% { opacity: .2 } 35% { opacity: 1 } 62% { fill: #FF9EE0 } 64% { fill: #F4C03F } 70% { fill: #FF9EE0 } 83% { opacity: .5 } 86% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .tg-lamelle, .tg-streif, .tg-brille-a, .tg-brille-b { animation: none !important; } }
      `}</style>
      <h1 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-.04em", margin: "0 0 6px" }}>Brille: sechs Animationen</h1>
      <p style={{ opacity: .7, margin: "0 0 32px", maxWidth: "46em" }}>Derselbe Tiger, nur die Brille bewegt sich anders. Sag mir die Nummer.</p>
      <div className="br-raster">
        {VARIANTEN.map(([nr, name, text]) => (
          <div key={nr} className={`br-feld v${nr}`}>
            <div dangerouslySetInnerHTML={{ __html: roh }} />
            <p className="br-name"><b>{nr}</b> {name}</p>
            <p className="br-text">{text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
