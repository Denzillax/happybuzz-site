"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts } from "@/lib/theme";
import { chartCard, chartLabel } from "@/components/admin/adminStyles";
import { User } from "lucide-react";

// Wer ist gerade online? Liest den Presence-Kanal "online" (gefuellt vom
// PresenceTracker im Layout) und aktualisiert sich in Echtzeit.
const seitenLabel = (p) => {
  if (!p || p === "/") return "Startseite";
  if (p.startsWith("/listing/")) return "Inserat-Seite";
  if (p.startsWith("/listings/new")) return "Inserieren";
  if (p.startsWith("/listings")) return "Meine Inserate";
  if (p.startsWith("/search")) return "Suche";
  if (p.startsWith("/chat")) return "Nachrichten";
  if (p.startsWith("/favorites")) return "Favoriten";
  if (p.startsWith("/settings")) return "Einstellungen";
  if (p.startsWith("/admin")) return "Admin";
  if (p.startsWith("/order/")) return "Bestellseite";
  if (p.startsWith("/fees")) return "Gebühren";
  if (p.startsWith("/hive")) return "Bienenstock";
  if (p.startsWith("/beta")) return "Beta-Seite";
  if (p.startsWith("/how-it-works")) return "So funktioniert's";
  if (p.startsWith("/about")) return "Über uns";
  if (p.startsWith("/impact")) return "Impact";
  if (p.startsWith("/user/") || p.startsWith("/profile/")) return "Profil-Seite";
  return p;
};

const seitText = (iso) => {
  if (!iso) return "";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "gerade gekommen";
  if (min < 60) return `seit ${min} Min.`;
  return `seit ${Math.floor(min / 60)} Std. ${min % 60} Min.`;
};

