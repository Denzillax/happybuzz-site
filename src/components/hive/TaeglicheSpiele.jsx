"use client";
// Tägliche Spiele im Hive (Denis, 16.09.2026): drei Spiele als Reiter,
// jedes einmal pro Tag mit Pollen-Einsatz. Der Reiter merkt sich pro Gerät.
import { useEffect, useState } from "react";
import { Hexagon, Feather, Flower2 } from "lucide-react";
import { fonts } from "@/lib/theme";
import WabenSpiel from "./WabenSpiel";
import Bienenflug from "./Bienenflug";
import Bluetenpaar from "./Bluetenpaar";

const K = { ink: "#14110D", hairline: "#E4E0D8", chip: "#F2EEE7" };
const SPIELE = [
  { key: "waben", name: "Wabenspiel", Icon: Hexagon, Komp: WabenSpiel },
  { key: "flug", name: "Bienenflug", Icon: Feather, Komp: Bienenflug },
  { key: "paar", name: "Blütenpaar", Icon: Flower2, Komp: Bluetenpaar },
];

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
