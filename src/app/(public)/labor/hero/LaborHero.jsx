"use client";
// Steuerleiste der Test-Route /labor/hero (Denis 19.09.2026): Farbschema und Schrift des
// Bänder-Heros live durchschalten. Die Test-Schriften werden nur hier nachgeladen (Fontshare
// und Google Fonts), die Seite selbst bleibt bei General Sans und Manrope. Die Auswahl steht
// auch in der Adresse (?farbe=…&schrift=…), damit man einen Stand weitergeben kann.
import { useEffect, useState } from "react";
import BandHero from "@/components/home/BandHero";
import { Categories } from "@/components/home/Categories";
import { FormatTiles } from "@/components/home/FormatTiles";
import { NewListings } from "@/components/home/NewListings";

const FARBEN = [
  { key: "teal", label: "Teal-hell (jetzt)" },
  { key: "weiss", label: "Weiss mit Rand" },
  { key: "grau", label: "Hellgrau" },
  { key: "honig", label: "Blassgelb" },
  { key: "dunkel", label: "Dunkel" },
];
const SCHRIFTEN = [
  { key: "General Sans", label: "General Sans (jetzt)" },
  { key: "Switzer", label: "Switzer" },
  { key: "Satoshi", label: "Satoshi" },
  { key: "Inter", label: "Inter" },
  { key: "Archivo", label: "Archivo" },
];
const QUELLEN = [
  "https://api.fontshare.com/v2/css?f[]=switzer@700,800&f[]=satoshi@700,900&display=swap",
  "https://fonts.googleapis.com/css2?family=Inter:wght@700;800&family=Archivo:wght@700;800&display=swap",
];

export default function LaborHero() {
  const [farbe, setFarbe] = useState("teal");
  const [schrift, setSchrift] = useState("General Sans");

  useEffect(() => {
    const links = QUELLEN.map((href) => {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); return l;
    });
    try {
      const q = new URLSearchParams(window.location.search);
      if (FARBEN.some((f) => f.key === q.get("farbe"))) setFarbe(q.get("farbe"));
      if (SCHRIFTEN.some((f) => f.key === q.get("schrift"))) setSchrift(q.get("schrift"));
    } catch {}
    return () => links.forEach((l) => l.remove());
  }, []);

  useEffect(() => {
    try {
      const q = new URLSearchParams({ farbe, schrift });
      window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
    } catch {}
  }, [farbe, schrift]);

  const pille = (aktiv) => ({
    padding: "6px 12px", border: `1px solid ${aktiv ? "#191615" : "#E5E8EC"}`, background: aktiv ? "#191615" : "#fff",
    color: aktiv ? "#fff" : "#191615", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
  });

  return (
    <>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px 0" }}>
        <div style={{ border: "1px dashed #D5D9DF", borderRadius: 12, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#5B626C", width: 58 }}>Farbe</span>
            {FARBEN.map((f) => <button key={f.key} type="button" className="kein-akzent" onClick={() => setFarbe(f.key)} style={pille(farbe === f.key)}>{f.label}</button>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#5B626C", width: 58 }}>Schrift</span>
            {SCHRIFTEN.map((f) => <button key={f.key} type="button" className="kein-akzent" onClick={() => setSchrift(f.key)} style={{ ...pille(schrift === f.key), fontFamily: `"${f.key}", sans-serif` }}>{f.label}</button>)}
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: "#686E78" }}>Testleiste, nur auf dieser Seite. Weiter unten bei «Neu eingestellt»: mit der Maus über eine Karte fahren zeigt am unteren Bildrand eine Leiste mit Zustand und Versand.</p>
        </div>
      </div>
      <BandHero farbe={farbe} schrift={schrift} />
      <Categories />
      <FormatTiles />
      <div className="lab-hoverinfo"><NewListings /></div>
    </>
  );
}
