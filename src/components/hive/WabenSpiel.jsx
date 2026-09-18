"use client";
// Wabenspiel (Denis, 16.09.2026): einmal pro Tag ein Spiel mit Einsatz.
// 9 Waben, 2 Wespen, 7 Honig. Jede Honigwabe hebt den Multiplikator,
// "Mitnehmen" sichert den Gewinn, eine Wespe kostet den Einsatz.
// Die Logik liegt komplett in den RPCs (waben_heute/start/aufdecken/
// mitnehmen); das Raster ist erst nach Spielende sichtbar.
import { useEffect, useState } from "react";
import { Droplets, Bug, Hexagon, HandCoins } from "lucide-react";
import EinsatzWahl from "./EinsatzWahl";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";

const K = { ink: "#191615", honey: "#F4C03F", petrol: "#0B5E5C", hairline: "#E5E8EC", chip: "#F1F3F5", wespe: "#3A2F2A" };
const MULTI = [0, 1.2, 1.5, 2, 3, 5, 10, 25];
const HEX = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

export default function WabenSpiel({ pollen, onPollen }) {
  const [spiel, setSpiel] = useState(undefined); // undefined = laedt, null = heute noch keins
  const [einsatz, setEinsatz] = useState(10);
  const [busy, setBusy] = useState(false);
  const [hinweis, setHinweis] = useState("");

  useEffect(() => {
    supabase.rpc("waben_heute").then(({ data }) => setSpiel(data?.ok ? data.spiel : null));
  }, []);

  const start = async () => {
    if (busy) return;
    setBusy(true); setHinweis("");
    const { data, error } = await supabase.rpc("waben_start", { p_einsatz: einsatz });
    setBusy(false);
    if (error || !data?.ok) {
      const e = data?.error;
      setHinweis(e === "zu_wenig" ? "Zu wenig Pollen für diesen Einsatz." : e === "heute_gespielt" ? "Heute schon gespielt. Morgen wieder." : "Start hat nicht geklappt. Nochmal versuchen.");
      if (e === "heute_gespielt") supabase.rpc("waben_heute").then(({ data: d }) => d?.ok && setSpiel(d.spiel));
      return;
    }
    setSpiel(data.spiel);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
  };

  const aufdecken = async (i) => {
    if (busy || !spiel || spiel.status !== "laeuft" || spiel.aufgedeckt.includes(i)) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("waben_aufdecken", { p_spiel: spiel.id, p_feld: i });
    setBusy(false);
    if (error || !data) { setHinweis("Keine Verbindung. Die Wabe bleibt zu."); return; }
    if (data.spiel) setSpiel(data.spiel);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
  };

  const mitnehmen = async () => {
    if (busy || !spiel || spiel.status !== "laeuft" || spiel.honig === 0) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("waben_mitnehmen", { p_spiel: spiel.id });
    setBusy(false);
    if (error || !data?.ok) { if (data?.spiel) setSpiel(data.spiel); else setHinweis("Mitnehmen hat nicht geklappt. Nochmal versuchen."); return; }
    setSpiel(data.spiel);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
  };

  const laeuft = spiel?.status === "laeuft";
  const fertig = spiel && !laeuft;
  const zuWenig = (pollen || 0) < 5;
  const naechster = spiel && MULTI[Math.min(spiel.honig + 1, 7)];

  // Kopfzeile je nach Zustand
  let kopf;
  if (spiel === undefined) kopf = <span style={{ color: colors.muted }}>Lade…</span>;
  else if (!spiel) kopf = zuWenig
    ? <span style={{ color: colors.muted }}>Ab 5 Pollen spielbar.</span>
    : <span style={{ color: colors.muted }}>7 Honig, 2 Wespen. Jede Honigwabe hebt den Gewinn, eine Wespe frisst den Einsatz. Aussteigen jederzeit.</span>;
  else if (laeuft) kopf = (
    <span>
      Einsatz <b>{spiel.einsatz}</b>, jetzt <b style={{ color: K.petrol }}>{spiel.aktuell} Pollen</b>
      {spiel.honig < 7 && <span style={{ color: colors.muted }}> · nächste Honigwabe: {Math.floor(spiel.einsatz * naechster)}</span>}
    </span>
  );
  else if (spiel.status === "mitgenommen") kopf = <span>Mitgenommen: <b style={{ color: "#5B8C5A" }}>+{spiel.gewinn} Pollen</b> bei Einsatz {spiel.einsatz}. Nächstes Spiel morgen.</span>;
  else if (spiel.status === "verloren") kopf = <span>Wespe. <b style={{ color: "#c62828" }}>{spiel.einsatz} Pollen weg.</b> Morgen wieder.</span>;
  else kopf = <span>Das Spiel von gestern ist verfallen, der Einsatz ist weg. Heute geht es neu.</span>;

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.5, color: K.ink }}>{kopf}</p>

      {spiel === null && <EinsatzWahl pollen={pollen} einsatz={einsatz} setEinsatz={setEinsatz} onStart={start} busy={busy} icon={Hexagon} />}

      {/* Wabenraster 3x3 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, maxWidth: 300, opacity: spiel === null && zuWenig ? .45 : 1 }}>
        {Array.from({ length: 9 }, (_, i) => {
          const offen = spiel?.aufgedeckt?.includes(i);
          const inhalt = spiel?.felder ? spiel.felder[i] : (offen ? 0 : null); // 0 Honig, 1 Wespe, null verdeckt
          const gezeigt = offen || (fertig && inhalt !== null);
          const wespe = gezeigt && inhalt === 1;
          const bg = !gezeigt ? K.honey : wespe ? K.wespe : "#FFF3C4";
          return (
            <button key={i} type="button" aria-label={gezeigt ? (wespe ? "Wespe" : "Honig") : `Wabe ${i + 1}`}
              disabled={!laeuft || offen || busy} onClick={() => aufdecken(i)}
              style={{ aspectRatio: "1 / 1", clipPath: HEX, border: "none", background: bg, cursor: laeuft && !offen ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: fertig && !offen ? .55 : 1, transition: "background .2s, transform .15s", transform: offen && !wespe ? "scale(1.04)" : "scale(1)" }}>
              {gezeigt ? (wespe ? <Bug size={22} color="#fff" /> : <Droplets size={22} color="#C8860A" />) : <Hexagon size={18} color="rgba(20,17,13,.35)" />}
            </button>
          );
        })}
      </div>

      {/* Mitnehmen */}
      {laeuft && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button type="button" disabled={busy || spiel.honig === 0} onClick={mitnehmen}
            style={{ padding: "9px 18px", borderRadius: 999, border: "none", background: spiel.honig === 0 ? K.chip : K.petrol, color: spiel.honig === 0 ? colors.mutedLt : "#fff", fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: spiel.honig === 0 ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <HandCoins size={14} /> {spiel.honig === 0 ? "Erst eine Wabe aufdecken" : `${spiel.aktuell} Pollen mitnehmen`}
          </button>
          <span style={{ fontSize: 12, color: colors.muted }}>Noch {7 - spiel.honig} Honig und 2 Wespen verdeckt.</span>
        </div>
      )}

      {hinweis && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#c62828" }}>{hinweis}</p>}
    </div>
  );
}
