"use client";
// Bluetenpaar (Denis, 16.09.2026): Memory mit 12 Karten, 6 Paaren, 8 Zuegen.
// Auszahlung nach Paaren: 0-1 = Einsatz weg, 2 = 0.7x, 3 = 1x, 4 = 1.5x,
// 5 = 2x, 6 = 3x. Werte kommen nur vom Server (paar_aufdecken), der Browser
// zeigt ein nicht passendes Paar kurz und dreht es dann wieder um.
import { useEffect, useRef, useState } from "react";
import { Flower, Flower2, Leaf, Sprout, TreeDeciduous, Clover } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import EinsatzWahl from "./EinsatzWahl";

const K = { ink: "#191615", honey: "#F4C03F", petrol: "#0B5E5C", hairline: "#E4E0D8", chip: "#F2EEE7" };
const MOTIVE = [
  { Icon: Flower, farbe: "#C8860A" }, { Icon: Flower2, farbe: "#B23A48" }, { Icon: Leaf, farbe: "#5B8C5A" },
  { Icon: Sprout, farbe: "#0E9493" }, { Icon: TreeDeciduous, farbe: "#0B5E5C" }, { Icon: Clover, farbe: "#7A5C9E" },
];
const STUFEN = { 2: 0.7, 3: 1, 4: 1.5, 5: 2, 6: 3 };

export default function Bluetenpaar({ pollen, onPollen }) {
  const [spiel, setSpiel] = useState(undefined);
  const [einsatz, setEinsatz] = useState(10);
  const [busy, setBusy] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const [kurz, setKurz] = useState(null); // {a, b, wa, wb} nicht passendes Paar, kurz sichtbar
  const timer = useRef(null);

  useEffect(() => {
    supabase.rpc("paar_heute").then(({ data }) => setSpiel(data?.ok ? data.spiel : null));
    return () => clearTimeout(timer.current);
  }, []);

  const start = async () => {
    if (busy) return;
    setBusy(true); setHinweis("");
    const { data, error } = await supabase.rpc("paar_start", { p_einsatz: einsatz });
    setBusy(false);
    if (error || !data?.ok) {
      const e = data?.error;
      setHinweis(e === "zu_wenig" ? "Zu wenig Pollen für diesen Einsatz." : e === "heute_gespielt" ? "Heute schon gespielt. Morgen wieder." : "Start hat nicht geklappt. Nochmal versuchen.");
      if (e === "heute_gespielt") supabase.rpc("paar_heute").then(({ data: d }) => d?.ok && setSpiel(d.spiel));
      return;
    }
    setSpiel(data.spiel);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
  };

  const aufdecken = async (i) => {
    if (busy || kurz || spiel?.status !== "laeuft") return;
    if (spiel.gefunden.includes(i) || spiel.erste === i) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("paar_aufdecken", { p_spiel: spiel.id, p_karte: i });
    setBusy(false);
    if (error || !data) { setHinweis("Keine Verbindung. Die Karte bleibt zu."); return; }
    if (data.zweite && !data.treffer) {
      // Beide Karten kurz zeigen, dann wieder umdrehen
      setKurz(data.zweite);
      timer.current = setTimeout(() => setKurz(null), 900);
    }
    if (data.spiel) setSpiel(data.spiel);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
  };

  const laeuft = spiel?.status === "laeuft";
  const fertig = spiel?.status === "fertig";
  const zuWenig = (pollen || 0) < 5;

  let kopf;
  if (spiel === undefined) kopf = <span style={{ color: colors.muted }}>Lade…</span>;
  else if (!spiel) kopf = zuWenig
    ? <span style={{ color: colors.muted }}>Ab 5 Pollen spielbar.</span>
    : <span style={{ color: colors.muted }}>12 Karten, 6 Paare, 8 Züge. Ab 2 Paaren gibt es etwas zurück, ab 3 den Einsatz, 6 Paare bringen das Dreifache.</span>;
  else if (laeuft) kopf = (
    <span>
      Einsatz <b>{spiel.einsatz}</b>, Paare <b>{spiel.paare}</b>, Zug <b>{spiel.zuege + 1}</b> von 8
      <span style={{ color: colors.muted }}> · aktuell {spiel.stand} Pollen</span>
    </span>
  );
  else if (fertig) kopf = spiel.gewinn > 0
    ? <span>{spiel.paare} Paare: <b style={{ color: "#5B8C5A" }}>+{spiel.gewinn} Pollen</b> bei Einsatz {spiel.einsatz}. Nächstes Spiel morgen.</span>
    : <span>{spiel.paare} {spiel.paare === 1 ? "Paar" : "Paare"}. <b style={{ color: "#c62828" }}>{spiel.einsatz} Pollen weg.</b> Morgen wieder.</span>;
  else kopf = <span>Das Spiel von gestern ist verfallen, der Einsatz ist weg. Heute geht es neu.</span>;

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.5, color: K.ink }}>{kopf}</p>
      {spiel === null && <EinsatzWahl pollen={pollen} einsatz={einsatz} setEinsatz={setEinsatz} onStart={start} busy={busy} icon={Flower2} />}

      {spiel && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, maxWidth: 320 }}>
          {Array.from({ length: 12 }, (_, i) => {
            let wert = spiel.werte?.[i];
            if (wert == null && kurz) { if (kurz.a === i) wert = kurz.wa; if (kurz.b === i) wert = kurz.wb; }
            const offen = wert != null;
            const gefunden = spiel.gefunden.includes(i);
            const m = offen ? MOTIVE[wert] : null;
            return (
              <button key={i} type="button" aria-label={offen ? `Karte ${i + 1}, Motiv ${wert + 1}` : `Karte ${i + 1}`}
                disabled={!laeuft || offen || busy || !!kurz} onClick={() => aufdecken(i)}
                style={{ aspectRatio: "3 / 4", borderRadius: 12, border: `1.5px solid ${offen ? (gefunden ? "#5B8C5A" : K.ink) : "transparent"}`, background: offen ? "#fff" : K.honey, cursor: laeuft && !offen ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: fertig && !gefunden ? .6 : 1, transition: "background .2s" }}>
                {m ? <m.Icon size={24} color={m.farbe} /> : <Flower2 size={16} color="rgba(20,17,13,.3)" />}
              </button>
            );
          })}
        </div>
      )}
      {laeuft && <p style={{ margin: "10px 0 0", fontSize: 12, color: colors.muted }}>Stufen: 2 Paare {Math.floor(spiel.einsatz * STUFEN[2])}, 3 Paare {Math.floor(spiel.einsatz * STUFEN[3])}, 4 Paare {Math.floor(spiel.einsatz * STUFEN[4])}, 5 Paare {Math.floor(spiel.einsatz * STUFEN[5])}, 6 Paare {Math.floor(spiel.einsatz * STUFEN[6])} Pollen.</p>}
      {hinweis && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#c62828" }}>{hinweis}</p>}
    </div>
  );
}
