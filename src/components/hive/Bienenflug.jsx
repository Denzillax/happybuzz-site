"use client";
// Bienenflug (Denis, 16.09.2026): Hoeher oder Tiefer mit Karten 1..12.
// Jeder Treffer hebt den Multiplikator (1.3 / 1.7 / 2.3 / 3.2 / 4.5 / 6.5),
// gleich = verloren, nach 6 Treffern wird automatisch mitgenommen.
// Entschieden wird alles in den RPCs flug_heute/start/tipp/mitnehmen.
import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, HandCoins, Feather } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import EinsatzWahl from "./EinsatzWahl";

const K = { ink: "#14110D", honey: "#F4C03F", petrol: "#0B5E5C", hairline: "#E4E0D8", chip: "#F2EEE7" };
const MULTI = [0, 1.3, 1.7, 2.3, 3.2, 4.5, 6.5];

function Karte({ wert, gross, matt }) {
  return (
    <div style={{ width: gross ? 76 : 40, height: gross ? 104 : 56, borderRadius: 10, background: matt ? K.chip : "#fff", border: `1.5px solid ${matt ? K.hairline : K.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'General Sans','Manrope',sans-serif", fontWeight: 700, fontSize: gross ? 34 : 17, color: matt ? colors.muted : K.ink, flexShrink: 0, boxShadow: gross ? "0 6px 18px rgba(20,17,13,.12)" : "none" }}>
      {wert}
    </div>
  );
}

export default function Bienenflug({ pollen, onPollen }) {
  const [spiel, setSpiel] = useState(undefined);
  const [einsatz, setEinsatz] = useState(10);
  const [busy, setBusy] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const [letzter, setLetzter] = useState(null); // true/false nach dem letzten Tipp

  useEffect(() => {
    supabase.rpc("flug_heute").then(({ data }) => setSpiel(data?.ok ? data.spiel : null));
  }, []);

  const start = async () => {
    if (busy) return;
    setBusy(true); setHinweis(""); setLetzter(null);
    const { data, error } = await supabase.rpc("flug_start", { p_einsatz: einsatz });
    setBusy(false);
    if (error || !data?.ok) {
      const e = data?.error;
      setHinweis(e === "zu_wenig" ? "Zu wenig Pollen für diesen Einsatz." : e === "heute_gespielt" ? "Heute schon gespielt. Morgen wieder." : "Start hat nicht geklappt. Nochmal versuchen.");
      if (e === "heute_gespielt") supabase.rpc("flug_heute").then(({ data: d }) => d?.ok && setSpiel(d.spiel));
      return;
    }
    setSpiel(data.spiel);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
  };

  const tipp = async (richtung) => {
    if (busy || spiel?.status !== "laeuft") return;
    setBusy(true);
    const { data, error } = await supabase.rpc("flug_tipp", { p_spiel: spiel.id, p_tipp: richtung });
    setBusy(false);
    if (error || !data) { setHinweis("Keine Verbindung. Der Tipp zählt nicht."); return; }
    if (data.spiel) setSpiel(data.spiel);
    if (typeof data.richtig === "boolean") setLetzter(data.richtig);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
  };

  const mitnehmen = async () => {
    if (busy || spiel?.status !== "laeuft" || !spiel.treffer) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("flug_mitnehmen", { p_spiel: spiel.id });
    setBusy(false);
    if (error || !data?.ok) { if (data?.spiel) setSpiel(data.spiel); else setHinweis("Mitnehmen hat nicht geklappt. Nochmal versuchen."); return; }
    setSpiel(data.spiel);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
  };

  const laeuft = spiel?.status === "laeuft";
  const zuWenig = (pollen || 0) < 5;
  const verlauf = spiel?.verlauf || [];
  const naechster = spiel ? Math.floor(spiel.einsatz * MULTI[Math.min(spiel.treffer + 1, 6)]) : 0;

  let kopf;
  if (spiel === undefined) kopf = <span style={{ color: colors.muted }}>Lade…</span>;
  else if (!spiel) kopf = zuWenig
    ? <span style={{ color: colors.muted }}>Ab 5 Pollen spielbar.</span>
    : <span style={{ color: colors.muted }}>Karten 1 bis 12. Kommt die nächste höher oder tiefer? Gleich zählt als daneben. Sechs Treffer in Folge bringen das 6.5-fache.</span>;
  else if (laeuft) kopf = (
    <span>
      Einsatz <b>{spiel.einsatz}</b>, jetzt <b style={{ color: K.petrol }}>{spiel.stand} Pollen</b>
      <span style={{ color: colors.muted }}> · Treffer {spiel.treffer} von 6, nächster bringt {naechster}</span>
    </span>
  );
  else if (spiel.status === "mitgenommen") kopf = <span>Mitgenommen: <b style={{ color: "#5B8C5A" }}>+{spiel.gewinn} Pollen</b> nach {spiel.treffer} {spiel.treffer === 1 ? "Treffer" : "Treffern"}. Nächstes Spiel morgen.</span>;
  else if (spiel.status === "verloren") kopf = <span>Daneben. <b style={{ color: "#c62828" }}>{spiel.einsatz} Pollen weg.</b> Morgen wieder.</span>;
  else kopf = <span>Das Spiel von gestern ist verfallen, der Einsatz ist weg. Heute geht es neu.</span>;

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.5, color: K.ink }}>{kopf}</p>
      {spiel === null && <EinsatzWahl pollen={pollen} einsatz={einsatz} setEinsatz={setEinsatz} onStart={start} busy={busy} icon={Feather} />}

      {spiel && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Aktuelle Karte gross, davor der Verlauf klein */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {verlauf.slice(0, -1).map((w, i) => <Karte key={i} wert={w} matt />)}
            <Karte wert={spiel.aktuell} gross />
          </div>
          {laeuft && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button type="button" disabled={busy || spiel.aktuell === 12} onClick={() => tipp("hoch")}
                style={{ padding: "9px 16px", borderRadius: 999, border: `1.5px solid ${K.ink}`, background: "#fff", color: K.ink, fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: spiel.aktuell === 12 ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, opacity: spiel.aktuell === 12 ? .5 : 1 }}>
                <ArrowUp size={15} /> Höher
              </button>
              <button type="button" disabled={busy || spiel.aktuell === 1} onClick={() => tipp("tief")}
                style={{ padding: "9px 16px", borderRadius: 999, border: `1.5px solid ${K.ink}`, background: "#fff", color: K.ink, fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: spiel.aktuell === 1 ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, opacity: spiel.aktuell === 1 ? .5 : 1 }}>
                <ArrowDown size={15} /> Tiefer
              </button>
            </div>
          )}
          {laeuft && (
            <button type="button" disabled={busy || !spiel.treffer} onClick={mitnehmen}
              style={{ padding: "9px 18px", borderRadius: 999, border: "none", background: spiel.treffer ? K.petrol : K.chip, color: spiel.treffer ? "#fff" : colors.mutedLt, fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: spiel.treffer ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <HandCoins size={14} /> {spiel.treffer ? `${spiel.stand} Pollen mitnehmen` : "Erst ein Treffer"}
            </button>
          )}
        </div>
      )}
      {laeuft && letzter !== null && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: letzter ? "#5B8C5A" : "#c62828" }}>{letzter ? "Treffer." : "Daneben."}</p>}
      {hinweis && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#c62828" }}>{hinweis}</p>}
    </div>
  );
}
