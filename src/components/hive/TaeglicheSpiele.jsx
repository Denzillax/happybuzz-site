"use client";
// Tägliche Spiele im Hive (Denis, 16.09.2026): drei Spiele als Reiter,
// jedes einmal pro Tag mit Pollen-Einsatz. Der Reiter merkt sich pro Gerät.
import { useEffect, useState } from "react";
import { Hexagon, Footprints, Flower2, Spade, ArrowRight } from "lucide-react";
import Link from "next/link";
import { fonts } from "@/lib/theme";
import WabenSpiel from "./WabenSpiel";
import Pollenpfad from "./Pollenpfad";
import Bluetenpaar from "./Bluetenpaar";

const K = { ink: "#191615", hairline: "#E4E0D8", chip: "#F2EEE7" };
const SPIELE = [
  { key: "waben", name: "Wabenspiel", Icon: Hexagon, Komp: WabenSpiel },
  { key: "pfad", name: "Pollenpfad", Icon: Footprints, Komp: Pollenpfad },
  { key: "paar", name: "Blütenpaar", Icon: Flower2, Komp: Bluetenpaar },
  { key: "poker", name: "Poker", Icon: Spade, Komp: PokerTeaser },
];

// Poker laeuft auf eigener Seite (Tische, Haende ueber Tage). Hier nur der Einstieg.
function PokerTeaser() {
  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.5, color: "#191615" }}>
        Texas Hold'em gegen andere Bienen, mit Pollen als Chips. Zeitversetzt: wer am Zug ist, hat 12 Stunden und bekommt eine Meldung. Buy-in 20, 50 oder 100 Pollen, 2 bis 6 Plätze.
      </p>
      <Link href="/poker" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 999, background: "#F4C03F", color: "#191615", fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, textDecoration: "none" }}>
        <Spade size={14} /> Zu den Tischen <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function TaeglicheSpiele({ pollen, onPollen }) {
  const [aktiv, setAktiv] = useState("waben");
  useEffect(() => { try { const k = localStorage.getItem("beedaro_spiel"); if (SPIELE.some(s => s.key === k)) setAktiv(k); } catch {} }, []);
  const wechseln = (k) => { setAktiv(k); try { localStorage.setItem("beedaro_spiel", k); } catch {} };
  const S = SPIELE.find(s => s.key === aktiv) || SPIELE[0];

  return (
    <div>
      <div role="tablist" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {SPIELE.map(s => {
          const on = s.key === aktiv;
          return (
            <button key={s.key} role="tab" aria-selected={on} type="button" onClick={() => wechseln(s.key)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999, border: `1.5px solid ${on ? K.ink : K.hairline}`, background: on ? K.ink : "#fff", color: on ? "#fff" : K.ink, fontSize: 12.5, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>
              <s.Icon size={13} /> {s.name}
            </button>
          );
        })}
      </div>
      {/* key erzwingt frisches Laden beim Reiterwechsel */}
      <S.Komp key={S.key} pollen={pollen} onPollen={onPollen} />
    </div>
  );
}