// Besuchsverlauf: die letzten geloggten Seitenaufrufe (page_visits, 90 Tage)
export function VisitLog() {
  const [eintraege, setEintraege] = useState(null);
  const [heute, setHeute] = useState(null);
  const [offen, setOffen] = useState(false);

  useEffect(() => {
    if (!offen) return;
    let aktiv = true;
    (async () => {
      const { data } = await supabase.from("page_visits")
        .select("user_id, path, created_at")
        .order("created_at", { ascending: false })
        .limit(40);
      const rows = data || [];
      const ids = [...new Set(rows.map((v) => v.user_id).filter(Boolean))];
      let namen = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
        (profs || []).forEach((p) => { namen[p.id] = p.display_name || p.username; });
      }
      const heuteStart = new Date(); heuteStart.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("page_visits").select("id", { count: "exact", head: true }).gte("created_at", heuteStart.toISOString());
      if (!aktiv) return;
      setEintraege(rows.map((v) => ({ ...v, name: v.user_id ? (namen[v.user_id] || "Mitglied") : "Gast" })));
      setHeute(count ?? 0);
    })();
    return () => { aktiv = false; };
  }, [offen]);

  return (
    <div style={{ ...chartCard, marginBottom: 16 }}>
      <button onClick={() => setOffen(!offen)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", border: "none", background: "transparent", cursor: "pointer", padding: 0, textAlign: "left" }}>
        <span style={chartLabel}>Besuchsverlauf</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: colors.muted, fontFamily: fonts.body }}>
          {offen && heute !== null ? `${heute} Aufrufe heute · ` : ""}{offen ? "zuklappen" : "aufklappen"}
        </span>
      </button>
      {offen && (
        eintraege === null ? (
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.muted, fontFamily: fonts.body }}>Lädt…</p>
        ) : eintraege.length === 0 ? (
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.muted, fontFamily: fonts.body }}>Noch keine Einträge. Das Log füllt sich mit jedem Seitenaufruf.</p>
        ) : (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5, maxHeight: 300, overflowY: "auto" }}>
            {eintraege.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontFamily: fonts.body, borderBottom: `1px solid ${colors.cream}`, paddingBottom: 5 }}>
                <span style={{ color: colors.muted, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                  {new Date(v.created_at).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })} {new Date(v.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span style={{ fontWeight: 700, color: v.user_id ? colors.dark : colors.muted }}>{v.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", padding: "2px 8px", borderRadius: 999, background: colors.cream, color: colors.dark, whiteSpace: "nowrap" }}>{seitenLabel(v.path)}</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export function LiveOnline() {
  const [leute, setLeute] = useState(null); // null = laedt

  useEffect(() => {
    // Der PresenceTracker im Layout haelt den Kanal "online" schon offen.
    // Auf einem abonnierten Kanal darf kein Callback mehr registriert werden,
    // darum wird der bestehende Kanal einfach im Takt ausgelesen.
    let eigener = null;
    const lesen = (ch) => {
      const state = ch.presenceState();
      // Ein Eintrag pro Presence-Key (mehrere Tabs desselben Nutzers = 1 Zeile)
      setLeute(Object.entries(state).map(([key, metas]) => ({ key, ...metas[metas.length - 1] })));
    };
    const tick = () => {
      const vorhanden = supabase.getChannels().find((c) => c.topic === "realtime:online");
      if (vorhanden) { lesen(vorhanden); return; }
      // Fallback: falls kein Tracker laeuft, eigenen Lese-Kanal aufmachen
      if (!eigener) {
        eigener = supabase.channel("online");
        eigener.on("presence", { event: "sync" }, () => lesen(eigener)).subscribe();
      }
    };
    tick();
    const iv = setInterval(tick, 2000);
    return () => { clearInterval(iv); if (eigener) supabase.removeChannel(eigener); };
  }, []);

  const angemeldet = (leute || []).filter((p) => !p.guest).sort((a, b) => +new Date(a.seit || 0) - +new Date(b.seit || 0));
  const gaeste = (leute || []).filter((p) => p.guest).length;
  // Skalierung: Namensliste ist gedeckelt; bei Andrang zaehlt eine
  // Bereichs-Zusammenfassung mehr als 1000 Einzelzeilen
  const MAX_ZEILEN = 12;
  const sichtbareZeilen = angemeldet.slice(0, MAX_ZEILEN);
  const weitere = angemeldet.length - sichtbareZeilen.length;
  const bereiche = Object.entries(
    (leute || []).reduce((acc, p) => {
      const l = seitenLabel(p.path);
      acc[l] = (acc[l] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div style={{ ...chartCard, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#2E7D32", boxShadow: "0 0 0 3px #2E7D3233", flexShrink: 0 }} />
        <span style={chartLabel}>Gerade online</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: colors.muted, fontFamily: fonts.body }}>
          {leute === null ? "verbinde…" : `${(leute || []).length} online · ${angemeldet.length} angemeldet${gaeste ? ` · ${gaeste} Gast${gaeste > 1 ? "e" : ""}` : ""}`}
        </span>
      </div>
      {leute !== null && (leute.length === 0 ? (
        <p style={{ margin: "12px 0 0", fontSize: 12.5, color: colors.muted, fontFamily: fonts.body }}>Gerade niemand auf der Seite.</p>
      ) : (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {(leute || []).length > 20 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
              {bereiche.map(([label, n]) => (
                <span key={label} style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: colors.cream, color: colors.dark, fontFamily: fonts.body }}>
                  {label} · {n}
                </span>
              ))}
            </div>
          )}
          {sichtbareZeilen.map((p) => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, fontFamily: fonts.body }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: colors.yellowSoft, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {p.avatar ? <img src={p.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={13} color={colors.yellow} />}
              </div>
              <span style={{ fontWeight: 700, color: colors.dark }}>{p.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", padding: "2px 8px", borderRadius: 999, background: "#E6F5F5", color: colors.tealDark }}>{seitenLabel(p.path)}</span>
              <span style={{ marginLeft: "auto", color: colors.muted, fontSize: 11, whiteSpace: "nowrap" }}>{seitText(p.seit)}</span>
            </div>
          ))}
          {weitere > 0 && (
            <p style={{ margin: "2px 0 0 36px", fontSize: 11.5, color: colors.muted, fontFamily: fonts.body }}>
              + {weitere} weitere angemeldete Nutzer
            </p>
          )}
          {gaeste > 0 && (
            <p style={{ margin: "2px 0 0 36px", fontSize: 11.5, color: colors.muted, fontFamily: fonts.body }}>
              + {gaeste} anonyme{gaeste > 1 ? "" : "r"} Gast{gaeste > 1 ? "e" : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
