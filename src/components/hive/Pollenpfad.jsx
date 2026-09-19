"use client";
// Pollenpfad (Denis, 16.09.2026): ein Lauf pro Tag ueber 10 Felder. Pro
// Schritt einer von drei Wegen (sicher / riskant / Ereignis), der Ausgang
// kommt vom Server (pfad_schritt). Schild schuetzt einmal vor einer Wespe
// und ueberlebt den Tag. Wochenpunkte = erreichte Felder, Top 3 der Woche
// bekommen montags einen Pollen-Bonus (Cron pfad_woche_abrechnen).
import { useEffect, useState } from "react";
import { Shield, ShieldCheck, Footprints, Flame, Sparkles, CloudRain, Bug, Flag, HandCoins, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import EinsatzWahl from "./EinsatzWahl";

const K = { ink: "#191615", honey: "#F4C03F", petrol: "#0B5E5C", hairline: "#E5E8EC", chip: "#F1F3F5", moss: "#50804F", rot: "#c62828" };
const WEGE = [
  { key: "sicher", name: "Sicherer Weg", info: "8 % Wespe · Stand +0.1", Icon: Footprints, farbe: K.moss },
  { key: "riskant", name: "Riskanter Weg", info: "35 % Wespe · Stand +0.5", Icon: Flame, farbe: "#C8860A" },
  { key: "ereignis", name: "Ereignisfeld", info: "Blüte, Regen, Schild oder Wespe", Icon: Sparkles, farbe: "#7A5C9E" },
];
const ERGEBNIS = {
  weiter: { text: "Weiter. Ein Feld vor.", Icon: Footprints, farbe: K.moss },
  bluete: { text: "Blüte. Stand mal 1.6, ein Feld vor.", Icon: Sparkles, farbe: "#C8860A" },
  regen: { text: "Regen. Ein Feld zurück.", Icon: CloudRain, farbe: "#4A6FA5" },
  schild: { text: "Schild gefunden. Schützt einmal vor einer Wespe.", Icon: ShieldCheck, farbe: K.petrol },
  schild_doppelt: { text: "Noch ein Schild. Du hast schon eins, dafür Stand +0.2.", Icon: ShieldCheck, farbe: K.petrol },
  schild_weg: { text: "Wespe. Das Schild hat sie abgewehrt, Schild verbraucht.", Icon: Shield, farbe: K.rot },
  wespe: { text: "Wespe. Lauf vorbei, Einsatz weg.", Icon: Bug, farbe: K.rot },
  ziel: { text: "Ziel erreicht. Stand +0.3, ausbezahlt.", Icon: Flag, farbe: K.moss },
};

export default function Pollenpfad({ pollen, onPollen }) {
  const [lauf, setLauf] = useState(undefined);
  const [schildMorgen, setSchildMorgen] = useState(false);
  const [einsatz, setEinsatz] = useState(10);
  const [busy, setBusy] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const [letztes, setLetztes] = useState(null);
  const [rang, setRang] = useState(null);

  const ladeRang = () => supabase.rpc("pfad_rangliste").then(({ data }) => data?.ok && setRang(data));
  useEffect(() => {
    supabase.rpc("pfad_heute").then(({ data }) => { setLauf(data?.ok ? data.lauf : null); setSchildMorgen(!!data?.schild); });
    ladeRang();
  }, []);

  const start = async () => {
    if (busy) return;
    setBusy(true); setHinweis(""); setLetztes(null);
    const { data, error } = await supabase.rpc("pfad_start", { p_einsatz: einsatz });
    setBusy(false);
    if (error || !data?.ok) {
      const e = data?.error;
      setHinweis(e === "zu_wenig" ? "Zu wenig Pollen für diesen Einsatz." : e === "heute_gespielt" ? "Heute schon gelaufen. Morgen wieder." : "Start hat nicht geklappt. Nochmal versuchen.");
      if (e === "heute_gespielt") supabase.rpc("pfad_heute").then(({ data: d }) => d?.ok && setLauf(d.lauf));
      return;
    }
    setLauf(data.lauf);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
  };

  const schritt = async (weg) => {
    if (busy || lauf?.status !== "laeuft") return;
    setBusy(true);
    const { data, error } = await supabase.rpc("pfad_schritt", { p_lauf: lauf.id, p_weg: weg });
    setBusy(false);
    if (error || !data) { setHinweis("Keine Verbindung. Der Schritt zählt nicht."); return; }
    if (data.lauf) setLauf(data.lauf);
    if (data.ergebnis) setLetztes(data.ergebnis);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
    if (data.lauf && data.lauf.status !== "laeuft") ladeRang();
  };

  const mitnehmen = async () => {
    if (busy || lauf?.status !== "laeuft" || lauf.feld < 1) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("pfad_mitnehmen", { p_lauf: lauf.id });
    setBusy(false);
    if (error || !data?.ok) { if (data?.lauf) setLauf(data.lauf); else setHinweis("Mitnehmen hat nicht geklappt. Nochmal versuchen."); return; }
    setLauf(data.lauf); setLetztes(null);
    if (typeof data.pollen === "number") onPollen?.(data.pollen);
    ladeRang();
  };

  const laeuft = lauf?.status === "laeuft";
  const zuWenig = (pollen || 0) < 5;

  let kopf;
  if (lauf === undefined) kopf = <span style={{ color: colors.muted }}>Lade…</span>;
  else if (!lauf) kopf = zuWenig
    ? <span style={{ color: colors.muted }}>Ab 5 Pollen spielbar.</span>
    : <span style={{ color: colors.muted }}>10 Felder bis zum Ziel. Jeder Schritt hebt den Stand, eine Wespe frisst den Einsatz. Erreichte Felder zählen für die Wochenrangliste.{schildMorgen && <> <b style={{ color: K.petrol }}>Dein Schild von gestern ist dabei.</b></>}</span>;
  else if (laeuft) kopf = <span>Feld <b>{lauf.feld}</b> von 10, Stand <b style={{ color: K.petrol }}>{lauf.aktuell} Pollen</b> <span style={{ color: colors.muted }}>(Einsatz {lauf.einsatz}, x{Number(lauf.stand).toFixed(2)})</span></span>;
  else if (lauf.status === "ziel") kopf = <span>Ziel erreicht: <b style={{ color: K.moss }}>+{lauf.gewinn} Pollen</b> und {lauf.punkte} Wochenpunkte. Morgen geht es weiter.</span>;
  else if (lauf.status === "mitgenommen") kopf = <span>Mitgenommen auf Feld {lauf.feld}: <b style={{ color: K.moss }}>+{lauf.gewinn} Pollen</b>, {lauf.punkte} Wochenpunkte. Morgen wieder.</span>;
  else if (lauf.status === "verloren") kopf = <span>Wespe auf Feld {lauf.feld}. <b style={{ color: K.rot }}>{lauf.einsatz} Pollen weg.</b> {lauf.punkte} Wochenpunkte bleiben. Morgen wieder.</span>;
  else kopf = <span>Der Lauf von gestern ist verfallen, der Einsatz ist weg. Heute geht es neu.</span>;

  const erg = letztes && ERGEBNIS[letztes];

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.5, color: K.ink }}>{kopf}</p>
      {lauf === null && <EinsatzWahl pollen={pollen} einsatz={einsatz} setEinsatz={setEinsatz} onStart={start} busy={busy} icon={Footprints} label="Loslaufen" />}

      {/* Pfad: 10 Felder + Ziel */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginBottom: 12, opacity: lauf === null && zuWenig ? .45 : 1 }}>
        {Array.from({ length: 11 }, (_, i) => {
          const erreicht = lauf ? i <= lauf.feld : i === 0;
          const hier = lauf ? i === lauf.feld : i === 0;
          const ziel = i === 10;
          return (
            <div key={i} style={{ width: ziel ? 34 : 26, height: 26, borderRadius: ziel ? 8 : "50%", background: hier ? K.ink : (erreicht ? K.honey : K.chip), border: `1.5px solid ${hier ? K.ink : (erreicht ? K.honey : K.hairline)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: hier ? "#fff" : K.ink, fontFamily: fonts.body, flexShrink: 0 }}>
              {ziel ? <Flag size={14} color={hier ? "#fff" : K.ink} /> : (hier && lauf?.schild ? <ShieldCheck size={14} color="#fff" /> : i)}
            </div>
          );
        })}
        {lauf?.schild && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 6, fontSize: 12, fontWeight: 700, color: K.petrol }}><ShieldCheck size={13} /> Schild aktiv</span>}
      </div>

      {erg && <p style={{ margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: erg.farbe }}><erg.Icon size={15} /> {erg.text}</p>}

      {laeuft && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 12 }}>
            {WEGE.map(w => (
              <button key={w.key} type="button" disabled={busy} onClick={() => schritt(w.key)}
                style={{ textAlign: "left", padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${K.hairline}`, background: "#fff", cursor: "pointer", fontFamily: fonts.body }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 800, color: K.ink }}><w.Icon size={15} color={w.farbe} /> {w.name}</span>
                <span style={{ display: "block", marginTop: 3, fontSize: 11.5, color: colors.muted }}>{w.info}</span>
              </button>
            ))}
          </div>
          <button type="button" disabled={busy || lauf.feld < 1} onClick={mitnehmen}
            style={{ padding: "9px 18px", borderRadius: 999, border: "none", background: lauf.feld ? K.petrol : K.chip, color: lauf.feld ? "#fff" : colors.mutedLt, fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: lauf.feld ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <HandCoins size={14} /> {lauf.feld ? `${lauf.aktuell} Pollen mitnehmen` : "Erst ein Schritt"}
          </button>
        </>
      )}

      {/* Wochenrangliste */}
      {rang && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${K.hairline}` }}>
          <p style={{ margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: K.ink, textTransform: "uppercase", letterSpacing: ".04em" }}>
            <Trophy size={13} color={K.petrol} /> Woche vom {new Date(rang.woche).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}
            <span style={{ fontWeight: 600, color: colors.muted, textTransform: "none", letterSpacing: 0 }}>· Top 3 bekommen montags 50 / 30 / 20 Pollen</span>
          </p>
          {rang.top.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12.5, color: colors.muted }}>Noch niemand gelaufen diese Woche. Sei die erste Biene.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {rang.top.slice(0, 5).map(r => (
                <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 20, fontWeight: 800, color: r.rang <= 3 ? K.petrol : colors.muted }}>{r.rang}.</span>
                  <span style={{ flex: 1, color: K.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  <span style={{ fontWeight: 700, color: K.ink }}>{r.punkte} Pkt</span>
                </div>
              ))}
              {rang.ich && <p style={{ margin: "6px 0 0", fontSize: 12, color: colors.muted }}>Du: Platz {rang.ich.rang} mit {rang.ich.punkte} Punkten.</p>}
            </div>
          )}
        </div>
      )}

      {hinweis && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: K.rot }}>{hinweis}</p>}
    </div>
  );
}
