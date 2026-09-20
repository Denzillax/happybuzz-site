"use client";
// Poker-Lobby (Denis, 16.09.2026): Tische eroeffnen, offene Tische, meine Tische.
// Texas Hold'em mit Pollen als Chips, zeitversetzt (12 h pro Zug).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spade, Plus, Users, Clock, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import { restzeit } from "@/lib/poker";

const K = { ink: "#191615", sand: "#F5F6F8", honey: "#F4C03F", petrol: "#1D1D1D", hairline: "#E5E8EC", chip: "#F1F3F5" };
const HEAD = "'Instrument Sans', 'General Sans','Instrument Sans', 'Manrope',sans-serif";

export default function PokerLobby() {
  const router = useRouter();
  const [daten, setDaten] = useState(null);
  const [pollen, setPollen] = useState(null);
  const [name, setName] = useState("");
  const [buyIn, setBuyIn] = useState(20);
  const [plaetze, setPlaetze] = useState(4);
  const [busy, setBusy] = useState(false);
  const [hinweis, setHinweis] = useState("");

  const laden = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?redirect=/poker"); return; }
    const [{ data }, { data: p }] = await Promise.all([
      supabase.rpc("poker_tische"),
      supabase.from("profiles").select("xp_total").eq("id", user.id).maybeSingle(),
    ]);
    if (data?.ok) setDaten(data);
    setPollen(p?.xp_total || 0);
  };
  useEffect(() => { laden(); const iv = setInterval(laden, 15000); return () => clearInterval(iv); }, []);

  const erstellen = async () => {
    if (busy) return;
    setBusy(true); setHinweis("");
    const { data, error } = await supabase.rpc("poker_tisch_erstellen", { p_name: name.trim() || "Tisch", p_buy_in: buyIn, p_max: plaetze });
    setBusy(false);
    if (error || !data?.ok) {
      const e = data?.error;
      setHinweis(e === "zu_wenig" ? "Zu wenig Pollen für diesen Buy-in." : e === "zu_viele_tische" ? "Du hast schon drei offene Tische." : e === "name" ? "Gib dem Tisch einen Namen (mindestens 2 Zeichen)." : "Das hat nicht geklappt.");
      return;
    }
    router.push(`/poker/${data.tisch}`);
  };

  const setzen = async (id) => {
    if (busy) return;
    setBusy(true); setHinweis("");
    const { data, error } = await supabase.rpc("poker_setzen", { p_tisch: id });
    setBusy(false);
    if (error || !data?.ok) {
      const e = data?.error;
      setHinweis(e === "zu_wenig" ? "Zu wenig Pollen für diesen Buy-in." : e === "voll" ? "Der Tisch ist inzwischen voll." : "Das hat nicht geklappt.");
      laden(); return;
    }
    router.push(`/poker/${id}`);
  };

  const pill = (aktiv) => ({ padding: "7px 14px", borderRadius: 999, border: `1.5px solid ${aktiv ? K.ink : K.hairline}`, background: aktiv ? K.ink : "#fff", color: aktiv ? "#fff" : K.ink, fontSize: 13, fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" });

  return (
    <div style={{ fontFamily: fonts.body, background: "var(--bd-grund)", minHeight: "100vh", color: K.ink }}>
      <div className="bd-seite">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: K.petrol, marginBottom: 6 }}>Hive · Spiele</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <Spade size={24} color={K.ink} />
          <h1 className="bd-seitentitel" style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: HEAD, letterSpacing: "-0.01em" }}>Poker</h1>
          {pollen != null && <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: colors.muted }}>{pollen} Pollen</span>}
        </div>
        <p style={{ margin: "0 0 22px", fontSize: 14, color: colors.muted, lineHeight: 1.5, maxWidth: 640 }}>
          Texas Hold'em mit Pollen als Chips. Zeitversetzt: wer am Zug ist, hat 12 Stunden und bekommt eine Meldung. Chips wandern nur zwischen den Spielern, 2 Prozent von jedem Pot gehen an den Bienenschutz.
        </p>

        {/* Tisch eroeffnen */}
        <div style={{ background: K.sand, borderRadius: 12, padding: "18px 20px", marginBottom: 22 }}>
          <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800 }}>Tisch eröffnen</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Name des Tischs, z. B. Feierabend-Runde"
              style={{ flex: "1 1 220px", minWidth: 0, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${K.hairline}`, outline: "none", fontSize: 14, fontFamily: fonts.body, background: "#fff" }} />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: colors.muted, fontWeight: 700 }}>Buy-in</span>
              {[20, 50, 100].map(b => <button key={b} type="button" onClick={() => setBuyIn(b)} style={pill(buyIn === b)}>{b}</button>)}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: colors.muted, fontWeight: 700 }}>Plätze</span>
              {[2, 3, 4, 6].map(n => <button key={n} type="button" onClick={() => setPlaetze(n)} style={pill(plaetze === n)}>{n}</button>)}
            </div>
            <button type="button" onClick={erstellen} disabled={busy || (pollen != null && pollen < buyIn)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 999, border: "none", background: K.honey, color: K.ink, fontSize: 13.5, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer", opacity: pollen != null && pollen < buyIn ? .5 : 1 }}>
              {busy ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Eröffnen und hinsetzen
            </button>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: colors.muted }}>Blinds {Math.max(1, Math.round(buyIn / 20))} / {Math.max(1, Math.round(buyIn / 20)) * 2}. Der Buy-in wird beim Hinsetzen von deinen Pollen abgezogen und beim Aufstehen als Chipstand gutgeschrieben. Der Tisch startet, wenn er voll ist oder du ihn ab zwei Spielern startest.</p>
          {hinweis && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#c62828", fontWeight: 700 }}>{hinweis}</p>}
        </div>

        {!daten ? <p style={{ color: colors.muted, fontSize: 13 }}>Lade…</p> : (
          <>
            {/* Meine Tische */}
            <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, fontFamily: HEAD }}>Meine Tische</h2>
            {daten.meine.length === 0 ? (
              <p style={{ margin: "0 0 24px", fontSize: 13, color: colors.muted }}>Du sitzt an keinem Tisch.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, marginBottom: 24 }}>
                {daten.meine.map(t => (
                  <Link key={t.id} href={`/poker/${t.id}`} style={{ display: "block", textDecoration: "none", color: K.ink, border: `1.5px solid ${t.ich_dran ? K.honey : K.hairline}`, background: t.ich_dran ? "#FFF6DB" : "#fff", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                      <ArrowRight size={15} color={colors.muted} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12.5, color: colors.muted, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span><Users size={12} style={{ verticalAlign: "-2px" }} /> {t.belegt} / {t.max_seats}</span>
                      <span>Buy-in {t.buy_in}</span>
                      <span>Chips <b style={{ color: K.ink }}>{t.chips}</b></span>
                      <span>{t.status === "laeuft" ? "läuft" : t.status === "offen" ? "wartet auf Spieler" : t.status}</span>
                    </div>
                    {t.ich_dran && <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 800, color: "#8a6d00", display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} /> Du bist am Zug · noch {restzeit(t.deadline)}</p>}
                  </Link>
                ))}
              </div>
            )}

            {/* Offene Tische */}
            <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, fontFamily: HEAD }}>Offene Tische</h2>
            {daten.offen.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>Gerade kein Tisch mit freiem Platz. Eröffne einen.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {daten.offen.map(t => (
                  <div key={t.id} style={{ border: `1.5px solid ${K.hairline}`, borderRadius: 12, padding: "14px 16px", background: "#fff" }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</p>
                    <div style={{ marginTop: 6, fontSize: 12.5, color: colors.muted, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span><Users size={12} style={{ verticalAlign: "-2px" }} /> {t.belegt} / {t.max_seats}</span>
                      <span>Buy-in {t.buy_in}</span>
                      <span>von {t.ersteller}</span>
                      <span>{t.status === "laeuft" ? "läuft, Einstieg zur nächsten Hand" : "wartet auf Spieler"}</span>
                    </div>
                    <button type="button" onClick={() => setzen(t.id)} disabled={busy || (pollen != null && pollen < t.buy_in)}
                      style={{ marginTop: 10, padding: "8px 16px", borderRadius: 999, border: "none", background: K.petrol, color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: fonts.body, cursor: "pointer", opacity: pollen != null && pollen < t.buy_in ? .5 : 1 }}>
                      Hinsetzen ({t.buy_in} Pollen)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
