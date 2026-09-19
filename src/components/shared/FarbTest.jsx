"use client";
// Farbtest (Denis 19.09.2026): schaltet die Seite probeweise auf die Pastell-Palette um.
// Einschalten mit ?farben=pastell in der Adresse, ausschalten mit ?farben=aus oder über die
// kleine Pille unten links. Die Wahl bleibt im Browser gespeichert, andere Besucher sehen
// weiter die normalen Farben. Die Farben selbst stehen in globals.css unter FARBTEST PASTELL.
import { useEffect, useState } from "react";

const KEY = "bd-farbtest";

export default function FarbTest() {
  const [an, setAn] = useState(false);

  useEffect(() => {
    let wert = null;
    try {
      const q = new URLSearchParams(window.location.search).get("farben");
      if (q === "pastell") localStorage.setItem(KEY, "pastell");
      if (q === "aus") localStorage.removeItem(KEY);
      wert = localStorage.getItem(KEY);
    } catch {}
    setAn(wert === "pastell");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("bd-pastell", an);
  }, [an]);

  if (!an) return null;
  const aus = () => { try { localStorage.removeItem(KEY); } catch {} setAn(false); };
  // Bewusst klein: Auf dem Handy verdeckte die erste, breite Fassung den halben Hero.
  return (
    <button type="button" onClick={aus} className="no-print kein-akzent" title="Farbtest Pastell ausschalten" style={{ position: "fixed", left: 8, bottom: 70, zIndex: 9500, border: "none", borderRadius: 999, padding: "4px 10px", background: "#191615", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", opacity: 0.85 }}>
      Pastell aus
    </button>
  );
}
