"use client";
// Gemeinsame Einsatzwahl der Tagesspiele: 5 / 10 / 20 Pollen + Start-Knopf.
import { Loader2 } from "lucide-react";
import { colors, fonts } from "@/lib/theme";

const K = { ink: "#191615", honey: "#F4C03F", hairline: "#E4E0D8", chip: "#F2EEE7" };
export const EINSAETZE = [5, 10, 20];

export default function EinsatzWahl({ pollen, einsatz, setEinsatz, onStart, busy, icon: Icon, label = "Spielen" }) {
  const zuWenig = (pollen || 0) < 5;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
      {EINSAETZE.map(e => {
        const aktiv = einsatz === e, moeglich = (pollen || 0) >= e;
        return (
          <button key={e} type="button" disabled={!moeglich} onClick={() => setEinsatz(e)}
            style={{ padding: "7px 14px", borderRadius: 999, border: `1.5px solid ${aktiv ? K.ink : K.hairline}`, background: aktiv ? K.ink : "#fff", color: aktiv ? "#fff" : (moeglich ? K.ink : colors.mutedLt), fontSize: 13, fontWeight: 700, fontFamily: fonts.body, cursor: moeglich ? "pointer" : "not-allowed" }}>
            {e} Pollen
          </button>
        );
      })}
      <button type="button" disabled={busy || zuWenig || (pollen || 0) < einsatz} onClick={onStart}
        style={{ marginLeft: "auto", padding: "9px 18px", borderRadius: 999, border: "none", background: zuWenig ? K.chip : K.honey, color: zuWenig ? colors.mutedLt : K.ink, fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: zuWenig ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
        {busy ? <Loader2 size={14} className="spin" /> : (Icon ? <Icon size={14} /> : null)} {label}
      </button>
    </div>
  );
}
