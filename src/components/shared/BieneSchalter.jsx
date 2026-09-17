"use client";
// Footer-Schalter fuer die Easter-Egg-Biene (Sturzi8 17.09.: "Ausschaltknopf").
// Speichert pro Geraet; FlyingBee hoert auf das Ereignis und landet sofort.
import { useEffect, useState } from "react";
import { BIENE_AUS_KEY, bieneIstAus } from "./FlyingBee";

export default function BieneSchalter() {
  const [aus, setAus] = useState(false);
  useEffect(() => { setAus(bieneIstAus()); }, []);
  const toggle = () => {
    const n = !aus;
    try { localStorage.setItem(BIENE_AUS_KEY, n ? "1" : "0"); } catch {}
    setAus(n);
    window.dispatchEvent(new Event("beedaro-biene"));
  };
  return (
    <button type="button" onClick={toggle} title={aus ? "Die Biene fliegt wieder" : "Die Biene bleibt weg (pro Gerät gemerkt)"}
      style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: "rgba(25,22,21,.45)", cursor: "pointer", fontFamily: "inherit" }}>
      {aus ? "Biene an" : "Biene aus"}
    </button>
  );
}
