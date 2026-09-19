"use client";
// Poker-Tisch (Denis, 16.09.2026): Plaetze, Board, Pot, eigene Karten,
// Aktionsleiste. Der Stand kommt komplett aus poker_sicht; alle 10 Sekunden
// und beim Fokus wird nachgeladen. Entschieden wird nur auf dem Server.
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, LogOut, Play, Loader2, Spade } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import { karte, PHASEN, aktionText, restzeit } from "@/lib/poker";

const K = { ink: "#191615", sand: "#F5F6F8", honey: "#F4C03F", petrol: "#0B5E5C", hairline: "#E5E8EC", chip: "#F1F3F5", filz: "#0B5E5C" };
const HEAD = "'General Sans','Manrope',sans-serif";

function Karte({ c, gross, verdeckt }) {
  const k = karte(c);
  const w = gross ? 52 : 38, h = gross ? 72 : 52;
  if (verdeckt || !k) return <div style={{ width: w, height: h, borderRadius: 7, background: "repeating-linear-gradient(45deg, #F4C03F 0 4px, #E8B227 4px 8px)", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,.25)", flexShrink: 0 }} />;
  return (
    <div style={{ width: w, height: h, borderRadius: 7, background: "#fff", border: "1px solid #D5D9DF", boxShadow: "0 2px 6px rgba(0,0,0,.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: k.rot ? "#C62828" : K.ink, fontFamily: HEAD, fontWeight: 700, lineHeight: 1, flexShrink: 0 }}>
      <span style={{ fontSize: gross ? 22 : 16 }}>{k.rang}</span>
      <span style={{ fontSize: gross ? 20 : 15 }}>{k.farbe}</span>
    </div>
  );
}

export default function PokerTisch() {
  const { id } = useParams();
  const router = useRouter();
  const [s, setS] = useState(null);
  const [fehler, setFehler] = useState("");
  const [busy, setBusy] = useState(false);
  const [raise, setRaise] = useState("");
  const [tick, setTick] = useState(0);
  const ref = useRef(null);

  const laden = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/login?redirect=/poker/${id}`); return; }
    const { data } = await supabase.rpc("poker_sicht", { p_tisch: id });
    if (data?.ok) { setS(data); ref.current = data; }
    else if (data?.error === "kein_tisch") setFehler("Diesen Tisch gibt es nicht.");
  };
  useEffect(() => {
    laden();
    const iv = setInterval(() => { if (!document.hidden) laden(); }, 10000);
    const t2 = setInterval(() => setTick(x => x + 1), 30000);
    const onFocus = () => laden();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(iv); clearInterval(t2); window.removeEventListener("focus", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const rpc = async (fn, args, fehlerText) => {
    if (busy) return;
    setBusy(true); setFehler("");
    const { data, error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error || !data?.ok) {
      const e = data?.error;
      setFehler(e === "min_raise" ? `Mindestens auf ${data.min} erhöhen.` : e === "nicht_dran" ? "Du bist nicht am Zug." : e === "zu_wenig_chips" ? "So viele Chips hast du nicht." : e === "check_nicht_moeglich" ? "Schieben geht nicht, du musst mitgehen oder passen." : e === "zu_wenige" ? "Es braucht mindestens zwei Spieler." : (fehlerText || "Das hat nicht geklappt."));
    }
    await laden();
    return data;
  };

  if (fehler && !s) return <div style={{ padding: 40, textAlign: "center", fontFamily: fonts.body }}><p>{fehler}</p><Link href="/poker">Zur Lobby</Link></div>;
  if (!s) return <div style={{ padding: 60, textAlign: "center", color: colors.muted, fontFamily: fonts.body }}>Lade Tisch…</div>;

  const { tisch, sitze, hand, mein_seat, letzte_hand } = s;
  const ich = sitze.find(x => x.ich);
  const nameVonSeat = (seat) => sitze.find(x => x.seat === seat)?.name || `Platz ${seat + 1}`;
  const dran = hand?.ich_dran;
  const toCall = hand?.to_call || 0;
  const meineChips = hand?.meine_chips ?? ich?.chips ?? 0;
  const meinEinsatz = ich?.eingesetzt || 0;
  const minRaise = hand ? hand.aktueller_einsatz + hand.min_raise : 0;
  const maxRaise = meinEinsatz + meineChips;
  const raiseWert = parseInt(raise, 10);
  const leer = Array.from({ length: tisch.max_seats }, (_, i) => sitze.find(x => x.seat === i) || null);

  return (
    <div style={{ fontFamily: fonts.body, background: "var(--bd-grund)", minHeight: "100vh", color: K.ink }}>
      <div className="bd-seite">
        {/* Kopf */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <Link href="/poker" aria-label="Zur Lobby" style={{ display: "flex", color: K.ink }}><ArrowLeft size={20} /></Link>
          <Spade size={18} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: HEAD, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tisch.name}</h1>
          <span style={{ fontSize: 12.5, color: colors.muted, fontWeight: 700 }}>Buy-in {tisch.buy_in} · Blinds {tisch.sb}/{tisch.bb} · Hand {tisch.hand_nr}</span>
        </div>

        {/* Statuszeile */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: dran ? "#FFF6DB" : K.sand, border: `1px solid ${dran ? "#F0E3BC" : K.hairline}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 13.5 }}>
          {hand ? (
            <>
              <b>{PHASEN[hand.phase]}</b>
              <span style={{ color: colors.muted }}>Pot <b style={{ color: K.ink }}>{hand.pot}</b></span>
              {dran
                ? <span style={{ fontWeight: 800, color: "#8a6d00", display: "inline-flex", alignItems: "center", gap: 5 }}><Clock size={13} /> Du bist am Zug · noch {restzeit(hand.deadline)}</span>
                : <span style={{ color: colors.muted }}>{nameVonSeat(hand.aktueller_sitz)} ist am Zug · noch {restzeit(hand.deadline)}</span>}
            </>
          ) : tisch.status === "geschlossen" ? <span>Der Tisch ist geschlossen.</span>
            : <span>Wartet auf Spieler ({sitze.length} / {tisch.max_seats}). {tisch.creator ? "Du kannst ab zwei Spielern starten." : "Der Ersteller startet, oder der Tisch startet, wenn er voll ist."}</span>}
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {tisch.creator && tisch.status === "offen" && sitze.length >= 2 && (
              <button type="button" onClick={() => rpc("poker_starten", { p_tisch: id })} disabled={busy} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 999, border: "none", background: K.honey, color: K.ink, fontSize: 12.5, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer" }}><Play size={13} /> Starten</button>
            )}
            {ich && (
              <button type="button" onClick={async () => { const r = await rpc("poker_aufstehen", { p_tisch: id }); if (r?.ok && r.sofort) router.push("/poker"); }} disabled={busy} title="Chips werden als Pollen gutgeschrieben"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 999, border: `1.5px solid ${K.hairline}`, background: "#fff", color: K.ink, fontSize: 12.5, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}><LogOut size={13} /> {ich.status === "geht" ? "Stehst nach der Hand auf" : "Aufstehen"}</button>
            )}
            {!ich && tisch.status !== "geschlossen" && sitze.length < tisch.max_seats && (
              <button type="button" onClick={() => rpc("poker_setzen", { p_tisch: id }, "Hinsetzen hat nicht geklappt (genug Pollen?).")} disabled={busy} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: K.petrol, color: "#fff", fontSize: 12.5, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer" }}>Hinsetzen ({tisch.buy_in} Pollen)</button>
            )}
          </span>
        </div>

        {/* Tisch */}
        <div style={{ background: K.filz, borderRadius: 24, padding: "18px 16px", color: "#fff", boxShadow: "inset 0 0 0 6px #084A48, 0 10px 30px rgba(11,94,92,.25)" }}>
          {/* Plaetze */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tisch.max_seats, 3)}, minmax(0, 1fr))`, gap: 10, marginBottom: 16 }}>
            {leer.map((p, i) => p ? (
              <div key={i} style={{ background: p.am_zug ? "rgba(244,192,63,.22)" : "rgba(255,255,255,.08)", border: `1.5px solid ${p.am_zug ? K.honey : p.ich ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.15)"}`, borderRadius: 12, padding: "9px 11px", opacity: p.gefoldet ? .5 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {p.dealer && <span title="Dealer" style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", color: K.ink, fontSize: 10, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>D</span>}
                  <span style={{ fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{p.ich ? "Du" : p.name}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: K.honey, whiteSpace: "nowrap" }}>{p.chips}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 11.5, color: "rgba(255,255,255,.75)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {p.gefoldet ? <span>gepasst</span> : p.allin ? <span>All-in</span> : p.dabei ? <span>Einsatz {p.eingesetzt}</span> : <span>wartet auf nächste Hand</span>}
                  {p.status === "geht" && <span>steht auf</span>}
                  {p.am_zug && <span style={{ color: K.honey, fontWeight: 800 }}>am Zug</span>}
                </div>
              </div>
            ) : (
              <div key={i} style={{ border: "1.5px dashed rgba(255,255,255,.25)", borderRadius: 12, padding: "9px 11px", fontSize: 12, color: "rgba(255,255,255,.5)" }}>Platz {i + 1} frei</div>
            ))}
          </div>

          {/* Board + Pot */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "8px 0 14px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {Array.from({ length: 5 }, (_, i) => {
                const c = hand?.board?.[i] ?? letzte_hand?.board?.[i];
                return hand || letzte_hand ? (c != null ? <Karte key={i} c={c} /> : <div key={i} style={{ width: 38, height: 52, borderRadius: 7, border: "1.5px dashed rgba(255,255,255,.3)" }} />) : <div key={i} style={{ width: 38, height: 52, borderRadius: 7, border: "1.5px dashed rgba(255,255,255,.3)" }} />;
              })}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, background: "rgba(0,0,0,.25)", borderRadius: 999, padding: "5px 14px" }}>
              {hand ? `Pot ${hand.pot}` : letzte_hand ? "Letzte Hand" : "Noch keine Hand"}
            </div>
          </div>

          {/* Meine Karten */}
          {ich && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 6 }}>
              {hand?.meine_karten ? hand.meine_karten.map((c, i) => <Karte key={i} c={c} gross />) : <><Karte verdeckt gross /><Karte verdeckt gross /></>}
              <div style={{ marginLeft: 8, fontSize: 12.5, color: "rgba(255,255,255,.8)" }}>
                <div>Deine Chips: <b style={{ color: K.honey }}>{meineChips}</b></div>
                {hand && <div>Dein Einsatz: {meinEinsatz}{toCall > 0 ? ` · ${toCall} zum Mitgehen` : ""}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Aktionen */}
        {dran && (
          <div style={{ marginTop: 14, background: K.sand, border: `1px solid ${K.hairline}`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" disabled={busy} onClick={() => rpc("poker_aktion", { p_tisch: id, p_aktion: "fold" })} style={{ padding: "10px 16px", borderRadius: 999, border: `1.5px solid ${K.hairline}`, background: "#fff", color: "#c62828", fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer" }}>Passen</button>
              {toCall === 0
                ? <button type="button" disabled={busy} onClick={() => rpc("poker_aktion", { p_tisch: id, p_aktion: "check" })} style={{ padding: "10px 16px", borderRadius: 999, border: "none", background: K.ink, color: "#fff", fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer" }}>Schieben</button>
                : <button type="button" disabled={busy} onClick={() => rpc("poker_aktion", { p_tisch: id, p_aktion: "call" })} style={{ padding: "10px 16px", borderRadius: 999, border: "none", background: K.ink, color: "#fff", fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer" }}>Mitgehen ({Math.min(toCall, meineChips)})</button>}
              {maxRaise > minRaise && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input type="number" value={raise} onChange={(e) => setRaise(e.target.value)} min={minRaise} max={maxRaise} placeholder={`auf ${minRaise}`}
                    style={{ width: 96, padding: "9px 10px", borderRadius: 12, border: `1.5px solid ${K.hairline}`, fontSize: 13.5, fontFamily: fonts.body, background: "#fff" }} />
                  <button type="button" disabled={busy || !(raiseWert >= minRaise && raiseWert <= maxRaise)} onClick={() => rpc("poker_aktion", { p_tisch: id, p_aktion: "raise", p_betrag: raiseWert })}
                    style={{ padding: "10px 16px", borderRadius: 999, border: "none", background: K.petrol, color: "#fff", fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer", opacity: raiseWert >= minRaise && raiseWert <= maxRaise ? 1 : .5 }}>Erhöhen auf</button>
                  {[minRaise, Math.min(maxRaise, Math.max(minRaise, hand.pot)), Math.min(maxRaise, Math.max(minRaise, hand.pot * 2))].filter((v, i, a) => a.indexOf(v) === i && v < maxRaise).map(v => (
                    <button key={v} type="button" onClick={() => setRaise(String(v))} style={{ padding: "7px 10px", borderRadius: 999, border: `1.5px solid ${K.hairline}`, background: "#fff", fontSize: 12, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>{v}</button>
                  ))}
                </span>
              )}
              <button type="button" disabled={busy || meineChips <= 0} onClick={() => rpc("poker_aktion", { p_tisch: id, p_aktion: "allin" })} style={{ marginLeft: "auto", padding: "10px 16px", borderRadius: 999, border: "none", background: K.honey, color: K.ink, fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer" }}>All-in ({meineChips})</button>
            </div>
            {busy && <p style={{ margin: "8px 0 0", fontSize: 12, color: colors.muted, display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={12} className="spin" /> Wird gesendet…</p>}
          </div>
        )}
        {fehler && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#c62828", fontWeight: 700 }}>{fehler}</p>}

        {/* Letzte Hand */}
        {letzte_hand?.ergebnis && (
          <div style={{ marginTop: 16, border: `1px solid ${K.hairline}`, borderRadius: 12, padding: "12px 14px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", color: colors.muted }}>Hand {letzte_hand.nr}: Ergebnis</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {letzte_hand.ergebnis.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, minWidth: 90 }}>{nameVonSeat(e.seat)}</span>
                  {e.karten && <span style={{ display: "flex", gap: 4 }}>{e.karten.map((c, j) => { const k = karte(c); return <span key={j} style={{ color: k.rot ? "#C62828" : K.ink, fontWeight: 700 }}>{k.rang}{k.farbe}</span>; })}</span>}
                  <span style={{ color: colors.muted }}>{e.blatt}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 800, color: e.gewinn > 0 ? "#50804F" : colors.mutedLt }}>{e.gewinn > 0 ? `+${e.gewinn}` : "0"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verlauf */}
        {hand?.log?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", color: colors.muted }}>Verlauf dieser Hand</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12.5, color: K.ink }}>
              {hand.log.map((e, i) => <div key={i}>{aktionText(e, nameVonSeat)}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
